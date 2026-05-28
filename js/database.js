(function() {
    'use strict';

    function MusicDatabase() {
        this.dbName = 'MusicHubDB';
        this.dbVersion = 1;
        this.db = null;
    }

    MusicDatabase.prototype.open = function() {
        var self = this;
        return new Promise(function(resolve, reject) {
            if (!window.indexedDB) {
                reject(new Error('IndexedDB not supported'));
                return;
            }
            var request = indexedDB.open(self.dbName, self.dbVersion);

            request.onupgradeneeded = function(event) {
                var db = event.target.result;
                if (!db.objectStoreNames.contains('tracks')) {
                    var tracksStore = db.createObjectStore('tracks', { keyPath: 'id' });
                    tracksStore.createIndex('title', 'title', { unique: false });
                    tracksStore.createIndex('artist', 'artist', { unique: false });
                    tracksStore.createIndex('source', 'source', { unique: false });
                    tracksStore.createIndex('dateAdded', 'dateAdded', { unique: false });
                }
                if (!db.objectStoreNames.contains('playlists')) {
                    var playlistsStore = db.createObjectStore('playlists', { keyPath: 'id' });
                    playlistsStore.createIndex('name', 'name', { unique: false });
                }
                if (!db.objectStoreNames.contains('audioFiles')) {
                    db.createObjectStore('audioFiles', { keyPath: 'trackId' });
                }
                if (!db.objectStoreNames.contains('albumArt')) {
                    db.createObjectStore('albumArt', { keyPath: 'trackId' });
                }
            };

            request.onsuccess = function(event) {
                self.db = event.target.result;
                resolve(self.db);
            };

            request.onerror = function(event) {
                reject(event.target.error);
            };
        });
    };

    MusicDatabase.prototype.generateId = function() {
        return Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 10);
    };

    MusicDatabase.prototype.ensureDB = function() {
        var self = this;
        if (!this.db) {
            return this.open().then(function(db) {
                return db;
            });
        }
        return Promise.resolve(this.db);
    };

    MusicDatabase.prototype.addTrack = function(trackData) {
        var self = this;
        return this.ensureDB().then(function(db) {
            return new Promise(function(resolve, reject) {
                var transaction = db.transaction(['tracks'], 'readwrite');
                var store = transaction.objectStore('tracks');
                var track = {
                    id: trackData.id || self.generateId(),
                    title: trackData.title || 'Unknown',
                    artist: trackData.artist || 'Unknown',
                    album: trackData.album || '',
                    duration: trackData.duration || 0,
                    source: trackData.source || 'local',
                    sourceId: trackData.sourceId || null,
                    sourceUrl: trackData.sourceUrl || null,
                    dateAdded: trackData.dateAdded || Date.now(),
                    playCount: trackData.playCount || 0,
                    tags: trackData.tags || [],
                    isLocal: trackData.isLocal || false,
                    fileType: trackData.fileType || null,
                    fileSize: trackData.fileSize || 0,
                    cover: trackData.cover || null,
                    preview: trackData.preview || null,
                    streamUrl: trackData.streamUrl || null
                };
                var request = store.add(track);
                request.onsuccess = function() { resolve(track); };
                request.onerror = function() { reject(request.error); };
            });
        });
    };

    MusicDatabase.prototype.getAllTracks = function() {
        return this.ensureDB().then(function(db) {
            return new Promise(function(resolve, reject) {
                var transaction = db.transaction(['tracks'], 'readonly');
                var store = transaction.objectStore('tracks');
                var request = store.getAll();
                request.onsuccess = function() { resolve(request.result || []); };
                request.onerror = function() { reject(request.error); };
            });
        });
    };

    MusicDatabase.prototype.getTrack = function(id) {
        return this.ensureDB().then(function(db) {
            return new Promise(function(resolve, reject) {
                var transaction = db.transaction(['tracks'], 'readonly');
                var store = transaction.objectStore('tracks');
                var request = store.get(id);
                request.onsuccess = function() { resolve(request.result); };
                request.onerror = function() { reject(request.error); };
            });
        });
    };

    MusicDatabase.prototype.updateTrack = function(id, updates) {
        var self = this;
        return this.getTrack(id).then(function(track) {
            if (!track) return null;
            var updated = {};
            for (var key in track) {
                if (track.hasOwnProperty(key)) updated[key] = track[key];
            }
            for (var key in updates) {
                if (updates.hasOwnProperty(key)) updated[key] = updates[key];
            }
            return self.ensureDB().then(function(db) {
                return new Promise(function(resolve, reject) {
                    var transaction = db.transaction(['tracks'], 'readwrite');
                    var store = transaction.objectStore('tracks');
                    var request = store.put(updated);
                    request.onsuccess = function() { resolve(updated); };
                    request.onerror = function() { reject(request.error); };
                });
            });
        });
    };

    MusicDatabase.prototype.deleteTrack = function(id) {
        return this.ensureDB().then(function(db) {
            return new Promise(function(resolve, reject) {
                var transaction = db.transaction(['tracks', 'audioFiles', 'albumArt'], 'readwrite');
                transaction.objectStore('tracks').delete(id);
                transaction.objectStore('audioFiles').delete(id);
                transaction.objectStore('albumArt').delete(id);
                transaction.oncomplete = function() { resolve(true); };
                transaction.onerror = function() { reject(transaction.error); };
            });
        });
    };

    MusicDatabase.prototype.saveAudioFile = function(trackId, blob) {
        return this.ensureDB().then(function(db) {
            return new Promise(function(resolve, reject) {
                var transaction = db.transaction(['audioFiles'], 'readwrite');
                var store = transaction.objectStore('audioFiles');
                store.put({ trackId: trackId, blob: blob, dateAdded: Date.now() });
                transaction.oncomplete = function() { resolve(true); };
                transaction.onerror = function() { reject(transaction.error); };
            });
        });
    };

    MusicDatabase.prototype.getAudioFile = function(trackId) {
        return this.ensureDB().then(function(db) {
            return new Promise(function(resolve, reject) {
                var transaction = db.transaction(['audioFiles'], 'readonly');
                var store = transaction.objectStore('audioFiles');
                var request = store.get(trackId);
                request.onsuccess = function() { resolve(request.result); };
                request.onerror = function() { reject(request.error); };
            });
        });
    };

    MusicDatabase.prototype.saveAlbumArt = function(trackId, blob) {
        return this.ensureDB().then(function(db) {
            return new Promise(function(resolve, reject) {
                var transaction = db.transaction(['albumArt'], 'readwrite');
                var store = transaction.objectStore('albumArt');
                store.put({ trackId: trackId, blob: blob, dateAdded: Date.now() });
                transaction.oncomplete = function() { resolve(true); };
                transaction.onerror = function() { reject(transaction.error); };
            });
        });
    };

    MusicDatabase.prototype.getAlbumArt = function(trackId) {
        return this.ensureDB().then(function(db) {
            return new Promise(function(resolve, reject) {
                var transaction = db.transaction(['albumArt'], 'readonly');
                var store = transaction.objectStore('albumArt');
                var request = store.get(trackId);
                request.onsuccess = function() { resolve(request.result); };
                request.onerror = function() { reject(request.error); };
            });
        });
    };

    MusicDatabase.prototype.createPlaylist = function(name, description) {
        var self = this;
        return this.ensureDB().then(function(db) {
            return new Promise(function(resolve, reject) {
                var transaction = db.transaction(['playlists'], 'readwrite');
                var store = transaction.objectStore('playlists');
                var playlist = {
                    id: self.generateId(),
                    name: name,
                    description: description || '',
                    tracks: [],
                    dateCreated: Date.now(),
                    dateModified: Date.now()
                };
                var request = store.add(playlist);
                request.onsuccess = function() { resolve(playlist); };
                request.onerror = function() { reject(request.error); };
            });
        });
    };

    MusicDatabase.prototype.getAllPlaylists = function() {
        return this.ensureDB().then(function(db) {
            return new Promise(function(resolve, reject) {
                var transaction = db.transaction(['playlists'], 'readonly');
                var store = transaction.objectStore('playlists');
                var request = store.getAll();
                request.onsuccess = function() { resolve(request.result || []); };
                request.onerror = function() { reject(request.error); };
            });
        });
    };

    MusicDatabase.prototype.getPlaylist = function(id) {
        return this.ensureDB().then(function(db) {
            return new Promise(function(resolve, reject) {
                var transaction = db.transaction(['playlists'], 'readonly');
                var store = transaction.objectStore('playlists');
                var request = store.get(id);
                request.onsuccess = function() { resolve(request.result); };
                request.onerror = function() { reject(request.error); };
            });
        });
    };

    MusicDatabase.prototype.addTrackToPlaylist = function(playlistId, trackId) {
        var self = this;
        return this.getPlaylist(playlistId).then(function(playlist) {
            if (!playlist) return null;
            if (playlist.tracks.indexOf(trackId) === -1) {
                playlist.tracks.push(trackId);
                playlist.dateModified = Date.now();
                return self.ensureDB().then(function(db) {
                    return new Promise(function(resolve, reject) {
                        var transaction = db.transaction(['playlists'], 'readwrite');
                        var store = transaction.objectStore('playlists');
                        var request = store.put(playlist);
                        request.onsuccess = function() { resolve(playlist); };
                        request.onerror = function() { reject(request.error); };
                    });
                });
            }
            return playlist;
        });
    };

    MusicDatabase.prototype.deletePlaylist = function(id) {
        return this.ensureDB().then(function(db) {
            return new Promise(function(resolve, reject) {
                var transaction = db.transaction(['playlists'], 'readwrite');
                var store = transaction.objectStore('playlists');
                store.delete(id);
                transaction.oncomplete = function() { resolve(true); };
                transaction.onerror = function() { reject(transaction.error); };
            });
        });
    };

    MusicDatabase.prototype.getTrackCount = function() {
        return this.ensureDB().then(function(db) {
            return new Promise(function(resolve, reject) {
                var transaction = db.transaction(['tracks'], 'readonly');
                var store = transaction.objectStore('tracks');
                var request = store.count();
                request.onsuccess = function() { resolve(request.result); };
                request.onerror = function() { reject(request.error); };
            });
        });
    };

    MusicDatabase.prototype.getTotalDuration = function() {
        return this.getAllTracks().then(function(tracks) {
            var sum = 0;
            for (var i = 0; i < tracks.length; i++) {
                sum += (tracks[i].duration || 0);
            }
            return sum;
        });
    };

    MusicDatabase.prototype.getStorageUsage = function() {
        var self = this;
        return this.ensureDB().then(function(db) {
            return new Promise(function(resolve) {
                var transaction = db.transaction(['audioFiles'], 'readonly');
                var store = transaction.objectStore('audioFiles');
                var request = store.getAll();
                request.onsuccess = function() {
                    var totalSize = 0;
                    var files = request.result || [];
                    for (var i = 0; i < files.length; i++) {
                        if (files[i].blob) totalSize += files[i].blob.size;
                    }
                    resolve(totalSize);
                };
                request.onerror = function() { resolve(0); };
            });
        });
    };

    MusicDatabase.prototype.getStats = function() {
        var self = this;
        return Promise.all([
            self.getTrackCount(),
            self.getTotalDuration(),
            self.getStorageUsage(),
            self.getAllPlaylists(),
            self.getAllTracks()
        ]).then(function(results) {
            var trackCount = results[0];
            var totalDuration = results[1];
            var storageUsage = results[2];
            var playlists = results[3];
            var allTracks = results[4];
            var sourceCounts = {};
            for (var i = 0; i < allTracks.length; i++) {
                var src = allTracks[i].source;
                sourceCounts[src] = (sourceCounts[src] || 0) + 1;
            }
            return {
                totalTracks: trackCount,
                totalDuration: totalDuration,
                storageUsage: storageUsage,
                totalPlaylists: playlists.length,
                sourceCounts: sourceCounts
            };
        });
    };

    MusicDatabase.prototype.exportLibrary = function() {
        var self = this;
        return Promise.all([self.getAllTracks(), self.getAllPlaylists()]).then(function(results) {
            var data = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                tracks: results[0],
                playlists: results[1]
            };
            return JSON.stringify(data, null, 2);
        });
    };

    MusicDatabase.prototype.importLibrary = function(jsonData) {
        var self = this;
        var data = JSON.parse(jsonData);
        if (!data.tracks) return Promise.resolve(0);
        var imported = 0;
        var chain = Promise.resolve();
        for (var i = 0; i < data.tracks.length; i++) {
            (function(track) {
                chain = chain.then(function() {
                    return self.getTrack(track.id).then(function(existing) {
                        if (!existing) {
                            return self.addTrack(track).then(function() {
                                imported++;
                            });
                        }
                    });
                });
            })(data.tracks[i]);
        }
        if (data.playlists) {
            for (var j = 0; j < data.playlists.length; j++) {
                (function(playlist) {
                    chain = chain.then(function() {
                        return self.getPlaylist(playlist.id).then(function(existing) {
                            if (!existing) {
                                return self.ensureDB().then(function(db) {
                                    return new Promise(function(resolve) {
                                        var transaction = db.transaction(['playlists'], 'readwrite');
                                        var store = transaction.objectStore('playlists');
                                        store.add(playlist);
                                        transaction.oncomplete = resolve;
                                    });
                                });
                            }
                        });
                    });
                })(data.playlists[j]);
            }
        }
        return chain.then(function() { return imported; });
    };

    MusicDatabase.prototype.clearAll = function() {
        return this.ensureDB().then(function(db) {
            return new Promise(function(resolve, reject) {
                var stores = ['tracks', 'playlists', 'audioFiles', 'albumArt'];
                var transaction = db.transaction(stores, 'readwrite');
                for (var i = 0; i < stores.length; i++) {
                    transaction.objectStore(stores[i]).clear();
                }
                transaction.oncomplete = function() { resolve(true); };
                transaction.onerror = function() { reject(transaction.error); };
            });
        });
    };

    MusicDatabase.prototype.searchTracks = function(query) {
        return this.getAllTracks().then(function(tracks) {
            var lowerQuery = query.toLowerCase();
            var results = [];
            for (var i = 0; i < tracks.length; i++) {
                var track = tracks[i];
                if ((track.title && track.title.toLowerCase().indexOf(lowerQuery) !== -1) ||
                    (track.artist && track.artist.toLowerCase().indexOf(lowerQuery) !== -1) ||
                    (track.album && track.album.toLowerCase().indexOf(lowerQuery) !== -1)) {
                    results.push(track);
                }
            }
            return results;
        });
    };

    window.db = new MusicDatabase();
})();
