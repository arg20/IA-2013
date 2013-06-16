app.factory('Notifier', function () {
    function Notifier() {
        this.notify = function (object) {
            $.pnotify(object, 2000);
        };
    }
    return new Notifier();
});
app.directive('mapa', function () {
    return {
        restrict: 'E',
        template: '<table class="mapa">\n    <tr ng-repeat="fila in mapa.mapa">\n        <td ng-repeat="columna in fila" ng-class="columna.nombre" fila="{{$parent.$index}}" columna="{{$index}}" >\n            <img src="img/juego/meta.png" alt="meta" if="isMeta($parent.$index, $index)" />\n            <span if="isPosicionInicial($parent.$index, $index)">\n                \n            </span>\n        </td>\n    </tr>\n</table>\n        ',
        replace: true,
        link: function (scope, element, attrs) {
            scope.$watch('mapa', function () {
                element.attr('class', 'mapa');
                switch (scope.mapa.filas) {
                    case 6:
                        element.addClass('seisxseis');
                        break;
                    case 7:
                        element.addClass('sietexsiete');
                        break;
                    case 8:
                        element.addClass('ochoxocho');
                        break;
                    case 9:
                        element.addClass('nuevexnueve');
                        break;
                    case 10:
                        element.addClass('diezxdiez');
                        break;
                }
            });
        }
    };
});
app.directive('widget', function () {
    return {
        restrict: 'E',
        transclude: true,
        replace: true,
        scope: {
            widgetVar: '=',
            disabled: '@'
        },
        controller: [
            '$scope',
            '$element',
            '$attrs',
            function ($scope, $element, $attrs) {
                this.flip = function () {
                    $element.toggleClass('flip-it');
                };
                this.disable = function () {
                };
                this.skin = $attrs.skin;
            }
        ],
        template: '<div class="widget-holder"><div class="widget-flipper" ng-transclude></div></div>',
        link: function (scope, element, attrs) {
            if (attrs.skin === 'white') {
                element.addClass('widget-white');
            }
        }
    };
});
app.directive('front', function () {
    return {
        require: '^widget',
        restrict: 'E',
        transclude: true,
        replace: true,
        scope: {
            title: '@titulo',
            class: '@'
        },
        template: '<div class="widget-area widget-general-stats widget-front">\n    <div class="widget-head">\n        {{title}}\n        <div>\n            <a href="javascript:;" ng-click="flip()"><i class="icon-photon cog"></i></a>\n            <img src="img/w_arrows@2x.png" alt="Arrows">\n        </div>\n    </div>\n    <div ng-transclude class="content"></div>\n</div>\n',
        link: function (scope, element, attrs, widget) {
            scope.flip = widget.flip;
            element.find('.flipper').bind('click', function () {
                widget.flip();
            });
            if (widget.skin === 'white') {
                element.addClass('skin-white');
                if (scope.class) {
                    element.addClass(scope.class);
                }
                element.find('.content').append('<img class="widget-white-shadow" src="img/w_shadow.png" alt="shadow">');
            }
        }
    };
});
app.directive('back', function () {
    return {
        require: '^widget',
        restrict: 'E',
        transclude: true,
        replace: true,
        scope: {},
        template: '<div class="widget-area widget-general-stats widget-back">\n    <div class="widget-savehead">\n        <a href="javascript:;" class="btn btn-mini btn-inverse flipper" ><i class="icon-photon cog"></i>Listo</a>\n    </div>\n    <div ng-transclude=""></div>\n</div>',
        link: function (scope, element, attrs, widget) {
            scope.flip = widget.flip;
            element.find('.flipper').bind('click', function () {
                widget.flip();
            });
        }
    };
});
/*app.directive('chart', function () {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            id: '@',
            data: '=',
            title: '@titulo'
        },
        template: '<div id="{{id}}" > </div>',
        link: function (scope, element, attrs) {
            scope.$watch('data', function () {
                element.css('height', '200px');
                element.highcharts(]
                });
            });
        }
    };
});*/
app.directive('modal', function () {
    return {
        restrict: 'E',
        transclude: true,
        replace: true,
        scope: {
            widgetvar: '=',
            header: '@'
        },
        template: '<div class="modal hide fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">\n    <div class="modal-header">\n        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>\n        <h3 id="myModalLabel">{{header}}</h3>\n    </div>\n    <span ng-transclude></span>\n\n</div>',
        link: function (scope, element, attrs) {
            if (!scope.widgetvar) {
                scope.widgetvar = {};
            }
            scope.widgetvar.show = function () {
                element.modal('show');
            };
            scope.widgetvar.hide = function () {
                element.modal('hide');
            };
        }
    };
});
app.directive('contenido', function () {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        template: '<div class="modal-body" ng-transclude> </div>',
        link: function (scope, element, attrs) {
        }
    };
});
app.directive('bottom', function () {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        template: '<div class="modal-footer" ng-transclude>\n</div>',
        link: function (scope, element, attrs) {
        }
    };
});
app.directive('if', [function () {
    return {
        transclude: 'element',
        priority: 1000,
        terminal: true,
        restrict: 'A',
        compile: function (element, attr, transclude) {
            return function (scope, element, attr) {
                var childElement;
                var childScope;
                scope.$watch(attr['if'], function (newValue) {
                    if (childElement) {
                        childElement.remove();
                        childElement = undefined;
                    }
                    if (childScope) {
                        childScope.$destroy();
                        childScope = undefined;
                    }
                    if (newValue) {
                        childScope = scope.$new();
                        transclude(childScope, function (clone) {
                            childElement = clone;
                            element.after(clone);
                        });
                    }
                });
            };
        }
    };
}]);
app.directive('agente', function () {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            agente: '=widgetvar',
            mapa: '='
        },
        template: '<div class="agente" style="cursor: -webkit-grab"> </div>',
        link: function (scope, element, attrs) {
            element.armarAgente();
            scope.agente = element.data('agente');
        }
    };
});

app.directive('chart', function () {
    return {
        restrict: 'E',
        template: '<div></div>',
        scope: {
            chartData: "=value"
        },
        transclude:true,
        replace: true,

        link: function (scope, element, attrs) {
            var chartsDefaults = {
                chart: {
                    renderTo: element[0],
                    type: attrs.type || null,
                    height: attrs.height || null,
                    width: attrs.width || null
                }
            };

            var chart = {};


            //Update when charts data changes
            scope.$watch(function() { return scope.chartData; }, function(value) {
                if(!value) return;
                if (typeof chart.destroy != "undefined") {
                    chart.destroy();
                }
                // We need deep copy in order to NOT override original chart object.
                // This allows us to override chart data member and still the keep
                // our original renderTo will be the same
                var deepCopy = true;
                var newSettings = {};
                $.extend(deepCopy, newSettings, chartsDefaults, scope.chartData);
                chart = new Highcharts.Chart(newSettings);
            });
        }
    }

});