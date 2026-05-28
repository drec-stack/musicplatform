(function() {
    'use strict';

    function MusicImporter() {
        this.importProviders = {
            spotify: { name: 'Spotify', color: '#1DB954' },
            youtube: { name: 'YouTube Music', color: '#FF0000' },
            soundcloud: { name: 'SoundCloud', color: '#FF5500' },
            deezer: { name: 'Deezer', color: '#00C7F2' }
        };
    }

    MusicImporter.prototype.importFromSpotify = function(accessToken, options) {
        var self = this;
        var results = { tracks: [], playlists: [], errors: [] };
        var opts = options || {};

        function fetchSpotify(url) {
            return fetch(url, {
                headers: { 'Authorization': 'Bearer ' + accessToken }
            }).then(function(r) {
                if (!r.ok) throw new Error('Spotify API error: ' + r.status);
                return r.json();
            });
        }

        var chain = Promise.resolve();

        if (opts.importLiked !== false) {
            chain = chain.then(function() {
                return fetchSpotify('https://api.spotify.com/v1/me/tracks?limit=50').then(function(data) {
                    var items = data.items || [];
                    for (var i = 0; i < items.length; i++) {
                        var t = items[i].track;
                        if (!t) continue;
                        results.tracks.push({
                            title: t.name,
                            artist: (t.artists || []).map(function(a) { return a.name; }).join(', '),
                            album: t.album ? t.album.name : '',
                            duration: t.duration_ms || 0,
                            source: 'spotify',
                            sourceId: t.id,
                            sourceUrl: t.external_urls ? t.external_urls.spotify : null,
                            cover: t.album && t.album.images && t.album.images.length > 0 ? t.album.images[0].url : null
                        });
                    }
                }).catch(function(e) { results.errors.push('Liked: ' + e.message); });
            });
        }

        if (opts.importPlaylists !== false) {
            chain = chain.then(function() {
                return fetchSpotify('https://api.spotify.com/v1/me/playlists?limit=50').then(function(data) {
                    var playlists = data.items || [];
                    var plChain = Promise.resolve();
                    for (var i = 0; i < playlists.length; i++) {
                        (function(pl) {
                            plChain = plChain.then(function() {
                                return fetchSpotify('https://api.spotify.com/v1/playlists/' + pl.id + '/tracks?limit=100').then(function(trackData) {
                                    var items = trackData.items || [];
                                    var trackIds = [];
                                    var trackChain = Promise.resolve();
                                    for (var j = 0; j < items.length; j++) {
                                        (function(item) {
                                            if (!item.track) return;
                                            var t = item.track;
                                            trackChain = trackChain.then(function() {
                                                return db.addTrack({
                                                    title: t.name,
                                                    artist: (t.artists || []).map(function(a) { return a.name; }).join(', '),
                                                    album: t.album ? t.album.name : '',
                                                    duration: t.duration_ms || 0,
                                                    source: 'spotify',
                                                    sourceId: t.id,
                                                    sourceUrl: t.external_urls ? t.external_urls.spotify : null,
                                                    cover: t.album && t.album.images && t.album.images.length > 0 ? t.album.images[0].url : null
                                                }).then(function(track) {
                                                    if (track) trackIds.push(track.id);
                                                });
                                            });
                                        })(items[j]);
                                    }
                                    return trackChain.then(function() {
                                        if (trackIds.length > 0) {
                                            return db.createPlaylist('[Spotify] ' + pl.name, pl.description || '').then(function(newPl) {
                                                var addChain = Promise.resolve();
                                                for (var k = 0; k < trackIds.length; k++) {
                                                    (function(tid) {
                                                        addChain = addChain.then(function() {
                                                            return db.addTrackToPlaylist(newPl.id, tid);
                                                        });
                                                    })(trackIds[k]);
                                                }
                                                return addChain.then(function() {
                                                    newPl.tracks = trackIds;
                                                    results.playlists.push(newPl);
                                                });
                                            });
                                        }
                                    });
                                }).catch(function(e) { results.errors.push('Playlist ' + pl.name + ': ' + e.message); });
                            });
                        })(playlists[i]);
                    }
                    return plChain;
                }).catch(function(e) { results.errors.push('Playlists: ' + e.message); });
            });
        }

        return chain.then(function() {
            return results;
        });
    };

    MusicImporter.prototype.importFromYouTube = function(apiKey, options) {
        var results = { tracks: [], playlists: [], errors: [] };

        function extractArtist(title) {
            var match = title.match(/^(.+?)\s*[-–—]\s*.+$/);
            return match ? match[1].trim() : 'Unknown';
        }

        function extractTitle(title) {
            var match = title.match(/^.+?\s*[-–—]\s*(.+)$/);
            if (match) return match[1].replace(/\s*\(.*?\)\s*$/g, '').replace(/\s*\[.*?\]\s*$/g, '').trim();
            return title;
        }

        return fetch('https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&maxResults=50&key=' + apiKey)
            .then(function(r) {
                if (!r.ok) throw new Error('YouTube API error: ' + r.status);
                return r.json();
            })
            .then(function(data) {
                var playlists = data.items || [];
                var chain = Promise.resolve();
                for (var i = 0; i < playlists.length; i++) {
                    (function(pl) {
                        chain = chain.then(function() {
                            return fetch('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=' + pl.id + '&maxResults=50&key=' + apiKey)
                                .then(function(r2) { return r2.json(); })
                                .then(function(itemsData) {
                                    var items = itemsData.items || [];
                                    var trackIds = [];
                                    var tChain = Promise.resolve();
                                    for (var j = 0; j < items.length; j++) {
                                        (function(item) {
                                            var title = item.snippet.title;
                                            tChain = tChain.then(function() {
                                                return db.addTrack({
                                                    title: extractTitle(title),
                                                    artist: extractArtist(title),
                                                    duration: 0,
                                                    source: 'youtube',
                                                    sourceId: item.snippet.resourceId.videoId,
                                                    sourceUrl: 'https://youtube.com/watch?v=' + item.snippet.resourceId.videoId
                                                }).then(function(track) {
                                                    if (track) trackIds.push(track.id);
                                                });
                                            });
                                        })(items[j]);
                                    }
                                    return tChain.then(function() {
                                        if (trackIds.length > 0) {
                                            return db.createPlaylist('[YouTube] ' + pl.snippet.title, '').then(function(newPl) {
                                                var aChain = Promise.resolve();
                                                for (var k = 0; k < trackIds.length; k++) {
                                                    (function(tid) {
                                                        aChain = aChain.then(function() {
                                                            return db.addTrackToPlaylist(newPl.id, tid);
                                                        });
                                                    })(trackIds[k]);
                                                }
                                                return aChain.then(function() {
                                                    newPl.tracks = trackIds;
                                                    results.playlists.push(newPl);
                                                });
                                            });
                                        }
                                    });
                                }).catch(function(e) { results.errors.push('YouTube: ' + e.message); });
                        });
                    })(playlists[i]);
                }
                return chain.then(function() { return results; });
            })
            .catch(function(e) {
                results.errors.push('YouTube: ' + e.message);
                return results;
            });
    };

    MusicImporter.prototype.importFromJSON = function(file) {
        return new Promise(function(resolve, reject) {
            var reader = new FileReader();
            reader.onload = function(e) {
                db.importLibrary(e.target.result).then(function(count) {
                    resolve({ success: true, importedCount: count });
                }).catch(reject);
            };
            reader.onerror = function() { reject(new Error('Failed to read file')); };
            reader.readAsText(file);
        });
    };

    MusicImporter.prototype.importFromCSV = function(file) {
        return new Promise(function(resolve, reject) {
            var reader = new FileReader();
            reader.onload = function(e) {
                var text = e.target.result;
                var lines = text.split('\n').filter(function(l) { return l.trim(); });
                var imported = 0;
                var chain = Promise.resolve();
                for (var i = 1; i < lines.length; i++) {
                    (function(line) {
                        var parts = line.split(',');
                        if (parts.length >= 1) {
                            chain = chain.then(function() {
                                return db.addTrack({
                                    title: (parts[0] || '').replace(/"/g, '').trim(),
                                    artist: parts.length >= 2 ? parts[1].replace(/"/g, '').trim() : 'Unknown',
                                    source: 'import'
                                }).then(function() { imported++; });
                            });
                        }
                    })(lines[i]);
                }
                chain.then(function() {
                    resolve({ success: true, importedCount: imported });
                }).catch(reject);
            };
            reader.onerror = function() { reject(new Error('Failed to read file')); };
            reader.readAsText(file);
        });
    };

    window.importer = new MusicImporter();
})();
