/*
An extension of object.watch, this allows you to have multiple handlers on
objects, and also set handlers on changes in arrays
*/

// object.watch
if (!Object.prototype.watch) {

    Object.defineProperty(Object.prototype, 'watch', {
        enumerable: false,
        configurable: true,
        writable: false,
        value: function (prop, handler) {

            if (!this.hasOwnProperty('_watchHandlers')){
                //this._watchHandlers = [];
                Object.defineProperty(this, '_watchHandlers', {
                    enumerable : false,
                    configurable : false,
                    writable : false,
                    value : {}
                })
            }

            var watchHandlers = this._watchHandlers;
            if (!(prop in watchHandlers)){
                watchHandlers[prop] = []
            }
            watchHandlers[prop].push(handler);
            var thiz = this;

            var oldval = this[prop],
                newval = oldval,
                getter = function () {
                    return newval;
                },
                setter = function (val) {
                    oldval = newval;
                    newval = val;
                    thiz._watchHandlers[prop].forEach(function(handler){
                        handler.call(thiz, prop, oldval, val);
                    })
                    return val;
                };
            
            if (delete this[prop]) { // can't watch constants
                Object.defineProperty(this, prop, {
                    get: getter,
                    set: setter,
                    enumerable: true,
                    configurable: true
                });
            }
        }
    });
}
 
// object.unwatch
if (!Object.prototype.unwatch) {
    Object.defineProperty(Object.prototype, 'unwatch', {
            enumerable: false,
            configurable: true,
            writable: false,
            value: function (prop) {
                var val = this[prop];
                delete this[prop]; // remove accessors
                this[prop] = val;
            }
    });
}

function walk(parent, key, callback, path){

    if (!path){
        path = key
    }else{
        path += ',' + key;
    }

    callback(parent, key, path);
    
    if (typeof(parent[key]) == 'object'){
         Object.keys(parent[key]).forEach(function(_key){
            walk(parent[key], _key, callback, path)
        })
    }
}

function getObjectFromPath(parent, path){
    var current = parent;
    path.forEach(function(prop){
        current = current[prop]
    })
    return current;
}

module.exports =  function(parent, key){
    var omniscience = {};

    var dispatch = d3.dispatch('propertyChange');

    // walk the object
    
    function setupWatches(parent, key, path){
        walk(parent, key, function(_parent, _key, path){
            _parent.watch(_key, function(property, oldValue, newValue){
                changeHandler(path.split(','), newValue, oldValue)
            })
        }, path)
    }

    setupWatches(parent, key);

    function changeHandler(path, newValue, oldValue){
        // if the new value is an object, then we need to set up new watches
        // on this

        if (typeof(newValue) == 'object'){
            var p = getObjectFromPath(parent, path);
            Object.keys(p).forEach(function(k){
                setupWatches(p, k, path.join(','))
            })

            // TODO : unwatch the old value?
        }

        dispatch.propertyChange(parent, path, newValue, oldValue);
        path.slice(1)
    }

    /* for attaching event listeners */
    omniscience.on = function(type, listener){
        dispatch.on(type, listener)
        return omniscience;
    }

    return omniscience;
}