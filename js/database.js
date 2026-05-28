class MusicDatabase {
    constructor() {
        this.dbName = 'MusicHubDB';
        this.dbVersion = 1;
        this.db = null;
    }

    async open() {
        var self = this;
        return new Promise(function(resolve, reject) {
            var request = indexedDB.open(self.dbName, self.dbVersion);

            request.onupgradeneeded = function(event) {
                var db = event.target.result;
                if (!db.objectStoreNames.contains('tracks')) {
                    var tracksStore = db.createObjectStore('tracks', { keyPath: 'id' });
                    tracksStore.createIndex('title', 'title', { unique: false });
                    tracksStore.createIndex('artist', 'artist', { unique: false });
                    tracksStore.createIndex('album', 'album', { unique: false });
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
    }

    generateId() {
        return Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 10);
    }

    async ensureDB() {
        if (!this.db) {
            await this.open();
        }
        return this.db;
    }

    async addTrack(trackData) {
        var db = await this.ensureDB();
        var self = this;
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
    }

    async getAllTracks() {
        var db = await this.ensureDB();
        return new Promise(function(resolve, reject) {
            var transaction = db.transaction(['tracks'], 'readonly');
            var store = transaction.objectStore('tracks');
            var request = store.getAll();
            request.onsuccess = function() { resolve(request.result || []); };
            request.onerror = function() { reject(request.error); };
        });
    }

    async getTrack(id) {
        var db = await this.ensureDB();
        return new Promise(function(resolve, reject) {
            var transaction = db.transaction(['tracks'], 'readonly');
            var store = transaction.objectStore('tracks');
            var request = store.get(id);
            request.onsuccess = function() { resolve(request.result); };
            request.onerror = function() { reject(request.error); };
        });
    }

    async updateTrack(id, updates) {
        var db = await this.ensureDB();
        var track = await this.getTrack(id);
        if (!track) return null;
        var updated = Object.assign({}, track, updates);
        return new Promise(function(resolve, reject) {
            var transaction = db.transaction(['tracks'], 'readwrite');
            var store = transaction.objectStore('tracks');
            var request = store.put(updated);
            request.onsuccess = function() { resolve(updated); };
            request.onerror = function() { reject(request.error); };
        });
    }

    async deleteTrack(id) {
        var db = await this.ensureDB();
        return new Promise(function(resolve, reject) {
            var transaction = db.transaction(['tracks', 'audioFiles', 'albumArt'], 'readwrite');
            transaction.objectStore('tracks').delete(id);
            transaction.objectStore('audioFiles').delete(id);
            transaction.objectStore('albumArt').delete(id);
            transaction.oncomplete = function() { resolve(true); };
            transaction.onerror = function() { reject(transaction.error); };
        });
    }

    async saveAudioFile(trackId, blob) {
        var db = await this.ensureDB();
        return new Promise(function(resolve, reject) {
            var transaction = db.transaction(['audioFiles'], 'readwrite');
            var store = transaction.objectStore('audioFiles');
            store.put({ trackId: trackId, blob: blob, dateAdded: Date.now() });
            transaction.oncomplete = function() { resolve(true); };
            transaction.onerror = function() { reject(transaction.error); };
        });
    }

    async getAudioFile(trackId) {
        var db = await this.ensureDB();
        return new Promise(function(resolve, reject) {
            var transaction = db.transaction(['audioFiles'], 'readonly');
            var store = transaction.objectStore('audioFiles');
            var request = store.get(trackId);
            request.onsuccess = function() { resolve(request.result); };
            request.onerror = function() { reject(request.error); };
        });
    }

    async saveAlbumArt(trackId, blob) {
        var db = await this.ensureDB();
        return new Promise(function(resolve, reject) {
            var transaction = db.transaction(['albumArt'], 'readwrite');
            var store = transaction.objectStore('albumArt');
            store.put({ trackId: trackId, blob: blob, dateAdded: Date.now() });
            transaction.oncomplete = function() { resolve(true); };
            transaction.onerror = function() { reject(transaction.error); };
        });
    }

    async getAlbumArt(trackId) {
        var db = await this.ensureDB();
        return new Promise(function(resolve, reject) {
            var transaction = db.transaction(['albumArt'], 'readonly');
            var store = transaction.objectStore('albumArt');
            var request = store.get(trackId);
            request.onsuccess = function() { resolve(request.result); };
            request.onerror = function() { reject(request.error); };
        });
    }

    async createPlaylist(name, description) {
        var db = await this.ensureDB();
        var self = this;
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
    }

    async getAllPlaylists() {
        var db = await this.ensureDB();
        return new Promise(function(resolve, reject) {
            var transaction = db.transaction(['playlists'], 'readonly');
            var store = transaction.objectStore('playlists');
            var request = store.getAll();
            request.onsuccess = function() { resolve(request.result || []); };
            request.onerror = function() { reject(request.error); };
        });
    }

    async getPlaylist(id) {
        var db = await this.ensureDB();
        return new Promise(function(resolve, reject) {
            var transaction = db.transaction(['playlists'], 'readonly');
            var store = transaction.objectStore('playlists');
            var request = store.get(id);
            request.onsuccess = function() { resolve(request.result); };
            request.onerror = function() { reject(request.error); };
        });
    }

    async addTrackToPlaylist(playlistId, trackId) {
        var db = await this.ensureDB();
        var playlist = await this.getPlaylist(playlistId);
        if (!playlist) return null;
        if (!playlist.tracks.includes(trackId)) {
            playlist.tracks.push(trackId);
            playlist.dateModified = Date.now();
            return new Promise(function(resolve, reject) {
                var transaction = db.transaction(['playlists'], 'readwrite');
                var store = transaction.objectStore('playlists');
                var request = store.put(playlist);
                request.onsuccess = function() { resolve(playlist); };
                request.onerror = function() { reject(request.error); };
            });
        }
        return playlist;
    }

    async deletePlaylist(id) {
        var db = await this.ensureDB();
        return new Promise(function(resolve, reject) {
            var transaction = db.transaction(['playlists'], 'readwrite');
            var store = transaction.objectStore('playlists');
            store.delete(id);
            transaction.oncomplete = function() { resolve(true); };
            transaction.onerror = function() { reject(transaction.error); };
        });
    }

    async getTrackCount() {
        var db = await this.ensureDB();
        return new Promise(function(resolve, reject) {
            var transaction = db.transaction(['tracks'], 'readonly');
            var store = transaction.objectStore('tracks');
            var request = store.count();
            request.onsuccess = function() { resolve(request.result); };
            request.onerror = function() { reject(request.error); };
        });
    }

    async getTotalDuration() {
        var tracks = await this.getAllTracks();
        var sum = 0;
        for (var i = 0; i < tracks.length; i++) {
            sum += (tracks[i].duration || 0);
        }
        return sum;
    }

    async getStorageUsage() {
        var db = await this.ensureDB();
        var totalSize = 0;
        var audioFiles = await new Promise(function(resolve) {
            var transaction = db.transaction(['audioFiles'], 'readonly');
            var store = transaction.objectStore('audioFiles');
            var request = store.getAll();
            request.onsuccess = function() { resolve(request.result || []); };
            request.onerror = function() { resolve([]); };
        });
        for (var i = 0; i < audioFiles.length; i++) {
            if (audioFiles[i].blob) totalSize += audioFiles[i].blob.size;
        }
        return totalSize;
    }

    async getStats() {
        var trackCount = await this.getTrackCount();
        var totalDuration = await this.getTotalDuration();
        var storageUsage = await this.getStorageUsage();
        var playlists = await this.getAllPlaylists();
        var sourceCounts = {};
        var allTracks = await this.getAllTracks();
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
    }

    async exportLibrary() {
        var data = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            tracks: await this.getAllTracks(),
            playlists: await this.getAllPlaylists()
        };
        return JSON.stringify(data, null, 2);
    }

    async importLibrary(jsonData) {
        var data = JSON.parse(jsonData);
        if (!data.tracks) return 0;
        var imported = 0;
        for (var i = 0; i < data.tracks.length; i++) {
            var track = data.tracks[i];
            var existing = await this.getTrack(track.id);
            if (!existing) {
                await this.addTrack(track);
                imported++;
            }
        }
        if (data.playlists) {
            for (var j = 0; j < data.playlists.length; j++) {
                var playlist = data.playlists[j];
                var existingPl = await this.getPlaylist(playlist.id);
                if (!existingPl) {
                    var db = await this.ensureDB();
                    await new Promise(function(resolve, reject) {
                        var transaction = db.transaction(['playlists'], 'readwrite');
                        var store = transaction.objectStore('playlists');
                        var request = store.add(playlist);
                        request.onsuccess = resolve;
                        request.onerror = reject;
                    });
                }
            }
        }
        return imported;
    }

    async clearAll() {
        var db = await this.ensureDB();
        var stores = ['tracks', 'playlists', 'audioFiles', 'albumArt'];
        return new Promise(function(resolve, reject) {
            var transaction = db.transaction(stores, 'readwrite');
            for (var i = 0; i < stores.length; i++) {
                transaction.objectStore(stores[i]).clear();
            }
            transaction.oncomplete = function() { resolve(true); };
            transaction.onerror = function() { reject(transaction.error); };
        });
    }

    async searchTracks(query) {
        var allTracks = await this.getAllTracks();
        var lowerQuery = query.toLowerCase();
        return allTracks.filter(function(track) {
            return (track.title && track.title.toLowerCase().indexOf(lowerQuery) !== -1) ||
                   (track.artist && track.artist.toLowerCase().indexOf(lowerQuery) !== -1) ||
                   (track.album && track.album.toLowerCase().indexOf(lowerQuery) !== -1);
        });
    }
}

window.db = new MusicDatabase();
