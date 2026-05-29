(function() {
    'use strict';
    
    function RadioManager() {
        this.stations = [];
        this.currentStation = null;
        this.isPlaying = false;
        this.audio = null;
        this.init();
    }
    
    RadioManager.prototype.init = function() {
        this.stations = [
            { id: 'rock', name: 'Rock Classics', url: 'https://stream.rockradio.com/rock', genre: 'rock', color: '#ff4444' },
            { id: 'jazz', name: 'Jazz Vibes', url: 'https://stream.jazzradio.com/jazz', genre: 'jazz', color: '#44ff44' },
            { id: 'electronic', name: 'Electronic Beats', url: 'https://stream.electronicradio.com/electronic', genre: 'electronic', color: '#4444ff' },
            { id: 'classical', name: 'Classical Masters', url: 'https://stream.classicalradio.com/classical', genre: 'classical', color: '#ffaa44' },
            { id: 'pop', name: 'Pop Hits', url: 'https://stream.popradio.com/pop', genre: 'pop', color: '#ff44ff' },
            { id: 'hiphop', name: 'Hip Hop Underground', url: 'https://stream.hiphopradio.com/hiphop', genre: 'hiphop', color: '#44ffaa' },
            { id: 'folk', name: 'Folk Acoustic', url: 'https://stream.folkradio.com/folk', genre: 'folk', color: '#aa44ff' },
            { id: 'ambient', name: 'Ambient Relax', url: 'https://stream.ambientradio.com/ambient', genre: 'ambient', color: '#88aaff' }
        ];
        
        this.audio = new Audio();
        this.audio.addEventListener('ended', function() {
            this.playNext();
        }.bind(this));
    };
    
    RadioManager.prototype.loadStations = function() {
        // Станции уже загружены в init
        if (window.ui) {
            // Обновляем UI если нужно
        }
    };
    
    RadioManager.prototype.getStations = function() {
        return this.stations;
    };
    
    RadioManager.prototype.getStation = function(id) {
        return this.stations.find(function(s) { return s.id === id; });
    };
    
    RadioManager.prototype.playStation = function(stationId) {
        var station = this.getStation(stationId);
        if (!station) return false;
        
        if (this.currentStation && this.currentStation.id === stationId && this.isPlaying) {
            this.stop();
            return false;
        }
        
        this.currentStation = station;
        
        // В реальном приложении здесь был бы URL стрима
        // this.audio.src = station.url;
        // this.audio.play();
        
        // Для демо генерируем плейлист из библиотеки
        this.generateStationPlaylist(station);
        
        if (window.ui) {
            window.ui.notify('📻 Now playing: ' + station.name, 'success');
        }
        
        return true;
    };
    
    RadioManager.prototype.generateStationPlaylist = function(station) {
        var self = this;
        
        if (!window.library) return;
        
        library.getTracks().then(function(tracks) {
            // Фильтруем треки по жанру (упрощённо - по артисту)
            var filteredTracks = tracks.filter(function(track) {
                var artistLower = (track.artist || '').toLowerCase();
                var titleLower = (track.title || '').toLowerCase();
                
                switch(station.genre) {
                    case 'rock':
                        return artistLower.includes('rock') || titleLower.includes('rock');
                    case 'jazz':
                        return artistLower.includes('jazz') || titleLower.includes('jazz');
                    case 'electronic':
                        return artistLower.includes('electronic') || artistLower.includes('electro') || titleLower.includes('electronic');
                    case 'classical':
                        return artistLower.includes('classical') || artistLower.includes('symphony') || titleLower.includes('classical');
                    default:
                        return true;
                }
            });
            
            if (filteredTracks.length > 0 && window.queueManager && window.player) {
                queueManager.clear();
                filteredTracks.forEach(function(track) {
                    queueManager.add(track);
                });
                player.play(filteredTracks[0]);
            }
        });
    };
    
    RadioManager.prototype.generateArtistRadio = function(artistName) {
        var self = this;
        
        if (!window.library) return;
        
        library.getTracks().then(function(tracks) {
            var artistLower = artistName.toLowerCase();
            var relatedTracks = tracks.filter(function(track) {
                return (track.artist && track.artist.toLowerCase() === artistLower) ||
                       (track.artist && track.artist.toLowerCase().includes(artistLower));
            });
            
            if (relatedTracks.length === 0) {
                // Если нет треков этого артиста, берём похожие
                relatedTracks = tracks.filter(function(track) {
                    return track.artist && track.artist.toLowerCase() !== artistLower;
                }).slice(0, 20);
            }
            
            if (relatedTracks.length > 0 && window.queueManager && window.player) {
                queueManager.clear();
                relatedTracks.forEach(function(track) {
                    queueManager.add(track);
                });
                player.play(relatedTracks[0]);
                
                if (window.ui) {
                    window.ui.notify('🎵 Radio station created for: ' + artistName, 'success');
                }
            }
        });
    };
    
    RadioManager.prototype.stop = function() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
        }
        this.isPlaying = false;
        this.currentStation = null;
    };
    
    RadioManager.prototype.playNext = function() {
        if (window.queueManager) {
            var next = queueManager.next();
            if (next && window.player) {
                player.play(next);
            }
        }
    };
    
    window.radioManager = new RadioManager();
})();
