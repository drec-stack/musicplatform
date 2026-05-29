(function() {
    'use strict';
    
    function SearchManager() {
        this.searchHistory = [];
        this.loadHistory();
    }
    
    SearchManager.prototype.loadHistory = function() {
        var saved = storage.get('search_history', []);
        this.searchHistory = saved.slice(0, 10);
    };
    
    SearchManager.prototype.saveHistory = function() {
        storage.set('search_history', this.searchHistory);
    };
    
    SearchManager.prototype.addToHistory = function(query) {
        if (!query || query.trim() === '') return;
        
        var index = this.searchHistory.indexOf(query);
        if (index !== -1) this.searchHistory.splice(index, 1);
        
        this.searchHistory.unshift(query);
        if (this.searchHistory.length > 10) this.searchHistory.pop();
        this.saveHistory();
    };
    
    SearchManager.prototype.getHistory = function() {
        return this.searchHistory;
    };
    
    SearchManager.prototype.clearHistory = function() {
        this.searchHistory = [];
        this.saveHistory();
    };
    
    SearchManager.prototype.search = function(query, options) {
        var self = this;
        options = options || {};
        
        return new Promise(function(resolve, reject) {
            if (!query || query.trim().length < (options.minLength || 2)) {
                resolve({ tracks: [], artists: [], albums: [], query: query });
                return;
            }
            
            self.addToHistory(query);
            
            if (!window.library) {
                resolve({ tracks: [], artists: [], albums: [], query: query });
                return;
            }
            
            var lowerQuery = query.toLowerCase();
            
            Promise.all([
                library.getTracks(),
                library.getArtists(),
                library.getAlbums()
            ]).then(function(results) {
                var tracks = results[0];
                var artists = results[1];
                var albums = results[2];
                
                var matchedTracks = tracks.filter(function(track) {
                    return (track.title && track.title.toLowerCase().includes(lowerQuery)) ||
                           (track.artist && track.artist.toLowerCase().includes(lowerQuery)) ||
                           (track.album && track.album.toLowerCase().includes(lowerQuery));
                });
                
                var matchedArtists = artists.filter(function(artist) {
                    return artist.name && artist.name.toLowerCase().includes(lowerQuery);
                });
                
                var matchedAlbums = albums.filter(function(album) {
                    return (album.name && album.name.toLowerCase().includes(lowerQuery)) ||
                           (album.artist && album.artist.toLowerCase().includes(lowerQuery));
                });
                
                resolve({
                    tracks: matchedTracks,
                    artists: matchedArtists,
                    albums: matchedAlbums,
                    query: query,
                    total: matchedTracks.length + matchedArtists.length + matchedAlbums.length
                });
            }).catch(reject);
        });
    };
    
    SearchManager.prototype.searchTracks = function(query, limit) {
        return this.search(query).then(function(result) {
            return result.tracks.slice(0, limit || 50);
        });
    };
    
    SearchManager.prototype.suggest = function(query) {
        var self = this;
        return new Promise(function(resolve) {
            if (!query || query.length < 2) {
                resolve([]);
                return;
            }
            
            var suggestions = [];
            var lowerQuery = query.toLowerCase();
            
            // Из истории
            self.searchHistory.forEach(function(term) {
                if (term.toLowerCase().startsWith(lowerQuery) && term !== query) {
                    suggestions.push(term);
                }
            });
            
            resolve(suggestions.slice(0, 5));
        });
    };
    
    window.searchManager = new SearchManager();
})();
