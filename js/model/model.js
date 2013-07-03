

function Entorno(filas, columnas, paredes, pozos) {
    var self = this;
    if (arguments.length == 1) {
        var size = Math.sqrt(filas.length - 1);
        this.filas = size;
        this.columnas = size;
        this.mapa = new Mapa(filas);
        this.agente = {};
        this.recompensaMeta = 90;
        this.recompensa = 0;
    } else {
        this.filas = filas;
        this.columnas = columnas;
        this.mapa = new Mapa(filas, columnas, paredes, pozos);
        this.agente = {};
        this.recompensaMeta = 90;
        this.recompensa = 0;
    }


    this.moverAgenteAleatoriamente = function () {
        self.mapa.posicionAgente = self.mapa.getPosicionAleatoriaSinPozos();
    };

    this.moverMetaAleatoriamente = function () {
        self.mapa.posicionMeta = self.mapa.getPosicionAleatoriaSinPozos();
};

    this.calcularRecompensa = function() {

        var posicionAgente = self.mapa.posicionAgente;

        //el vago llegó a la meta
        if (self.mapa.posicionMeta.equals(posicionAgente)) {
            return self.recompensaMeta;
        }

        var camino = self.mapa.getTipoCamino(posicionAgente);

        //no está en la meta
        return camino.recompensa;
    };

    this.isVictorioso = function () {
        return self.mapa.posicionAgente.equals(self.mapa.posicionMeta);

    };

    this.isMuerto = function () {
        return self.mapa.getTipoCamino(self.mapa.posicionAgente) === TipoCamino.POZO;

    };

    this.getEstado = function () {
        return [self.mapa.posicionAgente.i, self.mapa.posicionAgente.j];
    };

    this.ejecutarAccion = function (accion) {
        // accion es accion del agente:  0=arriba 1=arriba-derecha 2=derecha 3=abajo-derecha ... 7=arriba-izquierda
        if (self.mapa.isAccionValida(accion)) {
            self.mapa.posicionAgente = self.mapa.getCoordenadasDeAccion(accion);
        } else {
            console.log("El agente intento pasar por una pared al hacer la accion: " + accion);
        }
        // actualizar recompensa
        self.recompensa = self.calcularRecompensa();

        return self.getEstado();
    };

    this.isEstadoFinal = function () {
        //si cayo en pozo
        if (TipoCamino.POZO == self.mapa.getTipoCamino(self.mapa.posicionAgente)) {
//            console.log("Cayo en un pozo. :facepalm: .. El pozo fue el que esta en: (" + self.mapa.posicionAgente.i + "," + self.mapa.posicionAgente.j + ")");
            return true;
        }
        //si llego a meta
        if (self.mapa.posicionAgente.equals(self.mapa.posicionMeta)) {
//            console.log("Llego a la meta!! :airpunch:");
            return true;
        }
        //si no occurren ninguno de los dos, no es estado final
        return false;
    };

    this.moverAgenteAleatoriamente();

    if (arguments.length > 1) {
        this.moverMetaAleatoriamente();
    }

    this.resetearEstado = function () {
        do {
            self.moverAgenteAleatoriamente();
        } while (self.mapa.posicionAgente.equals(self.mapa.posicionMeta));

        return self.getEstado();
    };

    this.isAccionValida = function(accion) {
        return self.mapa.isAccionValida(accion);
    }

    this.getAccionesValidasEnEstado = function() {
        return self.mapa.getAccionesValidas(self.mapa.posicionAgente.i, self.mapa.posicionAgente.j);
    }
}

