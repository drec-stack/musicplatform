class LibraryManager {
    constructor() {}

    async getTracks(options) {
        var opts = options || {};
        var tracks = await db.getAllTracks();

        if (opts.source && opts.source !== 'all') {
            tracks = tracks.filter(function(t) { return t.source === opts.source; });
        }

        if (opts.search) {
            var query = opts.search.toLowerCase();
            tracks = tracks.filter(function(t) {
                return (t.title && t.title.toLowerCase().indexOf(query) !== -1) ||
                       (t.artist && t.artist.toLowerCase().indexOf(query) !== -1);
            });
        }

        if (opts.sort === 'title') {
            tracks.sort(function(a, b) { return (a.title || '').localeCompare(b.title || ''); });
        } else if (opts.sort === 'artist') {
            tracks.sort(function(a, b) { return (a.artist || '').localeCompare(b.artist || ''); });
        } else if (opts.sort === 'playCount') {
            tracks.sort(function(a, b) { return (b.playCount || 0) - (a.playCount || 0); });
        } else {
            tracks.sort(function(a, b) { return b.dateAdded - a.dateAdded; });
        }

        if (opts.limit) {
            tracks = tracks.slice(0, opts.limit);
        }

        return tracks;
    }

    async getArtists() {
        var tracks = await db.getAllTracks();
        var artistMap = {};
        for (var i = 0; i < tracks.length; i++) {
            var artist = tracks[i].artist || 'Unknown';
            if (!artistMap[artist]) {
                artistMap[artist] = { name: artist, trackCount: 0, albums: {} };
            }
            artistMap[artist].trackCount++;
            if (tracks[i].album) {
                artistMap[artist].albums[tracks[i].album] = true;
            }
        }
        var result = [];
        for (var key in artistMap) {
            var a = artistMap[key];
            var albumList = [];
            for (var album in a.albums) {
                albumList.push(album);
            }
            result.push({ name: a.name, trackCount: a.trackCount, albums: albumList });
        }
        return result;
    }

    async getAlbums() {
        var tracks = await db.getAllTracks();
        var albumMap = {};
        for (var i = 0; i < tracks.length; i++) {
            var albumKey = (tracks[i].album || 'Unknown') + '|||' + (tracks[i].artist || 'Unknown');
            if (!albumMap[albumKey]) {
                albumMap[albumKey] = {
                    name: tracks[i].album || 'Unknown',
                    artist: tracks[i].artist || 'Unknown',
                    trackCount: 0
                };
            }
            albumMap[albumKey].trackCount++;
        }
        var result = [];
        for (var key in albumMap) {
            result.push(albumMap[key]);
        }
        return result;
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

    async getPlaylistTracks(playlistId) {
        var playlist = await db.getPlaylist(playlistId);
        if (!playlist) return [];
        var tracks = [];
        for (var i = 0; i < playlist.tracks.length; i++) {
            var track = await db.getTrack(playlist.tracks[i]);
            if (track) tracks.push(track);
        }
        return tracks;
    }

    async deleteTrack(trackId) {
        return db.deleteTrack(trackId);
    }

    async getStats() {
        return db.getStats();
    }

    async search(query) {
        return db.searchTracks(query);
    }

    async getRecentTracks(limit) {
        var tracks = await db.getAllTracks();
        tracks.sort(function(a, b) { return b.dateAdded - a.dateAdded; });
