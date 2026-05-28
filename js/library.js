class LibraryManager {
    constructor() {
        this.sortField = 'dateAdded';
        this.sortDirection = 'desc';
        this.filterSource = 'all';
        this.currentView = 'all';
    }

    async getTracks(options = {}) {
        let tracks = await db.getAllTracks();

        if (options.source && options.source !== 'all') {
            tracks = tracks.filter(t => t.source === options.source);
        }

        if (options.isLocal !== undefined) {
            tracks = tracks.filter(t => t.isLocal === options.isLocal);
        }

        if (options.search) {
            const query = options.search.toLowerCase();
            tracks = tracks.filter(t => 
                t.title.toLowerCase().includes(query) ||
                t.artist.toLowerCase().includes(query) ||
                t.album.toLowerCase().includes(query)
            );
        }

        if (options.sort) {
            const field = options.sort;
            const direction = options.direction || 'asc';
            tracks.sort((a, b) => {
                const aVal = a[field] || '';
                const bVal = b[field] || '';
                const comparison = typeof aVal === 'string' 
                    ? aVal.localeCompare(bVal) 
                    : aVal - bVal;
                return direction === 'desc' ? -comparison : comparison;
            });
        } else {
            tracks.sort((a, b) => b.dateAdded - a.dateAdded);
        }

        if (options.limit) {
            tracks = tracks.slice(0, options.limit);
        }

        if (options.offset) {
            tracks = tracks.slice(options.offset);
        }

        return tracks;
    }

    async getArtists() {
        const tracks = await db.getAllTracks();
        const artistMap = new Map();

        tracks.forEach(track => {
            const artist = track.artist || 'Unknown';
            if (!artistMap.has(artist)) {
                artistMap.set(artist, {
                    name: artist,
                    trackCount: 0,
                    albums: new Set(),
                    totalDuration: 0
                });
            }
            
            const artistData = artistMap.get(artist);
            artistData.trackCount++;
            artistData.totalDuration += track.duration || 0;
            if (track.album) {
                artistData.albums.add(track.album);
            }
        });

        return Array.from(artistMap.values()).map(a => ({
            ...a,
            albums: Array.from(a.albums)
        }));
    }

    async getAlbums() {
        const tracks = await db.getAllTracks();
        const albumMap = new Map();

        tracks.forEach(track => {
            const albumKey = track.album || 'Unknown Album';
            const artistKey = track.artist || 'Unknown Artist';
            const key = `${albumKey}|||${artistKey}`;
            
            if (!albumMap.has(key)) {
                albumMap.set(key, {
                    name: albumKey,
                    artist: artistKey,
                    trackCount: 0,
                    totalDuration: 0
                });
            }
            
            const albumData = albumMap.get(key);
            albumData.trackCount++;
            albumData.totalDuration += track.duration || 0;
        });

        return Array.from(albumMap.values());
    }

    async getGenres() {
        const tracks = await db.getAllTracks();
        const genreMap = new Map();

        tracks.forEach(track => {
            if (track.tags && track.tags.length > 0) {
                track.tags.forEach(tag => {
                    genreMap.set(tag, (genreMap.get(tag) || 0) + 1);
                });
            }
        });

        return Array.from(genreMap.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }

    async getPlaylists() {
        return db.getAllPlaylists();
    }

    async createPlaylist(name, description) {
        return db.createPlaylist(name, description);
    }

    async deletePlaylist(id) {
        return db.deletePlaylist(id);
    }

    async addToPlaylist(playlistId, trackId) {
        return db.addTrackToPlaylist(playlistId, trackId);
    }

    async removeFromPlaylist(playlistId, trackId) {
        return db.removeTrackFromPlaylist(playlistId, trackId);
    }

    async getPlaylistTracks(playlistId) {
        const playlist = await db.getPlaylist(playlistId);
        if (!playlist) return [];
        
        const tracks = [];
        for (const trackId of playlist.tracks) {
            const track = await db.getTrack(trackId);
            if (track) tracks.push(track);
        }
        
        return tracks;
    }

    async deleteTrack(trackId) {
        return db.deleteTrack(trackId);
    }

    async updateTrackMetadata(trackId, metadata) {
        return db.updateTrack(trackId, metadata);
    }

    async getStats() {
        return db.getStats();
    }

    async search(query) {
        return db.searchTracks(query);
    }

    async getRecentTracks(limit = 50) {
        const tracks = await db.getAllTracks();
        return tracks
            .sort((a, b) => b.dateAdded - a.dateAdded)
            .slice(0, limit);
    }

    async getMostPlayed(limit = 50) {
        const tracks = await db.getAllTracks();
        return tracks
            .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
            .slice(0, limit);
    }

    async exportLibrary() {
        return db.exportLibrary();
    }

    async importLibrary(jsonString) {
        return db.importLibrary(jsonString);
    }

    async getDuplicates() {
        const tracks = await db.getAllTracks();
        const duplicates = [];
        const seen = new Map();

        tracks.forEach(track => {
            const key = `${track.title.toLowerCase()}|||${track.artist.toLowerCase()}`;
            if (seen.has(key)) {
                duplicates.push({
                    original: seen.get(key),
                    duplicate: track,
                    key
                });
            } else {
                seen.set(key, track);
            }
        });

        return duplicates;
    }

    async removeDuplicates() {
        const duplicates = await this.getDuplicates();
        const removed = [];
        
        for (const dup of duplicates) {
            await db.deleteTrack(dup.duplicate.id);
            removed.push(dup.duplicate);
        }
        
        return removed;
    }
}

window.library = new LibraryManager();