function Mapa(filas, columnas, numParedes, numPozos) {

    var self = this;
    //tipo camino
    if (arguments.length == 1) {
        var serialized = filas;
        var size = Math.sqrt(serialized.length - 1);
        this.filas = size;
        this.columnas = size;
        this.cantidadDeParedes = (serialized.match(/1/g)||[]).length;
        this.cantidadDePozos = (serialized.match(/0/g)||[]).length;
        this.mapa = createArray(this.filas, this.columnas);
    } else {

    this.filas = filas;
    this.columnas = columnas;
    this.cantidadDeParedes = numParedes;
    this.cantidadDePozos = numPozos;
    this.mapa = createArray(filas, columnas);
    }



    this.getPosicionAleatoria = function () {
        var nx, ny;
        do {
            nx = getRandomInt(0, self.filas - 1);
            ny = getRandomInt(0, self.columnas - 1);
            //hago esto porque puede ser que me de un par (i,j) en donde haya una pared, entonces es una posicion valida pero no legal.
        } while (!self.isLegal(nx, ny));
        return new Posicion(nx, ny);

    };

    this.getPosicionAleatoriaSinPozos = function () {
        var nx, ny;
        do {
            nx = getRandomInt(0, self.filas - 1);
            ny = getRandomInt(0, self.columnas -1);
            //hago esto porque puede ser que me de un par (i,j) en donde haya una pared, entonces es una posicion valida pero no legal.
        } while (self.isParedOPozo(nx, ny));
        return new Posicion(nx, ny);
    };


    this.resetearMapa = function () {
        for (var j = 0; j < self.columnas; j++) {
            for (var i = 0; i < self.filas; i++) {
                self.mapa[i][j] = TipoCamino.NEUTRAL;
            }
        }

    };

    this.crearMapaAleatoriamente = function () {
        var layoutValido = false;
        while (!layoutValido) {
            self.resetearMapa();

            var xmid = self.filas / 2;
            var ymid = self.columnas / 2;
            var dx2;
            var dy2;
            var factorDeAlineamientoCentral;
            var k, i, j, p;   //temporales

            for (k = 0; k < self.cantidadDeParedes; k++) {
                p = self.getPosicionAleatoria();
                // Dentro de todo queremos que esten medio en el centro, entonces primero calculamos las distancias al cuadrado (d^2), con d = Xm - X
                dx2 = Math.pow((xmid - p.i), 2);
                dy2 = Math.pow((ymid - p.j), 2);

                factorDeAlineamientoCentral = Math.sqrt((dx2 + dy2) / (xmid * xmid + ymid * ymid));
                if (Math.random() < factorDeAlineamientoCentral) {
                    // continuamos con la generacion primero rechazando esta pared..
                    k--;
                    continue;
                }
                self.setTipoCamino(TipoCamino.PARED, p.i, p.j);
            }

            for (k = 0; k < self.cantidadDePozos; k++) {
                p = self.getPosicionAleatoriaSinPozos();
                // hago lo mismo, solo que esta vez con pozos
                dx2 = Math.pow(xmid - p.i, 2);
                dy2 = Math.pow(ymid - p.j, 2);
                factorDeAlineamientoCentral = Math.sqrt((dx2 + dy2) / (xmid * xmid + ymid * ymid));
                if (Math.random() < factorDeAlineamientoCentral) {
                    // rechazar pozo
                    k--;
                    continue;
                }
                self.setTipoCamino(TipoCamino.POZO, p.i, p.j);
            }
            if (self.isMapaValido()) {
                layoutValido = true;
            }
        }

        for (i = 0; i < self.filas; i++) {
            for (j = 0; j < self.columnas; j++) {
                //si no es una pared o un pozo, tomamos aleatoriamente algun tipo de camino (malo, excelente, etc) y lo asignamos al lugar
                if (!self.isParedOPozo(i, j)) {
                    self.setTipoCamino(TipoCamino.getRandomSinParedNiPozo(), i, j);
                }
            }
        }
    };

    this.isMapaValido = function () {

        var matrizDePozosYParedes = createArray(self.filas, self.columnas);
        var i,j;

        for (i = 0; i < self.filas; i++) {
            for (j = 0; j < self.columnas; j++) {
                matrizDePozosYParedes[i][j] = self.isParedOPozo(i, j);
            }
        }

        //recursividad para ver si se puede pasar por las posiciones libres
        var encontrado = false;
        search:
            for (i = 0; i < this.filas; i++) {
                for (j = 0; j < columnas; j++) {
                    if (!matrizDePozosYParedes[i][j]) {
                        // esta posicion no tiene pozos ni paredes, hay que ver los vecinos para saber si es transitable
                        rellenarVecinos(matrizDePozosYParedes, i, j);
                        encontrado = true;
                        break search;
                    }
                }
            }

        //mapa no valido
        if (!encontrado) {
            return false;
        }
        // ver si quedan espacios libres, si los hay despues de haber rellenado los espacios, no es valido el mapa
        for (i = 0; i < matrizDePozosYParedes.length; i++) {
            for (j = 0; j < matrizDePozosYParedes[0].length; j++) {
                if (!matrizDePozosYParedes[i][j]) {
                    return false;
                }
            }
        }
        return true;
    };

    var rellenarVecinos = function (c, x, y) {
        c[x][y] = true;
        for (var i = x - 1; i <= x + 1; i++) {
            for (var j = y - 1; j <= y + 1; j++) {
                if ((i >= 0) && (i < c.length) && (j >= 0) && (j < c[0].length) && (!c[i][j])) {
                    rellenarVecinos(c, i, j);
                }
            }
        }
    };

    this.setTipoCamino = function (tipo, i, j) {
        if (this.isValido(i, j)) {
            self.mapa[i][j] = tipo;
        }
    };

    this.isValido = function (i, j) {
        return ((i >= 0) && (i < this.filas) && (j >= 0) && (j < this.columnas));
    };

    this.isLegal = function (i, j) {
        return (self.isValido(i, j)) && (!self.isPared(i,j));
    };

    this.isParedOPozo = function (i, j) {
        if (!self.isValido(i, j)) {
            return false;
        }
        return ((self.isPared(i, j) || (self.isPozo(i, j))));
    };

    this.isPozo = function (i, j) {
        if (!self.isValido(i, j)) {
           return false;
        }
        return (self.mapa[i][j].equals(TipoCamino.POZO));
    };

    this.isPared = function (i, j) {
        if (!self.isValido(i, j)) {
            return false;
        }
        return (self.mapa[i][j].equals(TipoCamino.PARED));
    };

    this.getTipoCamino = function (i, j) {
        if (arguments.length === 1) {
            if (self.isValido(i.i, i.j)) {
                return self.mapa[i.i][i.j];
            }
        }

        if (self.isValido(i, j)) {
            return self.mapa[i][j];
        }
        throw new Error("Cordenada fuera del mapa");
    };

    this.isAccionValida = function (accion) {
        var coordenadasAccion = self.getCoordenadasDeAccion(accion);
        return (self.isLegal(coordenadasAccion.i, coordenadasAccion.j));
    };

    this.getCoordenadasDeAccion = function (action) {
        var ai = self.posicionAgente.i, aj = self.posicionAgente.j;
        return self.estimarProxEstado(ai,aj,action);
    };

    this.estimarProxEstado = function(i,j,a) {
        var ai = i; var aj = j; var action = a;
        switch (action) {
            //arriba
            case 0:
                ai--;
                break;
            //arriba-derecha
            case 1:
                ai--;
                aj++;
                break;
            //derecha
            case 2:
                aj++;
                break;
            //abajo-derecha
            case 3:
                ai++;
                aj++;
                break;
            //abajo
            case 4:
                ai++;
                break;
            case 5:
                ai++;
                aj--;
                break;
            case 6:
                aj--;
                break;
            case 7:
                ai--;
                aj--;
                break;
            default:
            //eeeemmm..no es una accion posible. solo se pueden acciones de 0 a 7 (8 acciones)
        }
        return new Posicion(ai, aj);
    }

    this.toString = function () {

        var pos, separadorFila;
        var resultado = "";
        for (var a = 0; a < this.columnas; a++) {
            separadorFila = " ------------";
        }
        for (var i = 0; i < this.filas; i++) {
            resultado += separadorFila;
            resultado += "\n|";
            var etiqueta;
            for (var j = 0; j < this.columnas; j++) {
                pos = new Posicion(i, j);
                if (self.posicionMeta !== null && self.posicionMeta.equals(pos)) {
                    var meta = "META";
                    if (self.posicionAgente.equals(pos)) {
                        meta += "*";
                    }
                    resultado += _.str.center(meta, 12);
                    resultado += "|";
                } else {
                    etiqueta = self.getTipoCamino(i, j).nombre;
                    if (self.posicionAgente.equals(pos)) {
                        etiqueta += "*";
                    }
                    resultado += _.str.center(etiqueta, 12);
                    resultado += "|";
                }
            }
            resultado += "\n";
        }
        resultado += separadorFila;
        return resultado;
    };

    if (arguments.length > 1) {
        this.crearMapaAleatoriamente();
    } else {
        var ventana = 0;
        for (var fil = 0; fil < this.filas; fil++) {
            for (var col = 0; col < this.columnas; col++) {
                var tipo = TipoCamino.getTipoFromValor(serialized[ventana]);
                self.setTipoCamino(tipo,fil, col);
                ventana++;
                if (serialized[ventana] === 'm') {
                    self.posicionMeta = new Posicion(fil, col);
                    ventana++;
                }
            }
        }
    }

    this.getAccionesValidas = function(i,j) {
        var acciones = [];
        var posicionTemp;
        for (var a = 0; a < 8; a++) {
            posicionTemp = self.estimarProxEstado(i,j,a);
            if (self.isLegal(posicionTemp.i,posicionTemp.j)) {
                acciones.push(a);
            }
        }
        return acciones;
    }

    this.stringify = function() {
        var mapString = "";
        for (var i = 0; i < this.filas; i++) {
            for (var j = 0; j < this.columnas; j++) {
                mapString += self.getTipoCamino(i,j).valor;
                var p = new Posicion(i,j);
                if (self.posicionMeta.equals(p)) {
                    mapString += 'm';
                }
            }
        }
        return mapString;
    }

}



