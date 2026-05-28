(function() {
    'use strict';

    function LibraryManager() {}

    LibraryManager.prototype.getTracks = function(options) {
        var opts = options || {};
        return db.getAllTracks().then(function(tracks) {
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
        });
    };

    LibraryManager.prototype.getArtists = function() {
        return db.getAllTracks().then(function(tracks) {
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
                if (artistMap.hasOwnProperty(key)) {
                    var a = artistMap[key];
                    var albumList = [];
                    for (var album in a.albums) {
                        if (a.albums.hasOwnProperty(album)) {
                            albumList.push(album);
                        }
                    }
                    result.push({ name: a.name, trackCount: a.trackCount, albums: albumList });
                }
            }
            return result;
        });
    };

    LibraryManager.prototype.getAlbums = function() {
        return db.getAllTracks().then(function(tracks) {
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
                if (albumMap.hasOwnProperty(key)) {
                    result.push(albumMap[key]);
                }
            }
            return result;
        });
    };

    LibraryManager.prototype.getPlaylists = function() {
        return db.getAllPlaylists();
    };

    LibraryManager.prototype.createPlaylist = function(name, description) {
        return db.createPlaylist(name, description);
    };

    LibraryManager.prototype.deletePlaylist = function(id) {
        return db.deletePlaylist(id);
    };

    LibraryManager.prototype.addToPlaylist = function(playlistId, trackId) {
        return db.addTrackToPlaylist(playlistId, trackId);
    };

    LibraryManager.prototype.getPlaylist = function(playlistId) {
        return db.getPlaylist(playlistId);
    };

    LibraryManager.prototype.getPlaylistTracks = function(playlistId) {
        var self = this;
        return db.getPlaylist(playlistId).then(function(playlist) {
            if (!playlist) return [];
            var promises = [];
            for (var i = 0; i < playlist.tracks.length; i++) {
                promises.push(db.getTrack(playlist.tracks[i]));
            }
            return Promise.all(promises).then(function(tracks) {
                return tracks.filter(function(t) { return t !== null && t !== undefined; });
            });
        });
    };

    LibraryManager.prototype.deleteTrack = function(trackId) {
        return db.deleteTrack(trackId);
    };

    LibraryManager.prototype.getStats = function() {
        return db.getStats();
    };

    LibraryManager.prototype.search = function(query) {
        return db.searchTracks(query);
    };

    LibraryManager.prototype.getRecentTracks = function(limit) {
        return db.getAllTracks().then(function(tracks) {
            tracks.sort(function(a, b) { return b.dateAdded - a.dateAdded; });
            return tracks.slice(0, limit || 50);
        });
    };

    LibraryManager.prototype.getMostPlayed = function(limit) {
        return db.getAllTracks().then(function(tracks) {
            tracks.sort(function(a, b) { return (b.playCount || 0) - (a.playCount || 0); });
            return tracks.slice(0, limit || 50);
        });
    };

    LibraryManager.prototype.getDuplicates = function() {
        return db.getAllTracks().then(function(tracks) {
            var duplicates = [];
            var seen = {};
            for (var i = 0; i < tracks.length; i++) {
                var key = (tracks[i].title || '').toLowerCase() + '|||' + (tracks[i].artist || '').toLowerCase();
                if (seen[key]) {
                    duplicates.push({ original: seen[key], duplicate: tracks[i], key: key });
                } else {
                    seen[key] = tracks[i];
                }
            }
            return duplicates;
        });
    };

    LibraryManager.prototype.removeDuplicates = function() {
        var self = this;
        return this.getDuplicates().then(function(duplicates) {
            var promises = [];
            var removed = [];
            for (var i = 0; i < duplicates.length; i++) {
                (function(dup) {
                    promises.push(db.deleteTrack(dup.duplicate.id).then(function() {
                        removed.push(dup.duplicate);
                    }));
                })(duplicates[i]);
            }
            return Promise.all(promises).then(function() { return removed; });
        });
    };

    LibraryManager.prototype.exportLibrary = function() {
        return db.exportLibrary();
    };

    window.library = new LibraryManager();
})();
