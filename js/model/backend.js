/**
 * Created with JetBrains WebStorm.
 * User: MabelZim
 * Date: 22/05/13
 * Time: 07:11
 * To change this template use File | Settings | File Templates.
 */

var backend = angular.module('backend', []);

angular.factory('IAFachada', function() {
    var blob =  Blob(document.getElementById('worker').textContent);
    var worker = (createObjectURL(blob));
});

