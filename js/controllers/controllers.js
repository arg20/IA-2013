    app.controller('AppCtrl', [
        '$scope',
        'Notifier',
        '$timeout',
        'localStorageService',
    function($scope, Notifier, $timeout, localStorageService) {
        window.appCtrl = angular.element('[ng-controller=AppCtrl]').scope();
        $scope.mapa = { filas: 6 };
        $scope.mensajes = {
            mensajeJuego: 'Partida amigable',
            editor: {
                mouseSobre: {
                    x: '0',
                    y: '0'
                },
                posicionHovered: function () {
                    return '(' + this.mouseSobre.x + ',' + this.mouseSobre.y + ')';
                },
                pincelSeleccionado: function () {
                    return $scope.editor.pincelSeleccionado;
                }
            }
        };
        $scope.configuracionEntorno = {
            filas: 6,
            columnas: 6,
            paredes: 4,
            pozos: 3,
            aleatorio: true,
            recompensaMeta: 90,
            castigoMuerte: -100
        };

        $scope.TipoCamino = TipoCamino;
        $scope.posicionInicial = new Posicion(0, 0);
        $scope.entrenamiento = {
            muertesDelAgente: 0,
            triunfosDelAgente: 0,
            completado: false,
            resultado: [],
            politicaSeleccionada: {
                nombre: 'greedy',
                tau: 200,
                epsilon: 0.3,
                isGreedySeleccionado: function () {
                    return $scope.entrenamiento.politicaSeleccionada.nombre === 'greedy';
                },
                isSoftmaxSeleccionado: function () {
                    return $scope.entrenamiento.politicaSeleccionada.nombre === 'softmax';
                },
                isEGreedySeleccionado: function () {
                    return $scope.entrenamiento.politicaSeleccionada.nombre === 'e-greedy';
                }
            },
            seleccionarPolitica: function (agente, parametros) {
                if (parametros.nombre === 'greedy') {
                    agente.politica = new PoliticaGreedy(agente, parametros.epsilon);
                } else if (parametros.nombre === 'aleatoria') {
                    agente.politica = new PoliticaAleatoria(agente.entorno);
                } else if (parametros.nombre === 'e-greedy') {
                    agente.politica = new PoliticaEGreedy(agente, $scope.epsilon);
                } else if (parametros.nombre === 'softmax') {
                    agente.politica = new PoliticaSoftmax(agente, parametros.tau);
                }
            },
            qlearning: {
                alfa: 1,
                gamma: 0.9,
                qInicial: 0
            },
            repeticiones: 100000,
            repeticionActual: 0,
            getPorcentajeEntrenamiento: function () {
                return (this.repeticionActual / this.repeticiones * 100).toFixed(0);
            },
            getPorcentajeEntrenamientoBarra: function () {
                return { width: this.getPorcentajeEntrenamiento().toString() + '%' };
            },
            actualizarPolitica: function () {
                $scope.entrenamiento.seleccionarPolitica($scope.agente, $scope.entrenamiento.politicaSeleccionada);
            },
            entrenarTimeout: function (callbacks) {

                if (typeof callbacks == "undefined") {
                    callbacks = {}
                }
                function async(fn) {
                    $timeout(fn, 0);
                }
                this.muertesDelAgente = 0;
                this.triunfosDelAgente = 0;
                $scope.agente.conocimiento.alpha = +this.qlearning.alfa;
                $scope.agente.conocimiento.gamma = +this.qlearning.gamma;
                $scope.agente.conocimiento.qInicial = +this.qlearning.qInicial;
                /*                    $scope.agente.conocimiento.sufrirAmnesia();
                 $scope.agente.conocimiento.inicializarConValor(+this.qlearning.qInicial);*/
                $scope.agente.politica.epsilon = $scope.entrenamiento.politicaSeleccionada.epsilon;
                if ( typeof callbacks.preEntrenamiento === "function") {
                    callbacks.preEntrenamiento();
                }
                /*console.log('Entrenando al agente! (' + $scope.entrenamiento.repeticiones + ' repeticiones)\n');
                 console.log('Metodo de seleccion usado: ' + $scope.agente.politica.nombre);
                 console.log($scope.agente.politica.epsilon);*/
                this.repeticionActual = 0;
                async(function () {
                    $scope.$apply(function () {
                        for (var start = +new Date(); $scope.entrenamiento.repeticionActual < $scope.entrenamiento.repeticiones && +new Date() - start < 200; $scope.entrenamiento.repeticionActual++) {
                            $scope.agente.hacerRepeticion();
                            if ( typeof callbacks.postRepeticion === "function") {
                                callbacks.postRepeticion($scope.entrenamiento.repeticionActual);
                            }
                            if ($scope.agente.entorno.isMuerto()) {
                                $scope.entrenamiento.muertesDelAgente++;
                            } else if ($scope.agente.entorno.isVictorioso()) {
                                $scope.entrenamiento.triunfosDelAgente++;
                            }
                        }
                    });
                    if ($scope.entrenamiento.repeticionActual < $scope.entrenamiento.repeticiones) {
                        async(arguments.callee);
                    } else {
                        if ( typeof callbacks.postEntrenamiento === "function") {
                            callbacks.postEntrenamiento();
                        }
                        $scope.entrenamiento.resultado = [
                            [
                                'triunfos',
                                $scope.entrenamiento.triunfosDelAgente
                            ],
                            [
                                'muertes',
                                $scope.entrenamiento.muertesDelAgente
                            ]
                        ];
                        $scope.entrenamiento.completado = true;
                        $scope.agente.entrenado = true;
                        console.log('Entrenamiento finalizado');
                        $scope.entorno.resetearEstado();
                        console.log('Exploracion' + $scope.agente.politica.accionesExploracion);
                        console.log('Explotacion' + $scope.agente.politica.accionesExplotacion);
                        $scope.crearGraficoResultadoEntrenamiento();
                        $scope.posicionInicial = new Posicion($scope.entorno.mapa.posicionAgente.i, $scope.entorno.mapa.posicionAgente.j);
                    }
                });
            },
            resetearEntrenamiento: function () {
                this.muertesDelAgente = 0;
                this.triunfosDelAgente = 0;
                this.completado = false;
                this.repeticionActual = 0;
            },
            entrenar: function () {
                $scope.agente.conocimiento.alpha = +$scope.qlearning.alfa;
                $scope.agente.conocimiento.gamma = +$scope.qlearning.gamma;
                $scope.agente.conocimiento.qInicial = +$scope.qlearning.qInicial;
                $scope.coach.entrenar();
                Notifier.notify({
                    title: 'Entrenamiento finalizado',
                    type: 'info',
                    text: 'El agente fue entrenado durante ' + $scope.coach.repeticiones + ' ciclos.'
                });
            }
        };
        $scope.MatrizQOptima = null;



        $scope.tamano = '6';
        $scope.actualizarTamano = function (nuevoTamano) {
            $scope.tamano = nuevoTamano;
            $scope.configuracionEntorno.filas = +nuevoTamano;
            $scope.configuracionEntorno.columnas = +nuevoTamano;
        };
        $scope.crearAgente = function () {
            $scope.entorno.agente = $scope.agente = new Agente($scope.entorno);
            $scope.entrenamiento.seleccionarPolitica($scope.agente, {
                nombre: 'greedy',
                epsilon: 0.3
            });
        };
        $scope.crearEntorno = function () {
            $scope.entorno = null;
            $scope.agente = null;
            $scope.entrenamiento.resetearEntrenamiento();
            var config = $scope.configuracionEntorno;
            $scope.entorno = new Entorno(config.filas, config.columnas, config.paredes, config.pozos);
            $scope.mapa = $scope.entorno.mapa;
            console.log($scope.entorno.mapa.toString());
            $scope.crearAgente();
            switch ($scope.entorno.mapa.filas) {
                case 6:
                    $scope.entrenamiento.repeticiones = 2000;
                    break;
                case 7:
                    $scope.entrenamiento.repeticiones = 5000;
                    break;
                case 8:
                    $scope.entrenamiento.repeticiones = 75000;
                    break;
                default:
                    $scope.entrenamiento.repeticiones = 100000;
            }
            $scope.entorno.partidasJugadas = 0;
            $scope.posicionInicial = $scope.entorno.mapa.posicionAgente;
            Notifier.notify({
                title: 'Creaci\xf3n, exitosa',
                type: 'info',
                text: 'El entorno, con un mapa de' + config.filas + 'x' + config.columnas + ', ha sido creado con \xe9xito.'
            });
        };
        $scope.isEntornoCreado = function () {
            return $scope.entorno != undefined;
        };
        $scope.resetear = function () {
            $scope.entorno = null;
            $scope.agente = null;
            $scope.entrenamiento.resetearEntrenamiento();
            Notifier.notify({
                title: 'Aplicaci\xf3n reseteada',
                type: 'info',
                text: 'Se ha reseteado la aplicaci\xf3n.'
            });
        };
        $scope.getPoliticaAgente = function () {
            if ($scope.isEntornoCreado()) {
                return $scope.agente.politica.nombre;
            } else {
                return 'Ninguna';
            }
        };
        $scope.amnesia = function () {
            $scope.agente.conocimiento.sufrirAmnesia();
            $scope.agente.entrenado = false;
            $scope.entrenamiento.repeticionActual = 0;
            Notifier.notify({
                title: 'El agente se ha golpeado!',
                type: 'info',
                text: 'El agente ha sufrido amnesia y ha olvidado todos sus conocimientos'
            });
        };
        $scope.isMeta = function (i, j) {
            return $scope.entorno.mapa.posicionMeta.equals(new Posicion(i, j));
        };
        $scope.isPosicionInicial = function (i, j) {
            return $scope.posicionInicial.equals(new Posicion(i, j));
        };
        $scope.editor = {
            pincelSeleccionado: 'Bueno',
            seleccionarPincel: function (nombre) {
                this.pincelSeleccionado = nombre;
            },
            pintar: function (i, j) {
                var tipo = $scope.mapa.getTipoCamino(i, j);
                $scope.mapa.setTipoCamino(TipoCamino.getTipoFromNombre(this.pincelSeleccionado), i, j);
                if (!$scope.mapa.isMapaValido()) {
                    $scope.mapa.setTipoCamino(tipo, i, j);
                    Notifier.notify({
                        title: 'Accion no valida!',
                        type: 'info',
                        text: 'Al poner el obstaculo alli el mapa dejara de ser valido, no se permite esta accion.'
                    });
                }
            }
        };
        $scope.moverAgenteAleatoriamente = function () {
            $scope.entorno.resetearEstado();
            $scope.posicionInicial = new Posicion($scope.entorno.mapa.posicionAgente);
        };
        $scope.jugar = function () {
            $scope.entorno.partidasJugadas++;
            $scope.corrida = new Partida($scope.entorno);
            var resultado = $scope.corrida.correrPartida();
            $scope.agente.agenteView.doAccion(resultado.acciones, function () {
                $scope.$apply(function () {
                    $scope.posicionInicial = new Posicion($scope.entorno.mapa.posicionAgente.i, $scope.entorno.mapa.posicionAgente.j);
                });
            });
        };
        $scope.consulta = {
            fila: 0,
            columna: 0,
            accion: 2,
            resultado: [
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0
            ]
        };
        $scope.consulta.consultarQ = function (i, j, a) {
            if ($.isNumeric(i) && $.isNumeric(j) && $.isNumeric(a)) {
                return $scope.agente.conocimiento.Q([
                    i,
                    j
                ], a);
            }
            return 'Ingrese todos los valores';
        };
        $scope.consulta.consultarQs = function (i, j) {
            if ($.isNumeric(i) && $.isNumeric(j)) {
                $scope.consulta.resultado = $scope.agente.conocimiento.getValoresDeQEnEstado([
                    i,
                    j
                ]);
            }
            return 'Ingrese todos los valores';
        };
        $scope.moverMeta = function (i, j) {
            if ($scope.entorno.mapa.isParedOPozo(i, j)) {
                return false;
            }
            $scope.entorno.mapa.posicionMeta = new Posicion(i, j);
            return true;
        };
        $scope.opcionesCasillero = {
            onDrop: 'dropCallback',
            tolerance: 'intersect'
        };

        $scope.agenteOpcionesJqueryUI = {
            revert: 'invalid',
            revertDuration: 150
        }
        $scope.cursorChanger = function (el, ui) {
            console.log(ui);
            $(ui.helper[0]).css('cursor', '-webkit-grabbing');
        };
        $scope.dropCallback = function (ev, ui) {
            var i = +ev.target.attributes.fila.value;
            var j = +ev.target.attributes.columna.value;
            var objeto = ui.draggable[0].attributes['ng-model'].value;
            console.log(objeto);
            if ($scope.mapa.isParedOPozo(i, j)) {
                Notifier.notify({
                    title: 'Accion no valida!',
                    type: 'info',
                    text: 'No puede posicionarse la meta sobre una pared o un pozo.'
                });
            } else {
                if (objeto === 'meta') {
                    $scope.entorno.mapa.posicionMeta = new Posicion(i, j);
                } else if (objeto === 'agente') {
                    $scope.entorno.mapa.posicionAgente = new Posicion(i, j);
                    $scope.posicionInicial = $scope.entorno.mapa.posicionAgente = new Posicion(i, j);
                }
            }
        };
        /*
         Generacion de graficos, experimental
         */
        $scope.grafico = {
            datos: {
                Greedy: {
                    name: 'Greedy',
                    data: []
                },
                Softmax: [],
                Aleatoria: []
            }
        };

        $scope.intervalo = 300;

        $scope.establecerConocimientoActualComoPoliticaOptima = function () {
            $scope.matrizQOptima = $scope.agente.conocimiento.qValuesTable.clone();
        }

        $scope.callbacksParaEntrenamiento = {
            postRepeticion: function(numeroIteracion) {
                if (numeroIteracion % $scope.intervalo == 0 && numeroIteracion > 0 || numeroIteracion === 1) {
                    var i, j, a, diferencia, porcentajeFaltante, cantidadDePosiciones, porcentajeAprendido;
                    var matrizQActual = $scope.agente.conocimiento.qValuesTable;
                    var matrizQOptima = $scope.matrizQOptima;
                    var filas = matrizQOptima.length;
                    var columnas = matrizQOptima[0].length;
                    var acciones = 8;
                    cantidadDePosiciones = filas * columnas * acciones;
                    var matrizDiferencia = createArray(filas, columnas, acciones);
                    for (i = 0; i < filas; i++) {
                        for (j = 0; j < columnas; j++) {
                            for (a = 0; a < acciones; a++) {
                                matrizDiferencia[i][j][a] = 0;
                                if (matrizQOptima[i][j][a] !== 0) {
                                    diferencia = Math.abs(matrizQActual[i][j][a] - matrizQOptima[i][j][a]);
                                    porcentajeFaltante = diferencia / matrizQOptima[i][j][a] * 100;
                                    matrizDiferencia[i][j][a] = porcentajeFaltante;   //complemento el porcentaje faltante para saber el porcentaje aprendido
                                }
                            }
                        }
                    }

                    porcentajeFaltante = 0;

                    for (i = 0; i < filas; i++) {
                        for (j = 0; j < columnas; j++) {
                            for (a = 0; a < acciones; a++) {
                                porcentajeFaltante += matrizDiferencia[i][j][a];
                            }
                        }
                    }

                    porcentajeFaltante /= cantidadDePosiciones;
                    porcentajeAprendido = 100 - porcentajeFaltante;
                    $scope.grafico.datos[$scope.agente.politica.nombre].data.push([numeroIteracion,porcentajeAprendido]);
                }
            },
            postEntrenamiento: function() {
                $scope.crearGraficoComparativo();
                $scope.isGraficoComparativoCreado = true;
            }
        }

        $scope.isGraficoComparativoCreado = false;

        $scope.crearGraficoResultadoEntrenamiento = function() {
            $scope.graficoResultadoEntrenamiento = {
                chart: {
                    plotBackgroundColor: null,
                    plotBorderWidth: null,
                    plotShadow: false,
                    height: 200
                },
                title: { text: "Entrenamiento" },
                tooltip: {
                    pointFormat: '{point.name}: <b>{point.y}</b>',
                    percentageDecimals: 1
                },
                plotOptions: {
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        dataLabels: {
                            enabled: false,
                            color: '#000000',
                            connectorColor: '#000000',
                            formatter: function () {
                                return '<b>' + this.point.name + '</b>: ' + this.percentage + ' %';
                            },
                            showInLegend: true
                        }
                    }
                },
                series: [{
                    type: 'pie',
                    name: 'Resultado de Entrenamiento',
                    data: $scope.entrenamiento.resultado
                }]
            }
        }

        $scope.crearGraficoResultadoEntrenamiento();

        $scope.crearGraficoComparativo = function() {
            $scope.graficoComparativo = {
                chart: {
                    plotBackgroundColor: null,
                    plotBorderWidth: null,
                    plotShadow: false,
                    zoomType: 'x'
                },
                xAxis: {
                    title: {text: 'Episodios'},
                    type: 'logarithmic'
                },
                yAxis: {
                    title: {
                        text: 'Porcentaje (°%)'
                    },
                    labels: {
                        formatter: function() {
                            return this.value + ' %';
                        }
                    },
                    plotLines: [{
                        value: 0,
                        width: 1,
                        color: '#808080'
                    }],
                    max: 100,
                    min: 0
                },
                plotOptions: {
                    line: {
                        marker: {
                            enabled: false
                        }
                    }
                },
                series: [$scope.grafico.datos.Greedy]
            }
        }
    }]);