var TipoCamino = {
    POZO : new Camino(0,"Pozo", -100),
    PARED: new Camino(1,"Pared",-100),
    MALO: new Camino(2, "Malo",0.05 ),
    NEUTRAL: new Camino(3, "Neutral", 0.10),
    BUENO: new Camino(4, "Bueno", 0.25),
    EXCELENTE: new Camino(5, "Excelente", 0.75),
    getRandomSinParedNiPozo: function() {
        return [TipoCamino.MALO,TipoCamino.NEUTRAL,TipoCamino.BUENO,TipoCamino.EXCELENTE][getRandomInt(0,3)];
    },
    getTipoFromNombre: function(nombre) {
        return TipoCamino[nombre.toUpperCase()];
    },
    getTipoFromValor: function(valor) {
        for (props in TipoCamino) {
            if (TipoCamino[props].valor == valor) {
                return TipoCamino[props];
            }
        }
    }
};

function Camino(valor, nombre, recompensa) {
    this.valor = valor;
    this.nombre = nombre;
    this.recompensa = recompensa;

    return this;
}

Camino.prototype.equals = function (obj) {
    return this.valor === obj.valor;
};


function Agente(entorno) {

    var self = this;

    this.entorno = entorno;

    this.conocimiento = new Conocimiento(entorno.filas, entorno.columnas, 8, entorno.qInicial, entorno.mapa);

    this.entrenado = false;

    this.politica = undefined;

    // execute one epoch
    this.hacerRepeticion = function(numeroDeRepeticion) {

        // Reset estado to start position defined by the world.
        self.entorno.resetearEstado();

        var estadoAnterior;
        var accion;
        var estadoNuevo;
        var recompensa;

        while (!self.entorno.isEstadoFinal()) {

            estadoAnterior = self.entorno.getEstado();

            //Yo, el agente, decido la proxima accion que voy a tomar teniendo en cuenta mi politica (greedy, softmax, etc)
            accion = self.politica.seleccionarAccion(self.entorno.getEstado(), numeroDeRepeticion);
            //System.out.print(accion);

            //ya decidi mi accion, ahora se la comunico a mi entorno, es decir, la llevo a cabo.
            estadoNuevo = self.entorno.ejecutarAccion(accion);

            //el entorno me responde con un estimulo.. ej: si cai a un pozo me reprende, si elegi un buen camino me recompensa, etc.
            recompensa = self.entorno.recompensa;

            self.conocimiento.aprender(estadoAnterior, estadoNuevo, accion, recompensa);

        }


    }
}



