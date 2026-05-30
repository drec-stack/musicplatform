// ========================================
// ПОЛИФИЛЛЫ ДЛЯ ВСЕХ БРАУЗЕРОВ
// ========================================

(function() {
    'use strict';
    
    // Promise polyfill для очень старых браузеров
    if (typeof Promise === 'undefined') {
        window.Promise = function(executor) {
            var self = this;
            self.status = 'pending';
            self.value = undefined;
            self.callbacks = [];
            
            function resolve(value) {
                if (self.status !== 'pending') return;
                self.status = 'fulfilled';
                self.value = value;
                self.callbacks.forEach(function(cb) {
                    if (cb.onFulfilled) cb.onFulfilled(value);
                });
            }
            
            function reject(reason) {
                if (self.status !== 'pending') return;
                self.status = 'rejected';
                self.value = reason;
                self.callbacks.forEach(function(cb) {
                    if (cb.onRejected) cb.onRejected(reason);
                });
            }
            
            try {
                executor(resolve, reject);
            } catch(e) {
                reject(e);
            }
        };
        
        Promise.prototype.then = function(onFulfilled, onRejected) {
            var self = this;
            return new Promise(function(resolve, reject) {
                function handle(callback) {
                    try {
                        var result = callback(self.value);
                        if (result && typeof result.then === 'function') {
                            result.then(resolve, reject);
                        } else {
                            resolve(result);
                        }
                    } catch(e) {
                        reject(e);
                    }
                }
                
                if (self.status === 'fulfilled') {
                    handle(onFulfilled);
                } else if (self.status === 'rejected') {
                    handle(onRejected);
                } else {
                    self.callbacks.push({
                        onFulfilled: function(value) { handle(onFulfilled); },
                        onRejected: function(reason) { handle(onRejected); }
                    });
                }
            });
        };
        
        Promise.prototype.catch = function(onRejected) {
            return this.then(null, onRejected);
        };
        
        Promise.resolve = function(value) {
            return new Promise(function(resolve) { resolve(value); });
        };
        
        Promise.reject = function(reason) {
            return new Promise(function(resolve, reject) { reject(reason); });
        };
        
        Promise.all = function(promises) {
            return new Promise(function(resolve, reject) {
                var results = [];
                var remaining = promises.length;
                if (remaining === 0) resolve(results);
                promises.forEach(function(promise, index) {
                    Promise.resolve(promise).then(function(value) {
                        results[index] = value;
                        remaining--;
                        if (remaining === 0) resolve(results);
                    }, reject);
                });
            });
        };
    }
    
    // Array.prototype.find
    if (!Array.prototype.find) {
        Array.prototype.find = function(predicate) {
            if (this == null) throw new TypeError('Array.prototype.find called on null or undefined');
            if (typeof predicate !== 'function') throw new TypeError('predicate must be a function');
            var list = Object(this);
            var length = list.length >>> 0;
            var thisArg = arguments[1];
            for (var i = 0; i < length; i++) {
                var value = list[i];
                if (predicate.call(thisArg, value, i, list)) return value;
            }
            return undefined;
        };
    }
    
    // Array.prototype.includes
    if (!Array.prototype.includes) {
        Array.prototype.includes = function(searchElement, fromIndex) {
            if (this == null) throw new TypeError('Array.prototype.includes called on null or undefined');
            var list = Object(this);
            var length = list.length >>> 0;
            if (length === 0) return false;
            var n = fromIndex | 0;
            var k = Math.max(n >= 0 ? n : length - Math.abs(n), 0);
            while (k < length) {
                if (list[k] === searchElement) return true;
                k++;
            }
            return false;
        };
    }
    
    // String.prototype.startsWith
    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function(search, pos) {
            return this.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
        };
    }
    
    // Object.assign
    if (!Object.assign) {
        Object.assign = function(target) {
            if (target == null) throw new TypeError('Cannot convert undefined or null to object');
            var to = Object(target);
            for (var index = 1; index < arguments.length; index++) {
                var nextSource = arguments[index];
                if (nextSource != null) {
                    for (var nextKey in nextSource) {
                        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                            to[nextKey] = nextSource[nextKey];
                        }
                    }
                }
            }
            return to;
        };
    }
    
    // requestAnimationFrame polyfill
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback) {
            return setTimeout(callback, 1000 / 60);
        };
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    }
    
    // Element.closest polyfill
    if (!Element.prototype.closest) {
        Element.prototype.closest = function(selector) {
            var el = this;
            while (el) {
                if (el.matches(selector)) return el;
                el = el.parentElement;
            }
            return null;
        };
    }
    
    // Element.matches polyfill
    if (!Element.prototype.matches) {
        Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
    }
    
    // CustomEvent polyfill
    if (typeof window.CustomEvent !== 'function') {
        function CustomEvent(event, params) {
            params = params || { bubbles: false, cancelable: false, detail: null };
            var evt = document.createEvent('CustomEvent');
            evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
            return evt;
        }
        window.CustomEvent = CustomEvent;
    }
})();
