(function() {
    'use strict';
    
    function Library() {
        this.tracks = [];
        this.playlists = [];
        this.init();
    }
    
    Library.prototype.init = function() {
        var self = this;
        db.getAllTracks().then(function(tracks) {
            self.tracks = tracks;
        });
        db.getAllPlaylists().then(function(playlists) {
            self.playlists = playlists;
        });
    };
    
    Library.prototype.getTracks = function(options) {
        var self = this;
        return db.getAllTracks().then(function(tracks) {
            self.tracks = tracks;
            
            if (options && options.sort === 'dateAdded') {
                tracks.sort(function(a, b) { return (b.dateAdded || 0) - (a.dateAdded || 0); });
            } else if (options && options.sort === 'title') {
                tracks.sort(function(a, b) { return (a.title || '').localeCompare(b.title || ''); });
            } else if (options && options.sort === 'artist') {
                tracks.sort(function(a, b) { return (a.artist || '').localeCompare(b.artist || ''); });
            }
            
            return tracks;
        });
    };
    
    Library.prototype.getRecentTracks = function(limit) {
        return this.getTracks({ sort: 'dateAdded' }).then(function(tracks) {
            return tracks.slice(0, limit || 10);
        });
    };
    
    Library.prototype.getArtists = function() {
        return this.getTracks().then(function(tracks) {
            var artistsMap = {};
            tracks.forEach(function(track) {
                if (track.artist) {
                    if (!artistsMap[track.artist]) {
                        artistsMap[track.artist] = { name: track.artist, trackCount: 0 };
                    }
                    artistsMap[track.artist].trackCount++;
                }
            });
            return Object.values(artistsMap);
        });
    };
    
    Library.prototype.getAlbums = function() {
        return this.getTracks().then(function(tracks) {
            var albumsMap = {};
            tracks.forEach(function(track) {
                if (track.album) {
                    if (!albumsMap[track.album]) {
                        albumsMap[track.album] = { name: track.album, artist: track.artist, trackCount: 0 };
                    }
                    albumsMap[track.album].trackCount++;
                }
            });
            return Object.values(albumsMap);
        });
    };
    
    Library.prototype.getPlaylists = function() {
        var self = this;
        return db.getAllPlaylists().then(function(playlists) {
            self.playlists = playlists;
            return playlists;
        });
    };
    
    Library.prototype.getPlaylist = function(id) {
        return this.getPlaylists().then(function(playlists) {
            return playlists.find(function(p) { return p.id == id; });
        });
    };
    
    Library.prototype.getPlaylistTracks = function(playlistId) {
        var self = this;
        return this.getPlaylist(playlistId).then(function(playlist) {
            if (!playlist || !playlist.tracks) return [];
            return self.getTracks().then(function(allTracks) {
                return allTracks.filter(function(track) {
                    return playlist.tracks.includes(track.id);
                });
            });
        });
    };
    
    Library.prototype.createPlaylist = function(name, description) {
        var self = this;
        var playlist = {
            id: Date.now().toString(),
            name: name,
            description: description || '',
            tracks: [],
            createdAt: Date.now()
        };
        
        return db.savePlaylist(playlist).then(function() {
            self.playlists.push(playlist);
            return playlist;
        });
    };
    
    Library.prototype.deletePlaylist = function(id) {
        var self = this;
        return db.deletePlaylist(id).then(function() {
            self.playlists = self.playlists.filter(function(p) { return p.id != id; });
        });
    };
    
    Library.prototype.addToPlaylist = function(playlistId, trackId) {
        var self = this;
        return this.getPlaylist(playlistId).then(function(playlist) {
            if (playlist && !playlist.tracks.includes(trackId)) {
                playlist.tracks.push(trackId);
                return db.savePlaylist(playlist).then(function() {
                    var index = self.playlists.findIndex(function(p) { return p.id == playlistId; });
                    if (index !== -1) self.playlists[index] = playlist;
                });
            }
        });
    };
    
    Library.prototype.search = function(query) {
        return this.getTracks().then(function(tracks) {
            var lowerQuery = query.toLowerCase();
            return tracks.filter(function(track) {
                return (track.title && track.title.toLowerCase().includes(lowerQuery)) ||
                       (track.artist && track.artist.toLowerCase().includes(lowerQuery));
            });
        });
    };
    
    Library.prototype.getStats = function() {
        var self = this;
        return Promise.all([this.getTracks(), this.getPlaylists()]).then(function(results) {
            var tracks = results[0];
            var playlists = results[1];
            var totalSize = tracks.reduce(function(sum, t) { return sum + (t.size || 0); }, 0);
            
            return {
                totalTracks: tracks.length,
                totalPlaylists: playlists.length,
                storageUsage: totalSize
            };
        });
    };
    
    Library.prototype.exportLibrary = function() {
        var self = this;
        return Promise.all([this.getTracks(), this.getPlaylists()]).then(function(results) {
            return JSON.stringify({
                tracks: results[0],
                playlists: results[1],
                exportDate: new Date().toISOString()
            }, null, 2);
        });
    };
    
    Library.prototype.getDuplicates = function() {
        return this.getTracks().then(function(tracks) {
            var seen = {};
            var duplicates = [];
            tracks.forEach(function(track) {
                var key = (track.title + '_' + track.artist).toLowerCase();
                if (seen[key]) {
                    duplicates.push(track);
                } else {
                    seen[key] = true;
                }
            });
            return duplicates;
        });
    };
    
    Library.prototype.removeDuplicates = function() {
        var self = this;
        return this.getDuplicates().then(function(duplicates) {
            return Promise.all(duplicates.map(function(track) {
                return db.deleteTrack(track.id);
            })).then(function() {
                return duplicates;
            });
        });
    };
    
    window.library = new Library();
})();
