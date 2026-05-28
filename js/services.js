class ServicesManager {
    constructor() {
        this.services = {
            spotify: {
                id: 'spotify',
                name: 'Spotify',
                color: '#1DB954',
                authType: 'oauth',
                connected: false
            },
            youtube: {
                id: 'youtube',
                name: 'YouTube Music',
                color: '#FF0000',
                authType: 'api_key',
                connected: false
            },
            soundcloud: {
                id: 'soundcloud',
                name: 'SoundCloud',
                color: '#FF5500',
                authType: 'api_key',
                connected: false
            },
            deezer: {
                id: 'deezer',
                name: 'Deezer',
                color: '#00C7F2',
                authType: 'none',
                connected: true
            }
        };
        this.loadState();
    }

    loadState() {
        const spotifyAuth = storage.get('spotify_auth');
        if (spotifyAuth && spotifyAuth.accessToken) {
            if (spotifyAuth.expiresAt > Date.now()) {
                this.services.spotify.connected = true;
                this.services.spotify.accessToken = spotifyAuth.accessToken;
            }
        }

        const youtubeConfig = storage.get('youtube_config');
        if (youtubeConfig && youtubeConfig.apiKey) {
            this.services.youtube.connected = true;
            this.services.youtube.apiKey = youtubeConfig.apiKey;
        }

        const soundcloudConfig = storage.get('soundcloud_config');
        if (soundcloudConfig && soundcloudConfig.clientId) {
            this.services.soundcloud.connected = true;
            this.services.soundcloud.clientId = soundcloudConfig.clientId;
        }
    }

    getAll() {
        return Object.values(this.services);
    }

    getConnected() {
        return Object.values(this.services).filter(s => s.connected);
    }

    getActiveServiceTokens() {
        const tokens = {};
        if (this.services.spotify.connected) {
            tokens.spotify = this.services.spotify.accessToken;
        }
        if (this.services.youtube.connected) {
            tokens.youtube = this.services.youtube.apiKey;
        }
        if (this.services.soundcloud.connected) {
            tokens.soundcloud = this.services.soundcloud.clientId;
        }
        if (this.services.deezer.connected) {
            tokens.deezer = true;
        }
        return tokens;
    }

    connectSpotify(clientId) {
        const redirectUri = window.location.origin + '/callback.html';
        const scopes = [
            'streaming',
            'user-read-email',
            'user-read-private',
            'user-library-read',
            'user-library-modify',
            'playlist-read-private'
        ].join(' ');
        
        const state = this.generateState();
        storage.set('spotify_auth_state', state);

        const params = new URLSearchParams({
            client_id: clientId,
            response_type: 'token',
            redirect_uri: redirectUri,
            scope: scopes,
            state: state
        });

        window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
    }

    checkSpotifyCallback() {
        const auth = storage.get('spotify_auth');
        if (auth && auth.accessToken && auth.expiresAt > Date.now()) {
            this.services.spotify.connected = true;
            this.services.spotify.accessToken = auth.accessToken;
            return true;
        }
        return false;
    }

    connectYouTube(apiKey) {
        storage.set('youtube_config', { apiKey });
        this.services.youtube.connected = true;
        this.services.youtube.apiKey = apiKey;
        return true;
    }

    connectSoundCloud(clientId) {
        storage.set('soundcloud_config', { clientId });
        this.services.soundcloud.connected = true;
        this.services.soundcloud.clientId = clientId;
        return true;
    }

    disconnect(serviceId) {
        switch (serviceId) {
            case 'spotify':
                storage.remove('spotify_auth');
                this.services.spotify.connected = false;
                delete this.services.spotify.accessToken;
                break;
            case 'youtube':
                storage.remove('youtube_config');
                this.services.youtube.connected = false;
                delete this.services.youtube.apiKey;
                break;
            case 'soundcloud':
                storage.remove('soundcloud_config');
                this.services.soundcloud.connected = false;
                delete this.services.soundcloud.clientId;
                break;
        }
    }

    generateState() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        return Array.from({ length: 16 }, () => 
            chars.charAt(Math.floor(Math.random() * chars.length))
        ).join('');
    }
}

window.services = new ServicesManager();
