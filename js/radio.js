(function() {
    'use strict';
    
    function RadioManager() {
        this.stations = [];
        this.currentStation = null;
        this.audio = null;
        this.playing = false;
        this.events = [];
        this.loadStations();
    }
    
    RadioManager.prototype.loadStations = function() {
        var saved = storage.get('radio_stations', null);
        if (saved && saved.length) {
            this.stations = saved;
        } else {
            // Станции по умолчанию
            this.stations = [
                { id: 'radio1', name: 'Radio Paradise', url: 'https://stream.radioparadise.com/mp3-192', genre: 'eclectic' },
                { id: 'radio2', name: 'SomaFM: Groove Salad', url: 'https://ice4.somafm.com/groovesalad-128-mp3', genre: 'chill' },
                { id: 'radio3', name: 'BBC Radio 1', url: 'http://stream.live.vc.bbcmedia.co.uk/bbc_radio_one', genre: 'pop' }
            ];
            this.saveStations();
        }
    };
    
    RadioManager.prototype.saveStations = function() {
        storage.set('radio_stations', this.stations);
    };
    
    RadioManager.prototype.addStation = function(name, url, genre) {
        var id = Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
        var station = { id: id, name: name, url: url, genre: genre || 'custom' };
        this.stations.push(station);
        this.saveStations();
        this.emit('stations_updated', this.stations);
        return station;
    };
    
    RadioManager.prototype.removeStation = function(stationId) {
        this.stations = this.stations.filter(function(s) { return s.id !== stationId; });
        this.saveStations();
        this.emit('stations_updated', this.stations);
        return true;
    };
    
    RadioManager.prototype.playStation = function(station) {
        if (this.audio) {
            this.audio.pause();
            this.audio = null;
        }
        
        this.currentStation = station;
        // Используем CORS-прокси (если сервер есть) или прямой URL
        var streamUrl = station.url;
        
        this.audio = new Audio(streamUrl);
        this.audio.play().catch(function(e) { console.error('Radio error:', e); });
        this.playing = true;
        this.emit('station_playing', station);
    };
    
    RadioManager.prototype.stop = function() {
        if (this.audio) {
            this.audio.pause();
            this.audio = null;
        }
        this.playing = false;
        this.currentStation = null;
        this.emit('station_stopped');
    };
    
    RadioManager.prototype.generateArtistRadio = async function(artistName) {
        var self = this;
        var tracks = await library.search(artistName);
        var similar = tracks.filter(function(t) {
            return t.artist && t.artist.toLowerCase().indexOf(artistName.toLowerCase()) !== -1;
        });
        this.emit('radio_generated', { artist: artistName, tracks: similar });
        return similar;
    };
    
    // Event emitter
    RadioManager.prototype.on = function(e, cb) { this.events.push({e:e, cb:cb}); };
    RadioManager.prototype.emit = function(e, d) {
        for(var i=0;i<this.events.length;i++) {
            if(this.events[i].e === e) this.events[i].cb(d);
        }
    };
    
    window.radioManager = new RadioManager();
})();