function Conocimiento(filas, columnas, cantidadDeAcciones, qInicial, mapa) {
    // Array qValuesTable;
    var self = this;

    var qValues;

    this.qValuesTable = createArray(filas,columnas,cantidadDeAcciones);

    var actions = 8;

    this.alpha = 1;
    this.gamma = 0.97;

    this.qInicial = qInicial || 0;

    var cantidadDeEstadosPosibles = filas * columnas * cantidadDeAcciones;

    console.log("Estados posibles: " + cantidadDeEstadosPosibles);

    this.inicializarConValor = function (valorInicial) {
        var proxEstado;
        for (var i = 0; i < filas; i++) {
            for (var j = 0; j < columnas; j++) {
                for (var a = 0; a < cantidadDeAcciones; a++) {
                    proxEstado = mapa.estimarProxEstado(i,j,a);
                    if ((!mapa.isParedOPozo(proxEstado.i, proxEstado.j)) && (mapa.isValido(proxEstado.i,proxEstado.j)) && (!mapa.isParedOPozo(i,j)) ) {
                        self.qValuesTable[i][j][a] = valorInicial;
                    } else {
                        self.qValuesTable[i][j][a] = 0;
                    }
                }
            }
        }

    };

    this.inicializarConValor(this.qInicial);

    this.aprender = function (s, estadoAlQuePase, a, recompensa) {

        var Qactual = self.Q(s, a);
        var Qmax = self.Qmax(estadoAlQuePase);
        //ahora hago calculo para actualizar el Q

        var Qnuevo = Qactual + self.alpha * (recompensa + self.gamma * Qmax - Qactual);
        self.setValorDeQ(s, a, Qnuevo);
    };

    this.getValoresDeQEnEstado = function (estado) {

        return self.qValuesTable[estado[0]][estado[1]];

    };

    this.setValorDeQ = function (estado, action, nuevoQ) {

        self.qValues = self.getValoresDeQEnEstado(estado);

        self.qValues[action] = nuevoQ;

    };

    this.Qmax = function (estado) {
        self.qValues = self.getValoresDeQEnEstado(estado);

        return Math.max.apply(null, self.qValues);
    };

    this.Q = function (estado, accion) {

        return self.qValuesTable[estado[0]][estado[1]][accion];

    };

    /**
     * El conocimiento del agente elige la mejor accion posible basandose en los
     * valores de Q obtenidos del aprendizaje.
     *
     * @param estado
     * @return
     */
    this.getMejorAccionPosible = function (estado) {

        var maxQ = Number.MIN_VALUE;
        var selectedAction = -1;
        qValues = self.getValoresDeQEnEstado(estado);
        var doubleValues = createArray(qValues.length);
        var maxDV = 0;

        for (var action = 0; action < qValues.length; action++) {
            //System.out.println( "STATE: [" + estado[0] + "," + estado[1] + "]" );
            //System.out.println( "action:qValue, maxQ " + action + ":" + qValues[action] + "," + maxQ );

            if (qValues[action] > maxQ) {
                selectedAction = action;
                maxQ = qValues[action];
                maxDV = 0;
                doubleValues[maxDV] = selectedAction;
            } else if (qValues[action] == maxQ) {
                maxDV++;
                doubleValues[maxDV] = action;
            }
        }

        if (maxDV > 0) {
            //System.out.println( "DOUBLE values, random selection, maxdv =" + maxDV );
            var randomIndex = getRandomInt(0, maxDV - 1);
            selectedAction = doubleValues[randomIndex];
        }


        if (selectedAction == -1) {
            //System.out.println("RANDOM Choice !" );
            selectedAction = getRandomInt(0, 7);
        }

        return selectedAction;

    };

    this.sufrirAmnesia = function() {
        this.inicializarConValor(this.qInicial);

    }

}



