class MusicDatabase {
    constructor() {
        this.dbName = 'MusicHubDB';
        this.dbVersion = 1;
        this.db = null;
    }

    async open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                if (!db.objectStoreNames.contains('tracks')) {
                    const tracksStore = db.createObjectStore('tracks', { keyPath: 'id' });
                    tracksStore.createIndex('title', 'title', { unique: false });
                    tracksStore.createIndex('artist', 'artist', { unique: false });
                    tracksStore.createIndex('album', 'album', { unique: false });
                    tracksStore.createIndex('source', 'source', { unique: false });
                    tracksStore.createIndex('dateAdded', 'dateAdded', { unique: false });
                }

                if (!db.objectStoreNames.contains('playlists')) {
                    const playlistsStore = db.createObjectStore('playlists', { keyPath: 'id' });
                    playlistsStore.createIndex('name', 'name', { unique: false });
                }

                if (!db.objectStoreNames.contains('audioFiles')) {
                    const audioStore = db.createObjectStore('audioFiles', { keyPath: 'trackId' });
                }

                if (!db.objectStoreNames.contains('albumArt')) {
                    const artStore = db.createObjectStore('albumArt', { keyPath: 'trackId' });
                }

                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    async addTrack(trackData) {
        const db = await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['tracks'], 'readwrite');
            const store = transaction.objectStore('tracks');
            
            const track = {
                id: this.generateId(),
                title: trackData.title || 'Unknown',
                artist: trackData.artist || 'Unknown',
                album: trackData.album || '',
                duration: trackData.duration || 0,
                source: trackData.source || 'local',
                sourceId: trackData.sourceId || null,
                sourceUrl: trackData.sourceUrl || null,
                dateAdded: Date.now(),
                playCount: 0,
                tags: trackData.tags || [],
                isLocal: trackData.isLocal || false,
                fileType: trackData.fileType || null,
                fileSize: trackData.fileSize || 0
            };

