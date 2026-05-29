(function() {
    'use strict';
    
    function StorageManager() {
        this.prefix = 'musichub_';
    }
    
    StorageManager.prototype.set = function(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
        } catch(e) {}
    };
    
    StorageManager.prototype.get = function(key, defaultValue) {
        try {
            var value = localStorage.getItem(this.prefix + key);
            if (value === null) return defaultValue;
            return JSON.parse(value);
        } catch(e) {
            return defaultValue;
        }
    };
    
    StorageManager.prototype.remove = function(key) {
        localStorage.removeItem(this.prefix + key);
    };
    
    StorageManager.prototype.clear = function() {
        var keys = Object.keys(localStorage);
        for (var i = 0; i < keys.length; i++) {
            if (keys[i].startsWith(this.prefix)) {
                localStorage.removeItem(keys[i]);
            }
        }
    };
    
    window.storage = new StorageManager();
})();
