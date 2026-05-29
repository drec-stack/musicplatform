(function() {
    'use strict';
    
    function ServicesManager() {
        this.services = [
            { id: 'spotify', name: 'Spotify', connected: false, color: '#1DB954' },
            { id: 'youtube', name: 'YouTube Music', connected: false, color: '#FF0000' },
            { id: 'soundcloud', name: 'SoundCloud', connected: false, color: '#FF7700' }
        ];
        this.load();
    }
    
    ServicesManager.prototype.load = function() {
        var spotifyAuth = storage.get('spotify_auth');
        if (spotifyAuth && spotifyAuth.accessToken) {
            this.services[0].connected = true;
        }
        
        var youtubeConfig = storage.get('youtube_config');
        if (youtubeConfig && youtubeConfig.apiKey) {
            this.services[1].connected = true;
        }
    };
    
    ServicesManager.prototype.getAll = function() {
        return this.services;
    };
    
    ServicesManager.prototype.connectSpotify = function(clientId) {
        var redirectUri = window.location.origin + '/callback.html';
        var scope = 'user-read-private user-read-email playlist-read-private';
        var authUrl = 'https://accounts.spotify.com/authorize?' +
            'client_id=' + clientId +
            '&response_type=token' +
            '&redirect_uri=' + encodeURIComponent(redirectUri) +
            '&scope=' + encodeURIComponent(scope);
        
        window.location.href = authUrl;
    };
    
    ServicesManager.prototype.connectYouTube = function(apiKey) {
        storage.set('youtube_config', { apiKey: apiKey });
        this.services[1].connected = true;
    };
    
    ServicesManager.prototype.disconnect = function(serviceId) {
        if (serviceId === 'spotify') {
            storage.remove('spotify_auth');
            this.services[0].connected = false;
        } else if (serviceId === 'youtube') {
            storage.remove('youtube_config');
            this.services[1].connected = false;
        }
    };
    
    ServicesManager.prototype.checkSpotifyCallback = function() {
        var hash = window.location.hash.substring(1);
        if (hash) {
            var params = {};
            var pairs = hash.split('&');
            for (var i = 0; i < pairs.length; i++) {
                var parts = pairs[i].split('=');
                params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1] || '');
            }
            if (params.access_token) {
                var data = {
                    accessToken: params.access_token,
                    expiresAt: Date.now() + (parseInt(params.expires_in, 10) * 1000)
                };
                storage.set('spotify_auth', data);
                this.services[0].connected = true;
                window.location.hash = '';
                return true;
            }
        }
        return false;
    };
    
    window.services = new ServicesManager();
})();
