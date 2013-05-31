/**
 * Created with JetBrains WebStorm.
 * User: MabelZim
 * Date: 17/05/13
 * Time: 11:30
 * To change this template use File | Settings | File Templates.
 */
function Posicion(i,j) {
    if (arguments.length === 1) {
        this.i = i.i;
        this.j = i.j;
    } else {
        this.i = i;
        this.j = j;
    }
}

Posicion.prototype.equals =  function(object) {
    //hay que implementar todos los controles
    return ((this.i === object.i) && (this.j === object.j));
}

function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createArray(length) {
    var arr = new Array(length || 0),
        i = length;

    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while(i--) arr[length-1 - i] = createArray.apply(this, args);
    }

    return arr;
}

function createObjectURL ( file ) {
    if ( window.webkitURL ) {
        return window.webkitURL.createObjectURL( file );
    } else if ( window.URL && window.URL.createObjectURL ) {
        return window.URL.createObjectURL( file );
    } else {
        return null;
    }
}