function PoliticaGreedy(agente, epsilon, epsilonFinal, step) {
    var self = this;
    this.epsilonFinal = epsilonFinal || epsilon;
    this.step = step || 1;

    this.nombre = "ε-Greedy";
    this.accionesExploracion = 0;
    this.accionesExplotacion = 0;
    this.epsilon = parseFloat(epsilon);
    //Iteraciones totales de todo el entrenamiento
    this.iteraciones = 1;
    this.ultimaIteracionActualizada = 0;

    this.calcularIncremento = function() {
        var cantidadDeIncrementos = self.iteraciones / self.step;
        self.variacionEpsilon = (self.epsilonFinal - self.epsilon) / cantidadDeIncrementos;
    }

    this.seleccionarAccion = function(estado, iteracion) {


        if (iteracion % self.step === 0 && iteracion !== self.ultimaIteracionActualizada ) {
           self.ultimaIteracionActualizada = iteracion;
           self.epsilon += self.variacionEpsilon;
        }

        var valoresDeQEnEstado = agente.conocimiento.getValoresDeQEnEstado(estado);

        //explora a menos que caiga dentro de la probabilidad aleatoria mas adelante
        var accionElegida = -7;

        var maxQ = -Number.MAX_VALUE;
        var accionAsociadaAQmaximoRepetido = createArray(valoresDeQEnEstado.length);
        var cantidadDeQsMaximosRepetidos = 0;

        //Si  Math.random() > probabilidadAleatoria entonces usar el conocimiento adquirido
        if (Math.random() > self.epsilon) {

            for (var accion = 0; accion < valoresDeQEnEstado.length; accion++) {

                if (valoresDeQEnEstado[accion] > maxQ) {
                    accionElegida = accion;
                    maxQ = valoresDeQEnEstado[accion];
                    cantidadDeQsMaximosRepetidos = 0;
                    accionAsociadaAQmaximoRepetido[cantidadDeQsMaximosRepetidos] = accionElegida;
                } else if (valoresDeQEnEstado[accion] == maxQ) {
                    //entra aca si el mayor Q encontrado hasta ahora se da para mas de una accion.
                    cantidadDeQsMaximosRepetidos++;
                    accionAsociadaAQmaximoRepetido[cantidadDeQsMaximosRepetidos] = accion;
                }
            }
            self.accionesExplotacion++;
            //(c) ver mas adelante
            if (cantidadDeQsMaximosRepetidos > 0) {

                var indiceAleatorio = getRandomInt(0,cantidadDeQsMaximosRepetidos - 1);
                accionElegida = accionAsociadaAQmaximoRepetido[indiceAleatorio];
            }
        }

        /*
         *fin de la busqueda del mayor Q.. hasta aca hay varias posibilidaddes:
         * a) Todos los Qs posibles para ese estado son 0.. (cuando el agente recien comienza a conocer el mapa)
         * b) Salio que debe hacerse un movimiento aleatorio, asi que no se ejecuto la busqueda del mejor Q.
         * c) Hay varios Q maximos para este estado y una accion dada, entonces elijo aleatoriamente las acciones que tengan ese Q.
         * d) Hay un solo Q maximo para una accion en este estado, en cuyo caso, elijo esa accion.
         */

        // a y b) (accion aleatoria o Qs son 0).
        if (accionElegida == -7) {
            self.accionesExploracion++;
            accionElegida = getRandomInt(0,7);
        }

        // si elige una accion de forma aleatoria, puede ser que no sea valida, entonces, pedimos al entorno las acciones validas y elegimos desde ahi.
        if (!agente.entorno.isAccionValida(accionElegida)) {
            var accionesValidas = agente.entorno.getAccionesValidasEnEstado();
            accionElegida = accionesValidas[getRandomInt(0, accionesValidas.length)];
        }

        return accionElegida;

    }
}

