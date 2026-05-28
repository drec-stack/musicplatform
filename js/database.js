(function() {
    'use strict';

    function MusicDatabase() {
        this.name = 'MusicHubDB';
        this.ver = 1;
        this.db = null;
    }

    MusicDatabase.prototype.open = function() {
        var self = this;
        return new Promise(function(resolve, reject) {
            if (!window.indexedDB) { reject(new Error('IndexedDB not supported')); return; }
            var r = indexedDB.open(self.name, self.ver);
            r.onupgradeneeded = function(e) {
                var db = e.target.result;
                if (!db.objectStoreNames.contains('tracks')) {
                    var s = db.createObjectStore('tracks', { keyPath: 'id' });
                    s.createIndex('title', 'title', { unique: false });
                    s.createIndex('artist', 'artist', { unique: false });
                    s.createIndex('source', 'source', { unique: false });
                }
                if (!db.objectStoreNames.contains('playlists')) {
                    var p = db.createObjectStore('playlists', { keyPath: 'id' });
                    p.createIndex('name', 'name', { unique: false });
                }
                if (!db.objectStoreNames.contains('audioFiles')) db.createObjectStore('audioFiles', { keyPath: 'trackId' });
                if (!db.objectStoreNames.contains('albumArt')) db.createObjectStore('albumArt', { keyPath: 'trackId' });
            };
            r.onsuccess = function(e) { self.db = e.target.result; resolve(self.db); };
            r.onerror = function(e) { reject(e.target.error); };
        });
    };

    MusicDatabase.prototype.ready = function() {
        var self = this;
        if (this.db) return Promise.resolve(this.db);
        return this.open();
    };

    MusicDatabase.prototype.uid = function() {
        return Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
    };

    MusicDatabase.prototype.addTrack = function(data) {
        var self = this;
        return this.ready().then(function(db) {
            return new Promise(function(resolve, reject) {
                var t = db.transaction(['tracks'], 'readwrite');
                var s = t.objectStore('tracks');
                var track = {
                    id: data.id || self.uid(),
                    title: data.title || 'Unknown',
                    artist: data.artist || 'Unknown',
                    album: data.album || '',
                    duration: data.duration || 0,
                    source: data.source || 'local',
                    sourceId: data.sourceId || null,
                    sourceUrl: data.sourceUrl || null,
                    dateAdded: data.dateAdded || Date.now(),
                    playCount: data.playCount || 0,
                    tags: data.tags || [],
                    isLocal: data.isLocal || false,
                    fileType: data.fileType || null,
                    fileSize: data.fileSize || 0,
                    cover: data.cover || null,
                    preview: data.preview || null,
                    streamUrl: data.streamUrl || null
                };
                var req = s.add(track);
                req.onsuccess = function() { resolve(track); };
                req.onerror = function() { reject(req.error); };
            });
        });
    };

    MusicDatabase.prototype.getTrack = function(id) {
        return this.ready().then(function(db) {
            return new Promise(function(resolve, reject) {
                var t = db.transaction(['tracks'], 'readonly');
                var req = t.objectStore('tracks').get(id);
                req.onsuccess = function() { resolve(req.result); };
                req.onerror = function() { reject(req.error); };
            });
        });
    };

    MusicDatabase.prototype.getAllTracks = function() {
        return this.ready().then(function(db) {
            return new Promise(function(resolve, reject) {
                var t = db.transaction(['tracks'], 'readonly');
                var req = t.objectStore('tracks').getAll();
                req.onsuccess = function() { resolve(req.result || []); };
                req.onerror = function() { reject(req.error); };
            });
        });
    };

    MusicDatabase.prototype.updateTrack = function(id, updates) {
        var self = this;
        return this.getTrack(id).then(function(track) {
            if (!track) return null;
            var updated = {};
            for (var k in track) { if (track.hasOwnProperty(k)) updated[k] = track[k]; }
            for (var k in updates) { if (updates.hasOwnProperty(k)) updated[k] = updates[k]; }
            return self.ready().then(function(db) {
                return new Promise(function(resolve, reject) {
                    var t = db.transaction(['tracks'], 'readwrite');
                    var req = t.objectStore('tracks').put(updated);
                    req.onsuccess = function() { resolve(updated); };
                    req.onerror = function() { reject(req.error); };
                });
            });
        });
    };

    MusicDatabase.prototype.deleteTrack = function(id) {
        return this.ready().then(function(db) {
            return new Promise(function(resolve, reject) {
                var t = db.transaction(['tracks', 'audioFiles', 'albumArt'], 'readwrite');
                t.objectStore('tracks').delete(id);
                t.objectStore('audioFiles').delete(id);
                t.objectStore('albumArt').delete(id);
                t.oncomplete = function() { resolve(true); };
                t.onerror = function() { reject(t.error); };
            });
        });
    };

    MusicDatabase.prototype.saveAudioFile = function(trackId, blob) {
        return this.ready().then(function(db) {
            return new Promise(function(resolve, reject) {
                var t = db.transaction(['audioFiles'], 'readwrite');
                t.objectStore('audioFiles').put({ trackId: trackId, blob: blob, added: Date.now() });
                t.oncomplete = function() { resolve(true); };
                t.onerror = function() { reject(t.error); };
            });
        });
    };

    MusicDatabase.prototype.getAudioFile = function(trackId) {
        return this.ready().then(function(db) {
            return new Promise(function(resolve, reject) {
                var t = db.transaction(['audioFiles'], 'readonly');
                var req = t.objectStore('audioFiles').get(trackId);
                req.onsuccess = function() { resolve(req.result); };
                req.onerror = function() { reject(req.error); };
            });
        });
    };

    MusicDatabase.prototype.saveAlbumArt = function(trackId, blob) {
        return this.ready().then(function(db) {
            return new Promise(function(resolve, reject) {
                var t = db.transaction(['albumArt'], 'readwrite');
                t.objectStore('albumArt').put({ trackId: trackId, blob: blob, added: Date.now() });
                t.oncomplete = function() { resolve(true); };
                t.onerror = function() { reject(t.error); };
            });
        });
    };

    MusicDatabase.prototype.getAlbumArt = function(trackId) {
        return this.ready().then(function(db) {
            return new Promise(function(resolve, reject) {
                var t = db.transaction(['albumArt'], 'readonly');
                var req = t.objectStore('albumArt').get(trackId);
                req.onsuccess = function() { resolve(req.result); };
                req.onerror = function() { reject(req.error); };
            });
        });
    };

    MusicDatabase.prototype.createPlaylist = function(name, desc) {
        var self = this;
        return this.ready().then(function(db) {
            return new Promise(function(resolve, reject) {
                var t = db.transaction(['playlists'], 'readwrite');
                var pl = { id: self.uid(), name: name, description: desc || '', tracks: [], created: Date.now(), modified: Date.now() };
                var req = t.objectStore('playlists').add(pl);
                req.onsuccess = function() { resolve(pl); };
                req.onerror = function() { reject(req.error); };
            });
        });
    };

    MusicDatabase.prototype.getAllPlaylists = function() {
        return this.ready().then(function(db) {
            return new Promise(function(resolve, reject) {
                var t = db.transaction(['playlists'], 'readonly');
                var req = t.objectStore('playlists').getAll();
                req.onsuccess = function() { resolve(req.result || []); };
                req.onerror = function() { reject(req.error); };
            });
        });
    };

    MusicDatabase.prototype.getPlaylist = function(id) {
        return this.ready().then(function(db) {
            return new Promise(function(resolve, reject) {
                var t = db.transaction(['playlists'], 'readonly');
                var req = t.objectStore('playlists').get(id);
                req.onsuccess = function() { resolve(req.result); };
                req.onerror = function() { reject(req.error); };
            });
        });
    };

    MusicDatabase.prototype.addTrackToPlaylist = function(plId, trackId) {
        var self = this;
        return this.getPlaylist(plId).then(function(pl) {
            if (!pl) return null;
            if (pl.tracks.indexOf(trackId) === -1) {
                pl.tracks.push(trackId);
                pl.modified = Date.now();
                return self.ready().then(function(db) {
                    return new Promise(function(resolve, reject) {
                        var t = db.transaction(['playlists'], 'readwrite');
                        var req = t.objectStore('playlists').put(pl);
                        req.onsuccess = function() { resolve(pl); };
                        req.onerror = function() { reject(req.error); };
                    });
                });
            }
            return pl;
        });
    };

    MusicDatabase.prototype.deletePlaylist = function(id) {
        return this.ready().then(function(db) {
            return new Promise(function(resolve, reject) {
                var t = db.transaction(['playlists'], 'readwrite');
                t.objectStore('playlists').delete(id);
                t.oncomplete = function() { resolve(true); };
                t.onerror = function() { reject(t.error); };
            });
        });
    };

    MusicDatabase.prototype.getTrackCount = function() {
        return this.ready().then(function(db) {
            return new Promise(function(resolve, reject) {
                var t = db.transaction(['tracks'], 'readonly');
                var req = t.objectStore('tracks').count();
                req.onsuccess = function() { resolve(req.result); };
                req.onerror = function() { reject(req.error); };
            });
        });
    };

    MusicDatabase.prototype.getStorageUsage = function() {
        return this.ready().then(function(db) {
            return new Promise(function(resolve) {
                var t = db.transaction(['audioFiles'], 'readonly');
                var req = t.objectStore('audioFiles').getAll();
                req.onsuccess = function() {
                    var size = 0;
                    var files = req.result || [];
                    for (var i = 0; i < files.length; i++) { if (files[i].blob) size += files[i].blob.size; }
                    resolve(size);
                };
                req.onerror = function() { resolve(0); };
            });
        });
    };

    MusicDatabase.prototype.getStats = function() {
        var self = this;
        return Promise.all([
            self.getTrackCount(),
            self.getStorageUsage(),
            self.getAllPlaylists()
        ]).then(function(r) {
            return { totalTracks: r[0], storageUsage: r[1], totalPlaylists: r[2].length };
        });
    };

    MusicDatabase.prototype.exportLibrary = function() {
        var self = this;
        return Promise.all([self.getAllTracks(), self.getAllPlaylists()]).then(function(r) {
            return JSON.stringify({ version: '1.0', date: new Date().toISOString(), tracks: r[0], playlists: r[1] }, null, 2);
        });
    };

    MusicDatabase.prototype.importLibrary = function(json) {
        var self = this;
        var data = JSON.parse(json);
        if (!data.tracks) return Promise.resolve(0);
        var count = 0;
        var chain = Promise.resolve();
        for (var i = 0; i < data.tracks.length; i++) {
            (function(tr) {
                chain = chain.then(function() {
                    return self.getTrack(tr.id).then(function(ex) {
                        if (!ex) return self.addTrack(tr).then(function() { count++; });
                    });
                });
            })(data.tracks[i]);
        }
        return chain.then(function() { return count; });
    };

    MusicDatabase.prototype.clearAll = function() {
        return this.ready().then(function(db) {
            return new Promise(function(resolve, reject) {
                var t = db.transaction(['tracks', 'playlists', 'audioFiles', 'albumArt'], 'readwrite');
                t.objectStore('tracks').clear();
                t.objectStore('playlists').clear();
                t.objectStore('audioFiles').clear();
                t.objectStore('albumArt').clear();
                t.oncomplete = function() { resolve(true); };
                t.onerror = function() { reject(t.error); };
            });
        });
    };

    MusicDatabase.prototype.searchTracks = function(query) {
        return this.getAllTracks().then(function(tracks) {
            var q = query.toLowerCase();
            var r = [];
            for (var i = 0; i < tracks.length; i++) {
                var t = tracks[i];
                if ((t.title && t.title.toLowerCase().indexOf(q) !== -1) ||
                    (t.artist && t.artist.toLowerCase().indexOf(q) !== -1) ||
                    (t.album && t.album.toLowerCase().indexOf(q) !== -1)) {
                    r.push(t);
                }
            }
            return r;
        });
    };

    window.db = new MusicDatabase();
})();
