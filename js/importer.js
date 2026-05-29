(function() {
    'use strict';
    
    function Importer() {
        this.supportedFormats = ['json', 'csv', 'm3u', 'pls'];
    }
    
    Importer.prototype.importFromJSON = function(file) {
        var self = this;
        return new Promise(function(resolve, reject) {
            var reader = new FileReader();
            reader.onload = function(e) {
                try {
                    var data = JSON.parse(e.target.result);
                    var imported = 0;
                    var errors = [];
                    
                    var processTrack = function(track, index) {
                        return new Promise(function(res) {
                            setTimeout(function() {
                                var newTrack = {
                                    id: Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '-' + index,
                                    title: track.title || 'Untitled',
                                    artist: track.artist || 'Unknown Artist',
                                    album: track.album || '',
                                    duration: track.duration || 180,
                                    source: track.source || 'imported',
                                    favorite: track.favorite || false,
                                    dateAdded: Date.now(),
                                    file: track.file || null
                                };
                                
                                db.saveTrack(newTrack).then(function() {
                                    imported++;
                                    res();
                                }).catch(function(e) {
                                    errors.push(track.title + ': ' + e.message);
                                    res();
                                });
                            }, index * 10);
                        });
                    };
                    
                    var promises = [];
                    if (data.tracks && Array.isArray(data.tracks)) {
                        for (var i = 0; i < data.tracks.length; i++) {
                            promises.push(processTrack(data.tracks[i], i));
                        }
                    } else if (Array.isArray(data)) {
                        for (var i = 0; i < data.length; i++) {
                            promises.push(processTrack(data[i], i));
                        }
                    }
                    
                    Promise.all(promises).then(function() {
                        resolve({
                            importedCount: imported,
                            errors: errors,
                            total: data.tracks ? data.tracks.length : (Array.isArray(data) ? data.length : 0)
                        });
                    });
                } catch(e) {
                    reject(new Error('Invalid JSON: ' + e.message));
                }
            };
            reader.onerror = function() {
                reject(new Error('Failed to read file'));
            };
            reader.readAsText(file);
        });
    };
    
    Importer.prototype.importFromCSV = function(file) {
        var self = this;
        return new Promise(function(resolve, reject) {
            var reader = new FileReader();
            reader.onload = function(e) {
                var content = e.target.result;
                var lines = content.split(/\r?\n/);
                var imported = 0;
                var errors = [];
                
                // Определяем заголовки
                var headers = [];
                var firstLine = lines[0].toLowerCase();
                if (firstLine.includes('title') || firstLine.includes('artist')) {
                    headers = lines[0].split(',').map(function(h) { return h.trim().toLowerCase(); });
                    lines = lines.slice(1);
                } else {
                    headers = ['title', 'artist', 'duration', 'album'];
                }
                
                var promises = [];
                for (var i = 0; i < lines.length; i++) {
                    if (!lines[i].trim()) continue;
                    
                    (function(line, index) {
                        var parts = line.split(',');
                        var track = {};
                        for (var j = 0; j < headers.length && j < parts.length; j++) {
                            track[headers[j]] = parts[j].trim();
                        }
                        
                        if (track.title) {
                            promises.push(new Promise(function(res) {
                                setTimeout(function() {
                                    var newTrack = {
                                        id: Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '-' + index,
                                        title: track.title,
                                        artist: track.artist || 'Unknown Artist',
                                        album: track.album || '',
                                        duration: parseInt(track.duration) || 180,
                                        source: 'csv',
                                        favorite: false,
                                        dateAdded: Date.now()
                                    };
                                    
                                    db.saveTrack(newTrack).then(function() {
                                        imported++;
                                        res();
                                    }).catch(function(e) {
                                        errors.push(track.title + ': ' + e.message);
                                        res();
                                    });
                                }, index * 10);
                            }));
                        }
                    })(lines[i], i);
                }
                
                Promise.all(promises).then(function() {
                    resolve({
                        importedCount: imported,
                        errors: errors,
                        total: lines.length
                    });
                });
            };
            reader.onerror = function() {
                reject(new Error('Failed to read file'));
            };
            reader.readAsText(file);
        });
    };
    
    Importer.prototype.importFromM3U = function(file) {
        var self = this;
        return new Promise(function(resolve, reject) {
            var reader = new FileReader();
            reader.onload = function(e) {
                var content = e.target.result;
                var lines = content.split(/\r?\n/);
                var tracks = [];
                var currentTrack = null;
                
                for (var i = 0; i < lines.length; i++) {
                    var line = lines[i].trim();
                    if (line.startsWith('#EXTINF:')) {
                        var match = line.match(/#EXTINF:\d+,\s*(.+?)\s*-\s*(.+)/);
                        if (match) {
                            currentTrack = {
                                artist: match[1].trim(),
                                title: match[2].trim()
                            };
                        } else {
                            var parts = line.split(',');
                            if (parts.length > 1) {
                                currentTrack = { title: parts[1].trim() };
                            }
                        }
                    } else if (line && !line.startsWith('#') && currentTrack) {
                        currentTrack.file = line;
                        currentTrack.source = 'm3u';
                        tracks.push(currentTrack);
                        currentTrack = null;
                    }
                }
                
                var imported = 0;
                var promises = tracks.map(function(track, idx) {
                    return new Promise(function(res) {
                        setTimeout(function() {
                            var newTrack = {
                                id: Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '-' + idx,
                                title: track.title || 'Unknown',
                                artist: track.artist || 'Unknown Artist',
                                duration: 180,
                                source: 'm3u',
                                url: track.file,
                                dateAdded: Date.now()
                            };
                            
                            db.saveTrack(newTrack).then(function() {
                                imported++;
                                res();
                            }).catch(function() { res(); });
                        }, idx * 10);
                    });
                });
                
                Promise.all(promises).then(function() {
                    resolve({ importedCount: imported, errors: [], total: tracks.length });
                });
            };
            reader.onerror = function() {
                reject(new Error('Failed to read file'));
            };
            reader.readAsText(file);
        });
    };
    
    Importer.prototype.importFromSpotify = function(accessToken, options) {
        var self = this;
        return new Promise(function(resolve, reject) {
            if (!accessToken) {
                reject(new Error('Spotify not connected'));
                return;
            }
            
            var headers = { 'Authorization': 'Bearer ' + accessToken };
            var limit = options.limit || 50;
            
            // Получаем плейлисты пользователя
            api.get('https://api.spotify.com/v1/me/playlists?limit=' + limit, headers)
                .then(function(playlists) {
                    var allTracks = [];
                    var playlistPromises = [];
                    
                    if (!playlists.items || playlists.items.length === 0) {
                        resolve({ tracks: [], importedCount: 0 });
                        return;
                    }
                    
                    playlists.items.forEach(function(playlist) {
                        playlistPromises.push(
                            api.get(playlist.tracks.href + '?limit=100', headers)
                                .then(function(trackData) {
                                    if (trackData.items) {
                                        trackData.items.forEach(function(item) {
                                            if (item.track) {
                                                allTracks.push({
                                                    title: item.track.name,
                                                    artist: item.track.artists[0]?.name || 'Unknown',
                                                    album: item.track.album?.name || '',
                                                    duration: Math.floor(item.track.duration_ms / 1000),
                                                    source: 'spotify',
                                                    spotifyId: item.track.id
                                                });
                                            }
                                        });
                                    }
                                })
                        );
                    });
                    
                    Promise.all(playlistPromises).then(function() {
                        var imported = 0;
                        var savePromises = allTracks.map(function(track, idx) {
                            return new Promise(function(res) {
                                setTimeout(function() {
                                    var newTrack = {
                                        id: Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '-' + idx,
                                        title: track.title,
                                        artist: track.artist,
                                        album: track.album,
                                        duration: track.duration,
                                        source: 'spotify',
                                        spotifyId: track.spotifyId,
                                        dateAdded: Date.now()
                                    };
                                    
                                    db.saveTrack(newTrack).then(function() {
                                        imported++;
                                        res();
                                    }).catch(function() { res(); });
                                }, idx * 20);
                            });
                        });
                        
                        Promise.all(savePromises).then(function() {
                            resolve({ tracks: allTracks, importedCount: imported });
                        });
                    });
                })
                .catch(reject);
        });
    };
    
    Importer.prototype.importFromYouTube = function(apiKey, options) {
        var self = this;
        return new Promise(function(resolve, reject) {
            if (!apiKey) {
                reject(new Error('YouTube API key not configured'));
                return;
            }
            
            // Демо-данные для YouTube (в реальном приложении здесь был бы API запрос)
            resolve({ tracks: [], importedCount: 0, message: 'YouTube import requires additional setup' });
        });
    };
    
    window.importer = new Importer();
})();
