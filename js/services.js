(function() {
    'use strict';

    function ServicesManager() {
        this.services = {
            spotify: { id: 'spotify', name: 'Spotify', color: '#1DB954', authType: 'oauth', connected: false },
            youtube: { id: 'youtube', name: 'YouTube Music', color: '#FF0000', authType: 'api_key', connected: false },
            soundcloud: { id: 'soundcloud', name: 'SoundCloud', color: '#FF5500', authType: 'api_key', connected: false },
            deezer: { id: 'deezer', name: 'Deezer', color: '#00C7F2', authType: 'none', connected: true }
        };
        this.loadState();
    }

    ServicesManager.prototype.loadState = function() {
        var spotifyAuth = storage.get('spotify_auth');
        if (spotifyAuth && spotifyAuth.accessToken && spotifyAuth.expiresAt > Date.now()) {
            this.services.spotify.connected = true;
            this.services.spotify.accessToken = spotifyAuth.accessToken;
        }

        var youtubeConfig = storage.get('youtube_config');
        if (youtubeConfig && youtubeConfig.apiKey) {
            this.services.youtube.connected = true;
            this.services.youtube.apiKey = youtubeConfig.apiKey;
        }

        var soundcloudConfig = storage.get('soundcloud_config');
        if (soundcloudConfig && soundcloudConfig.clientId) {
            this.services.soundcloud.connected = true;
            this.services.soundcloud.clientId = soundcloudConfig.clientId;
        }
    };

    ServicesManager.prototype.getAll = function() {
        var result = [];
        for (var key in this.services) {
            if (this.services.hasOwnProperty(key)) {
                result.push(this.services[key]);
            }
        }
        return result;
    };

    ServicesManager.prototype.getConnected = function() {
        var result = [];
        for (var key in this.services) {
            if (this.services.hasOwnProperty(key) && this.services[key].connected) {
                result.push(this.services[key]);
            }
        }
        return result;
    };

    ServicesManager.prototype.getActiveServiceTokens = function() {
        var tokens = {};
        if (this.services.spotify.connected) tokens.spotify = this.services.spotify.accessToken;
        if (this.services.youtube.connected) tokens.youtube = this.services.youtube.apiKey;
        if (this.services.soundcloud.connected) tokens.soundcloud = this.services.soundcloud.clientId;
        if (this.services.deezer.connected) tokens.deezer = true;
        return tokens;
    };

    ServicesManager.prototype.connectSpotify = function(clientId) {
        var redirectUri = window.location.origin + '/callback.html';
        var scopes = 'streaming user-read-email user-read-private user-library-read user-library-modify playlist-read-private';
        var state = this.generateState();
        storage.set('spotify_auth_state', state);
        var params = 'client_id=' + encodeURIComponent(clientId) +
            '&response_type=token' +
            '&redirect_uri=' + encodeURIComponent(redirectUri) +
            '&scope=' + encodeURIComponent(scopes) +
            '&state=' + encodeURIComponent(state);
        window.location.href = 'https://accounts.spotify.com/authorize?' + params;
    };

    ServicesManager.prototype.checkSpotifyCallback = function() {
        var auth = storage.get('spotify_auth');
        if (auth && auth.accessToken && auth.expiresAt > Date.now()) {
            this.services.spotify.connected = true;
            this.services.spotify.accessToken = auth.accessToken;
            return true;
        }
        return false;
    };

    ServicesManager.prototype.connectYouTube = function(apiKey) {
        storage.set('youtube_config', { apiKey: apiKey });
        this.services.youtube.connected = true;
        this.services.youtube.apiKey = apiKey;
        return true;
    };

    ServicesManager.prototype.connectSoundCloud = function(clientId) {
        storage.set('soundcloud_config', { clientId: clientId });
        this.services.soundcloud.connected = true;
        this.services.soundcloud.clientId = clientId;
        return true;
    };

    ServicesManager.prototype.disconnect = function(serviceId) {
        if (serviceId === 'spotify') {
            storage.remove('spotify_auth');
            this.services.spotify.connected = false;
            delete this.services.spotify.accessToken;
        } else if (serviceId === 'youtube') {
            storage.remove('youtube_config');
            this.services.youtube.connected = false;
            delete this.services.youtube.apiKey;
        } else if (serviceId === 'soundcloud') {
            storage.remove('soundcloud_config');
            this.services.soundcloud.connected = false;
            delete this.services.soundcloud.clientId;
        }
    };

    ServicesManager.prototype.generateState = function() {
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var result = '';
        for (var i = 0; i < 16; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    window.services = new ServicesManager();
})();