            const request = store.add(track);
            request.onsuccess = () => resolve(track);
            request.onerror = () => reject(request.error);
        });
    }

    async addTracks(tracksArray) {
        const db = await this.ensureDB();
        const added = [];
        
        for (const trackData of tracksArray) {
            try {
                const track = await this.addTrack(trackData);
                added.push(track);
            } catch (e) {
                console.error('Failed to add track:', trackData.title, e);
            }
        }
        
        return added;
    }

    async getTrack(id) {
        const db = await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['tracks'], 'readonly');
            const store = transaction.objectStore('tracks');
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllTracks() {
        const db = await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['tracks'], 'readonly');
            const store = transaction.objectStore('tracks');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async getTracksBySource(source) {
        const db = await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['tracks'], 'readonly');
            const store = transaction.objectStore('tracks');
            const index = store.index('source');
            const request = index.getAll(source);
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async searchTracks(query) {
        const allTracks = await this.getAllTracks();
        const lowerQuery = query.toLowerCase();
        
        return allTracks.filter(track => 
            track.title.toLowerCase().includes(lowerQuery) ||
            track.artist.toLowerCase().includes(lowerQuery) ||
            track.album.toLowerCase().includes(lowerQuery)
        );
    }

    async updateTrack(id, updates) {
        const db = await this.ensureDB();
        const track = await this.getTrack(id);
        if (!track) return null;
        
        const updated = { ...track, ...updates };
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['tracks'], 'readwrite');
            const store = transaction.objectStore('tracks');
            const request = store.put(updated);
            request.onsuccess = () => resolve(updated);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteTrack(id) {
        const db = await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['tracks', 'audioFiles', 'albumArt'], 'readwrite');
            
            transaction.objectStore('tracks').delete(id);
            transaction.objectStore('audioFiles').delete(id);
            transaction.objectStore('albumArt').delete(id);
            
            transaction.oncomplete = () => resolve(true);
            transaction.onerror = () => reject(transaction.error);
        });
    }

    async saveAudioFile(trackId, blob) {
        const db = await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['audioFiles'], 'readwrite');
            const store = transaction.objectStore('audioFiles');
            store.put({ trackId, blob, dateAdded: Date.now() });
            transaction.oncomplete = () => resolve(true);
            transaction.onerror = () => reject(transaction.error);
        });
    }

    async getAudioFile(trackId) {
        const db = await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['audioFiles'], 'readonly');
            const store = transaction.objectStore('audioFiles');
            const request = store.get(trackId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async saveAlbumArt(trackId, blob) {
        const db = await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['albumArt'], 'readwrite');
            const store = transaction.objectStore('albumArt');
            store.put({ trackId, blob, dateAdded: Date.now() });
            transaction.oncomplete = () => resolve(true);
            transaction.onerror = () => reject(transaction.error);
        });
    }

    async getAlbumArt(trackId) {
        const db = await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['albumArt'], 'readonly');
            const store = transaction.objectStore('albumArt');
            const request = store.get(trackId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async createPlaylist(name, description = '') {
        const db = await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['playlists'], 'readwrite');
            const store = transaction.objectStore('playlists');
            
            const playlist = {
                id: this.generateId(),
                name,
                description,
                tracks: [],
                dateCreated: Date.now(),
                dateModified: Date.now()
            };
            
            const request = store.add(playlist);
            request.onsuccess = () => resolve(playlist);
            request.onerror = () => reject(request.error);
        });
    }

    async getPlaylist(id) {
        const db = await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['playlists'], 'readonly');
            const store = transaction.objectStore('playlists');
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllPlaylists() {
        const db = await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['playlists'], 'readonly');
            const store = transaction.objectStore('playlists');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async addTrackToPlaylist(playlistId, trackId) {
        const playlist = await this.getPlaylist(playlistId);
        if (!playlist) return null;
        
        if (!playlist.tracks.includes(trackId)) {
            playlist.tracks.push(trackId);
            playlist.dateModified = Date.now();
            
            const db = await this.ensureDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(['playlists'], 'readwrite');
                const store = transaction.objectStore('playlists');
                const request = store.put(playlist);
                request.onsuccess = () => resolve(playlist);
                request.onerror = () => reject(request.error);
            });
        }
        
        return playlist;
    }

    async removeTrackFromPlaylist(playlistId, trackId) {
        const playlist = await this.getPlaylist(playlistId);
        if (!playlist) return null;
        
        playlist.tracks = playlist.tracks.filter(id => id !== trackId);
        playlist.dateModified = Date.now();
        
        const db = await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['playlists'], 'readwrite');
            const store = transaction.objectStore('playlists');
            const request = store.put(playlist);
            request.onsuccess = () => resolve(playlist);
            request.onerror = () => reject(request.error);
        });
    }

    async deletePlaylist(id) {
        const db = await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['playlists'], 'readwrite');
            const store = transaction.objectStore('playlists');
            store.delete(id);
            transaction.oncomplete = () => resolve(true);
            transaction.onerror = () => reject(transaction.error);
        });
    }

    async getTrackCount() {
        const db = await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['tracks'], 'readonly');
            const store = transaction.objectStore('tracks');
            const request = store.count();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getTotalDuration() {
        const tracks = await this.getAllTracks();
        return tracks.reduce((sum, track) => sum + (track.duration || 0), 0);
    }

    async getStorageUsage() {
        const db = await this.ensureDB();
        let totalSize = 0;
        
        const audioFiles = await new Promise((resolve) => {
            const transaction = db.transaction(['audioFiles'], 'readonly');
            const store = transaction.objectStore('audioFiles');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => resolve([]);
        });

        audioFiles.forEach(file => {
            if (file.blob) totalSize += file.blob.size;
        });

        return totalSize;
    }

    async getStats() {
        const trackCount = await this.getTrackCount();
        const totalDuration = await this.getTotalDuration();
        const storageUsage = await this.getStorageUsage();
        const playlists = await this.getAllPlaylists();
        
        const sourceCounts = {};
        const allTracks = await this.getAllTracks();
        allTracks.forEach(track => {
            sourceCounts[track.source] = (sourceCounts[track.source] || 0) + 1;
        });

        return {
            totalTracks: trackCount,
            totalDuration,
            storageUsage,
            totalPlaylists: playlists.length,
            sourceCounts
        };
    }

    async exportLibrary() {
        const data = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            tracks: await this.getAllTracks(),
            playlists: await this.getAllPlaylists()
        };
        
        return JSON.stringify(data, null, 2);
    }

    async importLibrary(jsonData) {
        const data = JSON.parse(jsonData);
        if (!data.tracks) return 0;
        
        let imported = 0;
        for (const track of data.tracks) {
            const existing = await this.getTrack(track.id);
            if (!existing) {
                await this.addTrack(track);
                imported++;
            }
        }
        
        if (data.playlists) {
            for (const playlist of data.playlists) {
                const existing = await this.getPlaylist(playlist.id);
                if (!existing) {
                    const db = await this.ensureDB();
                    await new Promise((resolve, reject) => {
                        const transaction = db.transaction(['playlists'], 'readwrite');
                        const store = transaction.objectStore('playlists');
                        const request = store.add(playlist);
                        request.onsuccess = resolve;
                        request.onerror = reject;
                    });
                }
            }
        }
        
        return imported;
    }

    async clearAll() {
        const db = await this.ensureDB();
        const stores = ['tracks', 'playlists', 'audioFiles', 'albumArt'];
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(stores, 'readwrite');
            
            stores.forEach(storeName => {
                transaction.objectStore(storeName).clear();
            });
            
            transaction.oncomplete = () => resolve(true);
            transaction.onerror = () => reject(transaction.error);
        });
    }

    generateId() {
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substring(2, 10);
        return `${timestamp}-${randomPart}`;
    }

    async ensureDB() {
        if (!this.db) {
            await this.open();
        }
        return this.db;
    }
}

window.db = new MusicDatabase();
