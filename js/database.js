(function() {
    'use strict';
    
    var DB_NAME = 'MusicHubDB';
    var DB_VERSION = 2;
    var dbInstance = null;
    
    function Database() {
        this.ready = false;
    }
    
    Database.prototype.open = function() {
        var self = this;
        return new Promise(function(resolve, reject) {
            if (dbInstance && self.ready) {
                resolve(dbInstance);
                return;
            }
            
            var request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = function() {
                reject(request.error);
            };
            
            request.onsuccess = function() {
                dbInstance = request.result;
                self.ready = true;
                resolve(dbInstance);
            };
            
            request.onupgradeneeded = function(event) {
                var db = event.target.result;
                
                if (!db.objectStoreNames.contains('tracks')) {
                    var trackStore = db.createObjectStore('tracks', { keyPath: 'id' });
                    trackStore.createIndex('title', 'title', { unique: false });
                    trackStore.createIndex('artist', 'artist', { unique: false });
                    trackStore.createIndex('dateAdded', 'dateAdded', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('playlists')) {
                    var playlistStore = db.createObjectStore('playlists', { keyPath: 'id' });
                    playlistStore.createIndex('name', 'name', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('favorites')) {
                    db.createObjectStore('favorites', { keyPath: 'id' });
                }
            };
        });
    };
    
    Database.prototype.getAllTracks = function() {
        var self = this;
        return this.open().then(function(db) {
            return new Promise(function(resolve, reject) {
                var transaction = db.transaction(['tracks'], 'readonly');
                var store = transaction.objectStore('tracks');
                var request = store.getAll();
                
                request.onsuccess = function() {
                    resolve(request.result || []);
                };
                request.onerror = function() {
                    reject(request.error);
                };
            });
        });
    };
    
    Database.prototype.saveTrack = function(track) {
        var self = this;
        return this.open().then(function(db) {
            return new Promise(function(resolve, reject) {
                var transaction = db.transaction(['tracks'], 'readwrite');
                var store = transaction.objectStore('tracks');
                var request = store.put(track);
                
                request.onsuccess = function() {
                    resolve(track);
                };
                request.onerror = function() {
                    reject(request.error);
                };
            });
        });
    };
    
    Database.prototype.deleteTrack = function(id) {
        return this.open().then(function(db) {
            return new Promise(function(resolve, reject) {
                var transaction = db.transaction(['tracks'], 'readwrite');
                var store = transaction.objectStore('tracks');
                var request = store.delete(id);
                
                request.onsuccess = function() {
                    resolve();
                };
                request.onerror = function() {
                    reject(request.error);
                };
            });
        });
    };
    
    Database.prototype.getAllPlaylists = function() {
        return this.open().then(function(db) {
            return new Promise(function(resolve, reject) {
                var transaction = db.transaction(['playlists'], 'readonly');
                var store = transaction.objectStore('playlists');
                var request = store.getAll();
                
                request.onsuccess = function() {
                    resolve(request.result || []);
                };
                request.onerror = function() {
                    reject(request.error);
                };
            });
        });
    };
    
    Database.prototype.savePlaylist = function(playlist) {
        return this.open().then(function(db) {
            return new Promise(function(resolve, reject) {
                var transaction = db.transaction(['playlists'], 'readwrite');
                var store = transaction.objectStore('playlists');
                var request = store.put(playlist);
                
                request.onsuccess = function() {
                    resolve(playlist);
                };
                request.onerror = function() {
                    reject(request.error);
                };
            });
        });
    };
    
    Database.prototype.deletePlaylist = function(id) {
        return this.open().then(function(db) {
            return new Promise(function(resolve, reject) {
                var transaction = db.transaction(['playlists'], 'readwrite');
                var store = transaction.objectStore('playlists');
                var request = store.delete(id);
                
                request.onsuccess = function() {
                    resolve();
                };
                request.onerror = function() {
                    reject(request.error);
                };
            });
        });
    };
    
    Database.prototype.clearAll = function() {
        return this.open().then(function(db) {
            return Promise.all([
                new Promise(function(resolve, reject) {
                    var transaction = db.transaction(['tracks'], 'readwrite');
                    var store = transaction.objectStore('tracks');
                    var request = store.clear();
                    request.onsuccess = resolve;
                    request.onerror = reject;
                }),
                new Promise(function(resolve, reject) {
                    var transaction = db.transaction(['playlists'], 'readwrite');
                    var store = transaction.objectStore('playlists');
                    var request = store.clear();
                    request.onsuccess = resolve;
                    request.onerror = reject;
                }),
                new Promise(function(resolve, reject) {
                    var transaction = db.transaction(['favorites'], 'readwrite');
                    var store = transaction.objectStore('favorites');
                    var request = store.clear();
                    request.onsuccess = resolve;
                    request.onerror = reject;
                })
            ]);
        });
    };
    
    window.db = new Database();
})();
