class APIManager {
    constructor() {
        this.cache = new Map();
        this.pendingRequests = new Map();
    }

    async fetchWithCache(url, options = {}, cacheTime = 300000) {
        const cacheKey = url + JSON.stringify(options);
        
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < cacheTime) {
            return cached.data;
        }

        if (this.pendingRequests.has(cacheKey)) {
            return this.pendingRequests.get(cacheKey);
        }

        const promise = this.executeRequest(url, options, cacheKey);
        this.pendingRequests.set(cacheKey, promise);
        
        try {
            const data = await promise;
            return data;
        } finally {
            this.pendingRequests.delete(cacheKey);
        }
    }

    async executeRequest(url, options, cacheKey) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Accept': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });

            return data;
        } catch (error) {
            console.error('API request failed:', url, error);
            throw error;
        }
    }

    clearCache() {
        this.cache.clear();
    }

    async spotifyAPI(endpoint, accessToken) {
        return this.fetchWithCache(
            `https://api.spotify.com/v1/${endpoint}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            },
            60000
        );
    }

    async youtubeAPI(endpoint, apiKey) {
        return this.fetchWithCache(
            `https://www.googleapis.com/youtube/v3/${endpoint}&key=${apiKey}`,
            {},
            300000
        );
    }

    async soundcloudAPI(endpoint, clientId) {
        const separator = endpoint.includes('?') ? '&' : '?';
        return this.fetchWithCache(
            `https://api.soundcloud.com/${endpoint}${separator}client_id=${clientId}`,
            {},
            120000
        );
    }

    async deezerAPI(endpoint) {
        return this.fetchWithCache(
            `https://api.deezer.com/${endpoint}`,
            {},
            120000
        );
    }

    async searchAll(query, services) {
        const results = {
            query,
            timestamp: Date.now(),
            services: {}
        };

        const promises = [];

        if (services.spotify) {
            promises.push(
                this.spotifyAPI(
                    `search?q=${encodeURIComponent(query)}&type=track&limit=20`,
                    services.spotify
                ).then(data => {
                    results.services.spotify = this.formatSpotifyResults(data);
                }).catch(() => {
                    results.services.spotify = [];
                })
            );
        }

        if (services.youtube) {
            promises.push(
                this.youtubeAPI(
                    `search?part=snippet&q=${encodeURIComponent(query + ' music')}&type=video&maxResults=20`,
                    services.youtube
                ).then(data => {
                    results.services.youtube = this.formatYouTubeResults(data);
                }).catch(() => {
                    results.services.youtube = [];
                })
            );
        }

        if (services.soundcloud) {
            promises.push(
                this.soundcloudAPI(
                    `tracks?q=${encodeURIComponent(query)}&limit=20`,
                    services.soundcloud
                ).then(data => {
                    results.services.soundcloud = this.formatSoundCloudResults(data);
                }).catch(() => {
                    results.services.soundcloud = [];
                })
            );
        }

        if (services.deezer) {
            promises.push(
                this.deezerAPI(
                    `search/track?q=${encodeURIComponent(query)}&limit=20`
                ).then(data => {
                    results.services.deezer = this.formatDeezerResults(data);
                }).catch(() => {
                    results.services.deezer = [];
                })
            );
        }

        await Promise.allSettled(promises);
        return results;
    }

    formatSpotifyResults(data) {
        if (!data || !data.tracks || !data.tracks.items) return [];
        return data.tracks.items.map(track => ({
            id: track.id,
            title: track.name,
            artist: track.artists.map(a => a.name).join(', '),
            album: track.album.name,
            cover: track.album.images[0]?.url || null,
            duration: track.duration_ms,
            source: 'spotify',
            sourceColor: '#1DB954',
            uri: track.uri,
            url: track.external_urls.spotify
        }));
    }

    formatYouTubeResults(data) {
        if (!data || !data.items) return [];
        return data.items.map(item => ({
            id: item.id.videoId,
            title: item.snippet.title,
            artist: item.snippet.channelTitle,
            cover: item.snippet.thumbnails.medium?.url || null,
            source: 'youtube',
            sourceColor: '#FF0000',
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`
        }));
    }

    formatSoundCloudResults(data) {
        if (!Array.isArray(data)) return [];
        return data.map(track => ({
            id: String(track.id),
            title: track.title,
            artist: track.user?.username || 'Unknown',
            cover: track.artwork_url || null,
            duration: track.duration,
            source: 'soundcloud',
            sourceColor: '#FF5500',
            url: track.permalink_url,
            streamUrl: track.stream_url
        }));
    }

    formatDeezerResults(data) {
        if (!data || !data.data) return [];
        return data.data.map(track => ({
            id: String(track.id),
            title: track.title,
            artist: track.artist?.name || 'Unknown',
            album: track.album?.title || '',
            cover: track.album?.cover_medium || null,
            duration: track.duration * 1000,
            source: 'deezer',
            sourceColor: '#00C7F2',
            url: track.link,
            preview: track.preview
        }));
    }
}

window.api = new APIManager();