function PoliticaAleatoria(entorno) {

    this.seleccionarAccion = function (estado) {

        var accionElegida = getRandomInt(0,7);
        if (entorno.isAccionValida(accionElegida)) {
            var accionesValidas = entorno.getAccionesValidasEnEstado();
            accionElegida = accionesValidas[getRandomInt(0, accionesValidas.length)];
        }
        return accionElegida;
    };

   this.nombre = "Aleatoria";

}

function PoliticaSoftmax(agente, tau) {
    var self = this;
    this.nombre = "Softmax";
    this.tau = tau;

    this.seleccionarAccion = function(estado) {
        var qValues = agente.conocimiento.getValoresDeQEnEstado(estado);
        var resultado = -1;
        var accionElegida;

        var prob = createArray(qValues.length);
        var sumProb = 0;

        for (accionElegida = 0; accionElegida < qValues.length; accionElegida++) {
            prob[accionElegida] = Math.exp(qValues[accionElegida] / self.tau);
            sumProb += prob[accionElegida];
        }
        for (accionElegida = 0; accionElegida < qValues.length; accionElegida++) {
            prob[accionElegida] = prob[accionElegida] / sumProb;
        }

        var valid = false;
        var rndValue;
        var offset;

        do {

            rndValue = Math.random();
            offset = 0;

            for (accionElegida = 0; accionElegida < qValues.length; accionElegida++) {
                if (rndValue > offset && rndValue < offset + prob[accionElegida]) {
                    resultado = accionElegida;
                }
                offset += prob[accionElegida];
                // System.out.println( "Action " + accion + " chosen with " + prob[accion] );
            }

            if (agente.entorno.isAccionValida(resultado)) {
                valid = true;
            }

        } while (!valid);

        return resultado;

    }
}

