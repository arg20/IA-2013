(function($) {

    function Agent(element) {
        this.element = element;
        this.currentAngle = 0;
        this.element.rotate(0);
        this.tamañoCuadrado = 52;
    }

    Agent.prototype.agregarAColaDeAcciones = function(funcionDeAccion) {
        this.element.queue("acciones", function(next) {
            funcionDeAccion();
            next();
        });
        this.element.dequeue("acciones");
    }

    Agent.prototype.getTamañoCuadrado = function() {
        return this.tamañoCuadrado + "px";
    }

    Agent.prototype.animarMovimiento = function() {
        this.element.sprite({fps: 24, no_of_frames: 8, play_frames: 10});
    }

    Agent.prototype.izquierda = Agent.prototype[6] = function() {
        var agente = this;
        this.agregarAColaDeAcciones(function() {
            agente.element.queue(function(next) {
                agente.animarMovimiento();
                agente.element.rotate(-90);
                next();
            });
            agente.element.animate({"margin-left": "-=35px"}, "slow");
        });
    }
    Agent.prototype.arribaIzquierda = Agent.prototype[7] = function() {
        var agente = this;
        this.agregarAColaDeAcciones(function() {
            agente.element.queue(function(next) {
                agente.animarMovimiento();
                agente.element.rotate(-45);
                next();
            });
            agente.element.animate({"margin-left": "-=35px", "margin-top": "-=35px"}, "slow");
        });
    }

    Agent.prototype.abajoIzquierda = Agent.prototype[5] = function() {
        var agente = this;
        this.agregarAColaDeAcciones(function() {
            agente.element.queue(function(next) {
                agente.animarMovimiento();
                agente.element.rotate(-135);
                next();
            });
            agente.element.animate({"margin-left": "-=35px", "margin-top": "+=35px"}, "slow");
        });
    }
    Agent.prototype.arribaDerecha = Agent.prototype[1] = function() {
        var agente = this;
        this.agregarAColaDeAcciones(function() {
            agente.element.queue(function(next) {
                agente.animarMovimiento();
                agente.element.rotate(45);
                next();
            });
            agente.element.animate({"margin-left": "+=35px", "margin-top": "-=35px"}, "slow");
        });
    }
    Agent.prototype.abajoDerecha = Agent.prototype[3] = function() {
        var agente = this;
        this.agregarAColaDeAcciones(function() {
            agente.element.queue(function(next) {
                agente.animarMovimiento();
                agente.element.rotate(135);
                next();
            });
            agente.element.animate({"margin-left": "+=35px", "margin-top": "+=35px"}, "slow");
        });
    }
    Agent.prototype.derecha = Agent.prototype[2] = function() {
        var agente = this;
        this.agregarAColaDeAcciones(function() {
            agente.element.queue(function(next) {
                agente.animarMovimiento();
                agente.element.rotate(90);
                next();
            });
            agente.element.animate({"margin-left": "+=35px"}, "slow");

        });
    }
    Agent.prototype.arriba = Agent.prototype[0] = function() {
        var agente = this;
        this.animarMovimiento();
        this.agregarAColaDeAcciones(function() {
            agente.element.queue(function(next) {
                agente.animarMovimiento();
                agente.element.rotate(0);
                next();
            });
        });
        agente.element.animate({"margin-top": "-=35px"}, "slow");
    }
    Agent.prototype.abajo = Agent.prototype[4] = function() {
        var agente = this;
        this.agregarAColaDeAcciones(function() {
            agente.element.queue(function(next) {
                agente.animarMovimiento();
                agente.element.rotate(180);
                next();
            });
            agente.element.animate({"margin-top": "+=35px"}, "slow");
        });
    }

    Agent.prototype.doAccion = function(acciones) {

        //si es una sola accion
        if (typeof(acciones) == "number") {
            this[acciones]();
        } else {

            for (i = 0; i < acciones.length; i++) {
                this[acciones[i]]();
            }
        }

    }




    $.fn.armarAgente = function() {
        return this.each(function() {
            var element = $(this);
            var agente = new Agent(element);
            element.data("agente", agente);
        });
    }
})(jQuery);