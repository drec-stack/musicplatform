// Polyfills для поддержки старых браузеров

// String.prototype.includes
if (!String.prototype.includes) {
    String.prototype.includes = function(search, start) {
        if (typeof start !== 'number') start = 0;
        if (start + search.length > this.length) return false;
        return this.indexOf(search, start) !== -1;
    };
}

// Array.prototype.includes
if (!Array.prototype.includes) {
    Array.prototype.includes = function(searchElement, fromIndex) {
        if (this == null) throw new TypeError('Array.prototype.includes called on null or undefined');
        var O = Object(this);
        var len = parseInt(O.length, 10) || 0;
        if (len === 0) return false;
        var n = parseInt(fromIndex, 10) || 0;
        var k;
        if (n >= 0) {
            k = n;
        } else {
            k = len + n;
            if (k < 0) k = 0;
        }
        while (k < len) {
            if (O[k] === searchElement || (searchElement !== searchElement && O[k] !== O[k])) {
                return true;
            }
            k++;
        }
        return false;
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
            if (predicate.call(thisArg, list[i], i, list)) return list[i];
        }
        return undefined;
    };
}

// Array.prototype.findIndex
if (!Array.prototype.findIndex) {
    Array.prototype.findIndex = function(predicate) {
        if (this == null) throw new TypeError('Array.prototype.findIndex called on null or undefined');
        if (typeof predicate !== 'function') throw new TypeError('predicate must be a function');
        var list = Object(this);
        var length = list.length >>> 0;
        var thisArg = arguments[1];
        for (var i = 0; i < length; i++) {
            if (predicate.call(thisArg, list[i], i, list)) return i;
        }
        return -1;
    };
}

// Array.from
if (!Array.from) {
    Array.from = (function() {
        var toStr = Object.prototype.toString;
        var isCallable = function(fn) {
            return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
        };
        var toInteger = function(value) {
            var number = Number(value);
            if (isNaN(number)) return 0;
            if (number === 0 || !isFinite(number)) return number;
            return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
        };
        var maxSafeInteger = Math.pow(2, 53) - 1;
        var toLength = function(value) {
            var len = toInteger(value);
            return Math.min(Math.max(len, 0), maxSafeInteger);
        };
        return function from(arrayLike) {
            var C = this;
            var items = Object(arrayLike);
            if (arrayLike == null) throw new TypeError('Array.from requires an array-like object');
            var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
            var T;
            if (typeof mapFn !== 'undefined') {
                if (!isCallable(mapFn)) throw new TypeError('Array.from: when provided, the second argument must be a function');
                if (arguments.length > 2) T = arguments[2];
            }
            var len = toLength(items.length);
            var A = isCallable(C) ? Object(new C(len)) : new Array(len);
            var k = 0;
            var kValue;
            while (k < len) {
                kValue = items[k];
                if (mapFn) {
                    A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
                } else {
                    A[k] = kValue;
                }
                k += 1;
            }
            A.length = len;
            return A;
        };
    }());
}

// Object.assign
if (typeof Object.assign !== 'function') {
    Object.assign = function(target, varArgs) {
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

// Promise polyfill (упрощенный)
if (typeof Promise === 'undefined') {
    window.Promise = function(executor) {
        var self = this;
        self.status = 'pending';
        self.value = undefined;
        self.onFulfilledCallbacks = [];
        self.onRejectedCallbacks = [];

        function resolve(value) {
            if (self.status === 'pending') {
                self.status = 'fulfilled';
                self.value = value;
                for (var i = 0; i < self.onFulfilledCallbacks.length; i++) {
                    self.onFulfilledCallbacks[i](value);
                }
            }
        }

        function reject(reason) {
            if (self.status === 'pending') {
                self.status = 'rejected';
                self.value = reason;
                for (var i = 0; i < self.onRejectedCallbacks.length; i++) {
                    self.onRejectedCallbacks[i](reason);
                }
            }
        }

        try {
            executor(resolve, reject);
        } catch (e) {
            reject(e);
        }
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
                try {
                    var result = cb(self.value);
                    resolve(result);
                } catch (e) {
                    reject(e);
                }
            }
            if (self.status === 'pending') {
                self.onFulfilledCallbacks.push(function() { handle(); });
                self.onRejectedCallbacks.push(function() { handle(); });
            } else {
                handle();
            }
        });
    };

    Promise.prototype.catch = function(onRejected) {
        return this.then(null, onRejected);
    };

    Promise.all = function(promises) {
        return new Promise(function(resolve, reject) {
            var results = [];
            var count = 0;
            var total = promises.length;
            if (total === 0) { resolve(results); return; }
            for (var i = 0; i < total; i++) {
                (function(index) {
                    promises[index].then(function(value) {
                        results[index] = value;
                        count++;
                        if (count === total) resolve(results);
                    }, reject);
                })(i);
            }
        });
    };

    Promise.resolve = function(value) {
        return new Promise(function(resolve) { resolve(value); });
    };

    Promise.reject = function(reason) {
        return new Promise(function(_, reject) { reject(reason); });
    };
}

// Element.prototype.closest
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

// Element.prototype.matches
if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}

// NodeList.prototype.forEach
if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
}

// HTMLCollection forEach
if (window.HTMLCollection && !HTMLCollection.prototype.forEach) {
    HTMLCollection.prototype.forEach = Array.prototype.forEach;
}

// URLSearchParams polyfill
if (typeof URLSearchParams === 'undefined') {
    window.URLSearchParams = function(paramsString) {
        this._params = {};
        if (paramsString) {
            var pairs = paramsString.split('&');
            for (var i = 0; i < pairs.length; i++) {
                var pair = pairs[i].split('=');
                var key = decodeURIComponent(pair[0]);
                var value = pair.length > 1 ? decodeURIComponent(pair[1]) : '';
                this._params[key] = value;
            }
        }
    };
    URLSearchParams.prototype.get = function(key) {
        return this._params[key] || null;
    };
    URLSearchParams.prototype.toString = function() {
        var pairs = [];
        for (var key in this._params) {
            if (this._params.hasOwnProperty(key)) {
                pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(this._params[key]));
            }
        }
        return pairs.join('&');
    };
}

// Console polyfill для IE
if (typeof console === 'undefined') {
    window.console = {
        log: function() {},
        warn: function() {},
        error: function() {}
    };
}