function Coach(agent) {

    var self = this;

    this.repeticiones = 0;

    var agente = agent;

    var entornoDelAgente = agent.entorno;

    this.entrenamiento = {
        muertesDelAgente: 0,
        triunfosDelAgente: 0
    };


    this.repeticionActual = 0;

    this.setAgente = function (agent) {
        agente = agent;
        entornoDelAgente = agente.entorno;
    };

    this.entrenar = function() {
        console.log("Entrenando al agente! (" + self.repeticiones + " repeticiones)\n");
        console.log("Metodo de seleccion usado: " + agente.politica.nombre);
        for (self.repeticionActual = 0; self.repeticionActual < self.repeticiones; self.repeticionActual++) {

            agente.hacerRepeticion();
            if (entornoDelAgente.isMuerto()) {
                self.entrenamiento.muertesDelAgente++;
            } else if (entornoDelAgente.isVictorioso()) {
                self.entrenamiento.triunfosDelAgente++;
            }

        }
        agente.entrenado = true;
        console.log("Entrenamiento finalizado");
        entornoDelAgente.resetearEstado();
    }

}

function Partida(entorno) {
    var self = this;
    this.estado = entorno.getEstado();
    var resultado = {
        acciones: [],
        caminosRecorridos: {}
    };

    this.correrPartida = function(callbacks) {
        if (typeof callbacks == "undefined") {
            callbacks = {}
        }
        var movimientos = 20;
        var flagVueltasEnCiculos = false;
        var casillerosRecorridos = [];
        var nombreEstado = "(" + self.estado[0] + "," + self.estado[1] + ")";
        casillerosRecorridos.push(nombreEstado);
        var tipoCamino;
        if ( typeof callbacks.prePartida === "function") {
            callbacks.prePartida();
        }
        while ( !entorno.isEstadoFinal() && (!flagVueltasEnCiculos || movimientos > 0 )) {
            var accion = entorno.agente.conocimiento.getMejorAccionPosible(self.estado);
            if (!entorno.isAccionValida(accion)) {
                var accionesValidas = entorno.mapa.getAccionesValidas(self.estado[0], self.estado[1]);
                accion = accionesValidas[getRandomInt(0,(accionesValidas.length -1))];
            }
            resultado.acciones.push(accion);
            if ( typeof callbacks.preAccion === "function") {
                callbacks.preAccion();
            }
            self.estado = entorno.ejecutarAccion(accion);
            if ( typeof callbacks.postAccion === "function") {
                callbacks.postAccion();
            }

            /*
            Comprobamos si se quedo en un bucle por ejemplo si no tuvo un buen aprendizaje.
            Vamos guardando los nombres de los estados cada vez que pasamos por ellos en un arreglo.
            Si no existen, agregamos el estado al arreglo, si ya existen, el agente esta en un bucle.
             */
            var nombreEstado = "(" + self.estado[0] + "," + self.estado[1] + ")";
            if (($.inArray(nombreEstado, casillerosRecorridos)) > 0) {
               flagVueltasEnCiculos = true;
               resultado.vueltasEnCirculos = true;
            }
            movimientos--;
            casillerosRecorridos.push(nombreEstado);

            tipoCamino = entorno.mapa.getTipoCamino(entorno.mapa.posicionAgente);
            resultado.caminosRecorridos[tipoCamino]? resultado.caminosRecorridos[tipoCamino]++ : resultado.caminosRecorridos[tipoCamino] = 1;
        }
        return resultado;
    }

}

