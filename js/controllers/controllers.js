    app.controller('AppCtrl', [
        '$scope',
        'Notifier',
        '$timeout',
        'localStorageService',
    function($scope, Notifier, $timeout, localStorageService) {
        window.appCtrl = angular.element('[ng-controller=AppCtrl]').scope();
        $scope.mapa = { filas: 6 };
        $scope.mensajes = {
            mensajeJuego: 'Arrastre el agente y luego haga click en Iniciar',
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
            recompensaMeta: 200,
            castigoMuerte: -100,
            actualizarMeta: function() {
                if (typeof $scope.entorno != undefined) {
                    $scope.entorno.recompensaMeta = this.recompensaMeta;
                }
            }
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
                epsilonFinal: 0.3,
                step: 1,
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
                    agente.politica = new PoliticaGreedy(agente, parametros.epsilon, parametros.epsilonFinal, parametros.step);
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
                if($scope.agente.politica.nombre === "ε-Greedy") {
                    $scope.agente.politica.epsilon = parseFloat($scope.entrenamiento.politicaSeleccionada.epsilon);
                    $scope.agente.politica.epsilonFinal = parseFloat($scope.entrenamiento.politicaSeleccionada.epsilonFinal);
                    $scope.agente.politica.step = parseFloat($scope.entrenamiento.politicaSeleccionada.step);
                    $scope.agente.politica.iteraciones = $scope.entrenamiento.repeticiones;
                    $scope.agente.politica.calcularIncremento();
                    console.log("Entrenando agente con: " +
                        "\n Politica: ε-greedy " +
                        "\n Epsilon inicial: " + $scope.agente.politica.epsilon +
                        "\n Epsilon final: " + $scope.agente.politica.epsilonFinal +
                        "\n Variando el epsilon cada " + $scope.agente.politica.step + " iteraciones" +
                        "\n Con una variación de: " + $scope.agente.politica.variacionEpsilon);
                }
                if ( typeof callbacks.preEntrenamiento === "function") {
                    callbacks.preEntrenamiento();
                }
                this.repeticionActual = 0;
                var comienzoEntrenamiento = new Date();
                async(function () {
                    $scope.$apply(function () {
                        for (var start = +new Date(); $scope.entrenamiento.repeticionActual < $scope.entrenamiento.repeticiones && +new Date() - start < 200; $scope.entrenamiento.repeticionActual++) {
                            if ( typeof callbacks.preRepeticion === "function") {
                                callbacks.preRepeticion($scope.entrenamiento.repeticionActual);
                            }
                            $scope.agente.hacerRepeticion($scope.entrenamiento.repeticionActual);
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
                        var finDeEntrenamiento = new Date();
                        var diferencia = finDeEntrenamiento - comienzoEntrenamiento;
                        console.log(diferencia);
                        diferencia = new Date(diferencia);
                        $scope.entrenamiento.tiempoDeEntrenamiento = diferencia.getSeconds() + 's, ' + diferencia.getMilliseconds() + 'ms';
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
            $scope.entorno.recompensaMeta = $scope.configuracionEntorno.recompensaMeta;
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
                    $scope.entrenamiento.repeticiones = 10000;
                    break;
                default:
                    $scope.entrenamiento.repeticiones = 12000;
            }
            $scope.entorno.partidasJugadas = 0;
            $scope.posicionInicial = $scope.entorno.mapa.posicionAgente;
            $scope.mapa.indices = {
              i: $scope.mapa.filas - 1,
              j: $scope.mapa.columnas -1
            };

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

        $scope.agenteOpciones = {
            onStart: 'cursorChanger'
        }

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
        /*
        Funcion que cambia el cursor en chrome cuando se arrastra la meta o el agente
         */
        $scope.cursorChanger = function (el, ui) {
            console.log(ui);
            $(ui.helper[0]).css('cursor', '-webkit-grabbing');
        };
        $scope.dropCallback = function (ev, ui) {
            //fila y columna del destino
            var i = +ev.target.attributes.fila.value;
            var j = +ev.target.attributes.columna.value;
            //el ng-model me dice si es la meta o un agente
            var objeto = ui.draggable[0].attributes['ng-model'].value;
            var text = (objeto === "meta"? "la meta" : "el agente");
            //primero trato si es valido
            if ($scope.mapa.isParedOPozo(i, j)) {
                Notifier.notify({
                    title: 'Accion no valida!',
                    type: 'info',
                    text: 'No puede posicionarse ' + text + ' sobre una pared o un pozo.'
                });
            } else {
                //muevo la meta o el agente a la columna i,j deseada.
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
            datos: [],

            estrategiasAComparar: [],
            episodiosAGraficar: 3000,
            tiempos: [],
            estrategia: {
                nombre: 'greedy',
                parametros: {
                    epsilon: 0.2,
                    tau: 20
                },
                label: 'Greedy ε = 0.2',
                actualizarLabel: function() {

                    this.label = this.nombre + " ";
                    if (this.nombre === 'greedy') {
                        this.label += "εᵢ =" + this.parametros.epsilon;
                    } else if (this.nombre == 'softmax') {
                        this.label += "τ =" + this.parametros.tau;
                    }
                }
            },
            agregarEstrategia: function(estrategia) {
                var nuevaEstrategia = {};
                nuevaEstrategia.nombre = estrategia.nombre;
                nuevaEstrategia.label = estrategia.label;
                if (nuevaEstrategia.nombre === 'greedy' || nuevaEstrategia.nombre === 'e-greedy' ) {
                    nuevaEstrategia.epsilon = estrategia.parametros.epsilon;
                } else if (nuevaEstrategia.nombre === 'softmax') {
                    nuevaEstrategia.tau = estrategia.parametros.tau;
                }

                this.estrategiasAComparar.push(nuevaEstrategia);
            },
            quitarEstrategia: function(index) {
                this.estrategiasAComparar.splice(index, 1);
            },
            prepararDatos: function() {
                if (typeof($scope.matrizQOptima) == "undefined") {
                    if ($scope.agente.entrenado) {
                        $scope.tomarPoliticaOptimaModal.show();
                    } else {
                        Notifier.notify({
                            title: 'No fue definida una política óptima',
                            type: 'info',
                            text: 'El agente no fue entrenado, primero debe intentar aproximar la política óptima entrenandolo con el panel de entrenamiento.'
                        });
                    }
                } else {
                    if ($scope.grafico.estrategiasAComparar.length == 0) {
                        Notifier.notify({
                           title: 'No se añadieron estregias',
                           type: 'info',
                           text: 'Primero debe añadir las estrategias a comparar en este mismo panel.'
                        });
                        return;
                    }
                    $scope.grafico.datos = [];
                    $scope.entrenamiento.repeticiones = $scope.grafico.episodiosAGraficar;
                    var estrategia = $scope.grafico.estrategiasAComparar.pop();
                    $scope.estrategiaProcesadaActualmente = estrategia;
                    $scope.entrenamiento.repeticiones = $scope.grafico.episodiosAGraficar;
                    $scope.entrenamiento.seleccionarPolitica($scope.agente, {nombre: estrategia.nombre, epsilon: estrategia.epsilon, tau: estrategia.tau});
                    $scope.entrenamiento.entrenarTimeout($scope.callbacksParaEntrenamiento);
                }
            }
        };


        $scope.intervalo = 10;

        $scope.establecerConocimientoActualComoPoliticaOptima = function () {
            $scope.matrizQOptima = $scope.agente.conocimiento.qValuesTable.clone();
        }

        $scope.callbacksParaEntrenamiento = {
            preEntrenamiento: function() {
                var i, j, a;
                $scope.agente.conocimiento.sufrirAmnesia();
                $scope.grafico.datosTemp = [];
                var matrizQActual = $scope.agente.conocimiento.qValuesTable;
                var matrizQOptima = $scope.matrizQOptima;
                var filas = matrizQOptima.length;
                var columnas = matrizQOptima[0].length;
                var acciones = 8;

                var matrizVariaciones = createArray(filas, columnas, acciones);
                var cantidadDeVariados = 0;

                for (i = 0; i < filas; i++) {
                    for (j = 0; j < columnas; j++) {
                        for (a = 0; a < acciones; a++) {
                            if (matrizQOptima[i][j][a] === matrizQActual[i][j][a]) {
                               matrizVariaciones[i][j][a] = false;
                            } else {
                                matrizVariaciones[i][j][a] = true;
                                cantidadDeVariados++;
                            }
                        }
                    }
                }
                $scope.grafico.matrizVariaciones = matrizVariaciones;
                $scope.grafico.cantidadDeVariados = cantidadDeVariados;
                $scope.tiempoInicioProcesamiento = new Date();
                $scope.tiempoCalculado = false;
            },
            preRepeticion: function(numeroIteracion) {
                if (numeroIteracion % $scope.intervalo == 0 || numeroIteracion === 1) {
                    var i, j, a, diferencia, porcentajeFaltante, cantidadDePosiciones, porcentajeAprendido;
                    var matrizQActual = $scope.agente.conocimiento.qValuesTable;
                    var matrizQOptima = $scope.matrizQOptima;
                    var filas = matrizQOptima.length;
                    var columnas = matrizQOptima[0].length;
                    var acciones = 8;
                    var cantidadDeVariaciones = $scope.grafico.cantidadDeVariados;
                    var matrizVariaciones = $scope.grafico.matrizVariaciones;
                    var matrizDiferencia = createArray(filas, columnas, acciones);

                    for (i = 0; i < filas; i++) {
                        for (j = 0; j < columnas; j++) {
                            for (a = 0; a < acciones; a++) {
                                matrizDiferencia[i][j][a] = 0;
                                if (matrizQOptima[i][j][a] !== 0 && matrizVariaciones[i][j][a]) {
                                    diferencia = Math.abs(matrizQActual[i][j][a] - matrizQOptima[i][j][a]);
                                    porcentajeFaltante = diferencia / matrizQOptima[i][j][a] * 100;
                                    matrizDiferencia[i][j][a] = Math.abs(porcentajeFaltante);   //complemento el porcentaje faltante para saber el porcentaje aprendido
                                }
                            }
                        }
                    }

                    porcentajeFaltante = 0;

                    for (i = 0; i < filas; i++) {
                        for (j = 0; j < columnas; j++) {
                            for (a = 0; a < acciones; a++) {
                                if (matrizVariaciones[i][j][a]) {
                                    porcentajeFaltante += matrizDiferencia[i][j][a];
                                }
                            }
                        }
                    }

                    porcentajeFaltante /= cantidadDeVariaciones;
                    porcentajeAprendido = 100 - porcentajeFaltante;
                    $scope.grafico.datosTemp.push([numeroIteracion,porcentajeAprendido]);
                    if (porcentajeAprendido > 95 && !$scope.tiempoCalculado ) {
                        $scope.tiempoFinProcesamiento = new Date();
                        $scope.tiempoProcesamiento = $scope.tiempoFinProcesamiento - $scope.tiempoInicioProcesamiento;
                        var diferencia = new Date($scope.tiempoProcesamiento);
                        var tiempoString = diferencia.getSeconds() + 's, ' + diferencia.getMilliseconds() + 'ms';
                        $scope.tiempoCalculado = true;
                        $scope.grafico.tiempos.push({
                            nombre: $scope.estrategiaProcesadaActualmente.label,
                            tiempo: tiempoString
                        });
                        console.log($scope.grafico.tiempos);
                    }
                }
            },
            postEntrenamiento: function() {
                var data = $scope.grafico.datosTemp;
                var label = $scope.estrategiaProcesadaActualmente.label;
                $scope.grafico.datos.push({
                    name: label,
                    data: data
                });
                if ($scope.grafico.estrategiasAComparar.length > 0) {
                    var estrategia = $scope.grafico.estrategiasAComparar.pop();
                    $scope.estrategiaProcesadaActualmente = estrategia;
                    $scope.entrenamiento.seleccionarPolitica($scope.agente, {nombre: estrategia.nombre, epsilon: estrategia.epsilon, tau: estrategia.tau});
                    $scope.entrenamiento.entrenarTimeout($scope.callbacksParaEntrenamiento);
                } else {
                    $scope.crearGraficoComparativo();
                    $scope.isGraficoComparativoCreado = true;
                }

            }
        }

        $scope.isGraficoComparativoCreado = false;

        $scope.crearGraficoResultadoEntrenamiento = function() {
            $scope.graficoResultadoEntrenamiento = {
                chart: {
                    plotBackgroundColor: null,
                    plotBorderWidth: null,
                    plotShadow: false,
                    height: 200,
                    spacingLeft: 0,
                    marginLeft:1
                },
                credits: {
                    enabled: false
                },
                legend:{
                    title: {
                        text: 'Eventos'
                    },
                    enabled: true,
                    align: 'right',
                    verticalAlign: 'top',
                    width: 80
                },
                title: { text: '' },
                tooltip: {
                    pointFormat: '{point.name}: <b>{point.y}</b>',
                    percentageDecimals: 1
                },
                plotOptions: {
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        dataLabels: {
                            enabled: false
                        },
                        showInLegend: true
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
                    zoomType: 'x',
                    width: 520
                },
                title: {
                    text: 'Comparación de Estrategias'
                },
                credits: {
                    enabled: false
                },
                xAxis: {
                    title: {text: 'Episodios'},
                    type: 'linear'
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
                series: $scope.grafico.datos
            }
        }

        Highcharts.setOptions({
            lang: {
                resetZoom:'Resetear Zoom'
            }
        });
    }]);
