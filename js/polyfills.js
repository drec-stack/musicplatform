(function() {
    'use strict';

    if (!String.prototype.includes) {
        String.prototype.includes = function(search, start) {
            if (typeof start !== 'number') start = 0;
            if (start + search.length > this.length) return false;
            return this.indexOf(search, start) !== -1;
        };
    }

    if (!Array.prototype.includes) {
        Array.prototype.includes = function(searchElement, fromIndex) {
            if (this == null) throw new TypeError('Array.prototype.includes called on null or undefined');
            var O = Object(this);
            var len = parseInt(O.length, 10) || 0;
            if (len === 0) return false;
            var n = parseInt(fromIndex, 10) || 0;
            var k;
            if (n >= 0) { k = n; } else { k = len + n; if (k < 0) k = 0; }
            while (k < len) {
                if (O[k] === searchElement || (searchElement !== searchElement && O[k] !== O[k])) return true;
                k++;
            }
            return false;
        };
    }

    if (!Array.prototype.find) {
        Array.prototype.find = function(predicate) {
            if (this == null) throw new TypeError();
            if (typeof predicate !== 'function') throw new TypeError();
            var list = Object(this);
            var length = list.length >>> 0;
            var thisArg = arguments[1];
            for (var i = 0; i < length; i++) {
                if (predicate.call(thisArg, list[i], i, list)) return list[i];
            }
            return undefined;
        };
    }

    if (!Array.prototype.findIndex) {
        Array.prototype.findIndex = function(predicate) {
            if (this == null) throw new TypeError();
            if (typeof predicate !== 'function') throw new TypeError();
            var list = Object(this);
            var length = list.length >>> 0;
            var thisArg = arguments[1];
            for (var i = 0; i < length; i++) {
                if (predicate.call(thisArg, list[i], i, list)) return i;
            }
            return -1;
        };
    }

    if (!Array.prototype.filter) {
        Array.prototype.filter = function(callback, thisArg) {
            if (this == null) throw new TypeError();
            if (typeof callback !== 'function') throw new TypeError();
            var result = [];
            var O = Object(this);
            var len = O.length >>> 0;
            for (var i = 0; i < len; i++) {
                if (i in O) {
                    var val = O[i];
                    if (callback.call(thisArg, val, i, O)) result.push(val);
                }
            }
            return result;
        };
    }

    if (!Array.prototype.map) {
        Array.prototype.map = function(callback, thisArg) {
            if (this == null) throw new TypeError();
            if (typeof callback !== 'function') throw new TypeError();
            var result = [];
            var O = Object(this);
            var len = O.length >>> 0;
            for (var i = 0; i < len; i++) {
                if (i in O) result[i] = callback.call(thisArg, O[i], i, O);
            }
            return result;
        };
    }

    if (!Array.prototype.forEach) {
        Array.prototype.forEach = function(callback, thisArg) {
            if (this == null) throw new TypeError();
            if (typeof callback !== 'function') throw new TypeError();
            var O = Object(this);
            var len = O.length >>> 0;
            for (var i = 0; i < len; i++) {
                if (i in O) callback.call(thisArg, O[i], i, O);
            }
        };
    }

    if (typeof Object.assign !== 'function') {
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

    if (!Element.prototype.closest) {
        Element.prototype.closest = function(s) {
            var el = this;
            do {
                if (Element.prototype.matches.call(el, s)) return el;
                el = el.parentElement || el.parentNode;
            } while (el !== null && el.nodeType === 1);
            return null;
        };
    }

    if (!Element.prototype.matches) {
        Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
    }

    if (window.NodeList && !NodeList.prototype.forEach) {
        NodeList.prototype.forEach = Array.prototype.forEach;
    }

    if (window.HTMLCollection && !HTMLCollection.prototype.forEach) {
        HTMLCollection.prototype.forEach = Array.prototype.forEach;
    }

    if (typeof Promise === 'undefined') {
        window.Promise = function(executor) {
            var self = this;
            self.status = 'pending';
            self.value = undefined;
            self.onFulfilled = [];
            self.onRejected = [];

            function resolve(value) {
                if (self.status === 'pending') {
                    self.status = 'fulfilled';
                    self.value = value;
                    for (var i = 0; i < self.onFulfilled.length; i++) self.onFulfilled[i](value);
                }
            }
            function reject(reason) {
                if (self.status === 'pending') {
                    self.status = 'rejected';
                    self.value = reason;
                    for (var i = 0; i < self.onRejected.length; i++) self.onRejected[i](reason);
                }
            }
            try { executor(resolve, reject); } catch(e) { reject(e); }
        };

        Promise.prototype.then = function(onFulfilled, onRejected) {
            var self = this;
            return new Promise(function(resolve, reject) {
                function handle() {
                    var cb = self.status === 'fulfilled' ? onFulfilled : onRejected;
                    if (typeof cb !== 'function') {
                        if (self.status === 'fulfilled') resolve(self.value);
                        else reject(self.value);
                        return;
                    }
                    try { resolve(cb(self.value)); } catch(e) { reject(e); }
                }
                if (self.status === 'pending') {
                    self.onFulfilled.push(handle);
                    self.onRejected.push(handle);
                } else { handle(); }
            });
        };

        Promise.prototype.catch = function(onRejected) { return this.then(null, onRejected); };

        Promise.all = function(promises) {
            return new Promise(function(resolve, reject) {
                if (!promises.length) { resolve([]); return; }
                var results = [];
                var completed = 0;
                for (var i = 0; i < promises.length; i++) {
                    (function(index) {
                        promises[index].then(function(value) {
                            results[index] = value;
                            completed++;
                            if (completed === promises.length) resolve(results);
                        }, reject);
                    })(i);
                }
            });
        };

        Promise.resolve = function(value) { return new Promise(function(resolve) { resolve(value); }); };
        Promise.reject = function(reason) { return new Promise(function(_, reject) { reject(reason); }); };
    }

    if (typeof console === 'undefined') {
        window.console = { log: function(){}, warn: function(){}, error: function(){} };
    }
})();
