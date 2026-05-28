class MusicImporter {
    constructor() {
        this.importProviders = {
            spotify: {
                name: 'Spotify',
                color: '#1DB954',
                importPlaylists: true,
                importLiked: true,
                importAlbums: true
            },
            youtube: {
                name: 'YouTube Music',
                color: '#FF0000',
                importPlaylists: true,
                importLiked: true
            },
            soundcloud: {
                name: 'SoundCloud',
                color: '#FF5500',
                importPlaylists: true,
                importLiked: true
            },
            deezer: {
                name: 'Deezer',
                color: '#00C7F2',
                importPlaylists: true,
                importLiked: true,
                importAlbums: true
            },
            applemusic: {
                name: 'Apple Music',
                color: '#FC3C44',
                importPlaylists: true,
                importLiked: true,
                importAlbums: true
            }
        };
    }

    async importFromSpotify(accessToken, options = {}) {
        const results = {
            tracks: [],
            playlists: [],
            errors: []
        };

        try {
            if (options.importLiked !== false) {
                const likedTracks = await this.fetchSpotifyLiked(accessToken);
                results.tracks.push(...likedTracks);
            }

            if (options.importPlaylists !== false) {
                const playlists = await this.fetchSpotifyPlaylists(accessToken);
                for (const playlist of playlists) {
                    const tracks = await this.fetchSpotifyPlaylistTracks(accessToken, playlist.id);
                    const trackIds = [];
                    
                    for (const track of tracks) {
                        const imported = await db.addTrack({
                            title: track.name,
                            artist: track.artists.map(a => a.name).join(', '),
                            album: track.album.name,
                            duration: track.duration_ms,
                            source: 'spotify',
                            sourceId: track.id,
                            sourceUrl: track.external_urls?.spotify
                        });
                        
                        if (imported) {
                            results.tracks.push(imported);
                            trackIds.push(imported.id);
                        }
                    }
                    
                    if (trackIds.length > 0) {
                        const newPlaylist = await db.createPlaylist(
                            `[Spotify] ${playlist.name}`,
                            playlist.description || ''
                        );
                        
                        for (const trackId of trackIds) {
                            await db.addTrackToPlaylist(newPlaylist.id, trackId);
                        }
                        
                        newPlaylist.tracks = trackIds;
                        results.playlists.push(newPlaylist);
                    }
                }
            }

            if (options.importAlbums !== false) {
                const albums = await this.fetchSpotifySavedAlbums(accessToken);
                for (const album of albums) {
                    const tracks = await this.fetchSpotifyAlbumTracks(accessToken, album.id);
                    const trackIds = [];
                    
                    for (const track of tracks) {
                        const imported = await db.addTrack({
                            title: track.name,
                            artist: track.artists.map(a => a.name).join(', '),
                            album: album.name,
                            duration: track.duration_ms,
                            source: 'spotify',
                            sourceId: track.id,
                            sourceUrl: track.external_urls?.spotify
                        });
                        
                        if (imported) {
                            results.tracks.push(imported);
                            trackIds.push(imported.id);
                        }
                    }
                    
                    if (trackIds.length > 0) {
                        const newPlaylist = await db.createPlaylist(
                            `[Spotify Album] ${album.name}`,
                            `Album by ${album.artists.map(a => a.name).join(', ')}`
                        );
                        
                        for (const trackId of trackIds) {
                            await db.addTrackToPlaylist(newPlaylist.id, trackId);
                        }
                        
                        newPlaylist.tracks = trackIds;
                        results.playlists.push(newPlaylist);
                    }
                }
            }
        } catch (error) {
            results.errors.push(`Spotify import error: ${error.message}`);
        }

        return results;
    }

    async fetchSpotifyLiked(accessToken, offset = 0, limit = 50) {
        const response = await fetch(
            `https://api.spotify.com/v1/me/tracks?limit=${limit}&offset=${offset}`,
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );
        
        if (!response.ok) throw new Error(`Spotify API error: ${response.status}`);
        
        const data = await response.json();
        let tracks = data.items.map(item => ({
            name: item.track.name,
            artists: item.track.artists,
            album: item.track.album,
            duration_ms: item.track.duration_ms,
            id: item.track.id,
            external_urls: item.track.external_urls
        }));

        if (data.next && offset + limit < data.total) {
            const more = await this.fetchSpotifyLiked(accessToken, offset + limit, limit);
            tracks = tracks.concat(more);
        }

        return tracks;
    }

    async fetchSpotifyPlaylists(accessToken) {
        const response = await fetch(
            'https://api.spotify.com/v1/me/playlists?limit=50',
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );
        
        if (!response.ok) throw new Error(`Spotify API error: ${response.status}`);
        
        const data = await response.json();
        return data.items;
    }

    async fetchSpotifyPlaylistTracks(accessToken, playlistId) {
        const response = await fetch(
            `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`,
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );
        
        if (!response.ok) return [];
        
        const data = await response.json();
        return data.items
            .filter(item => item.track)
            .map(item => item.track);
    }

    async fetchSpotifySavedAlbums(accessToken) {
        const response = await fetch(
            'https://api.spotify.com/v1/me/albums?limit=50',
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );
        
        if (!response.ok) throw new Error(`Spotify API error: ${response.status}`);
        
        const data = await response.json();
        return data.items.map(item => item.album);
    }

    async fetchSpotifyAlbumTracks(accessToken, albumId) {
        const response = await fetch(
            `https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50`,
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );
        
        if (!response.ok) return [];
        
        const data = await response.json();
        return data.items;
    }

    async importFromYouTube(apiKey, options = {}) {
        const results = {
            tracks: [],
            playlists: [],
            errors: []
        };

        try {
            if (options.importPlaylists !== false) {
                const playlists = await this.fetchYouTubePlaylists(apiKey);
                
                for (const playlist of playlists) {
                    const videos = await this.fetchYouTubePlaylistVideos(apiKey, playlist.id);
                    const trackIds = [];
                    
                    for (const video of videos) {
                        const title = video.snippet.title;
                        const artist = this.extractArtistFromYouTubeTitle(title);
                        const trackTitle = this.extractTitleFromYouTubeTitle(title);
                        
                        const imported = await db.addTrack({
                            title: trackTitle,
                            artist: artist,
                            duration: 0,
                            source: 'youtube',
                            sourceId: video.snippet.resourceId.videoId,
                            sourceUrl: `https://youtube.com/watch?v=${video.snippet.resourceId.videoId}`
                        });
                        
                        if (imported) {
                            results.tracks.push(imported);
                            trackIds.push(imported.id);
                        }
                    }
                    
                    if (trackIds.length > 0) {
                        const newPlaylist = await db.createPlaylist(
                            `[YouTube] ${playlist.snippet.title}`,
                            playlist.snippet.description || ''
                        );
                        
                        for (const trackId of trackIds) {
                            await db.addTrackToPlaylist(newPlaylist.id, trackId);
                        }
                        
                        newPlaylist.tracks = trackIds;
                        results.playlists.push(newPlaylist);
                    }
                }
            }
        } catch (error) {
            results.errors.push(`YouTube import error: ${error.message}`);
        }

        return results;
    }

    async fetchYouTubePlaylists(apiKey) {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&maxResults=50&key=${apiKey}`
        );
        
        if (!response.ok) throw new Error('YouTube API error');
        
        const data = await response.json();
        return data.items || [];
    }

    async fetchYouTubePlaylistVideos(apiKey, playlistId) {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${apiKey}`
        );
        
        if (!response.ok) return [];
        
        const data = await response.json();
        return data.items || [];
    }

    extractArtistFromYouTubeTitle(title) {
        const patterns = [
            /^(.+?)\s*[-–—]\s*.+$/,
            /^(.+?)\s*[""]\s*.+[""]\s*$/,
            /^(.+?)\s*\(\s*Official\s*(Music\s*)?Video\s*\).*$/i,
            /^(.+?)\s*\[\s*Official\s*(Music\s*)?Video\s*\].*$/i
        ];
        
        for (const pattern of patterns) {
            const match = title.match(pattern);
            if (match) return match[1].trim();
        }
        
        return 'Unknown Artist';
    }

    extractTitleFromYouTubeTitle(title) {
        const patterns = [
            /^.+?\s*[-–—]\s*(.+)$/,
            /^.+?\s*[""]\s*(.+?)[""]\s*$/,
            /^(.+?)\s*\(\s*Official\s*(Music\s*)?Video\s*\).*$/i,
            /^(.+?)\s*\[\s*Official\s*(Music\s*)?Video\s*\].*$/i
        ];
        
        for (const pattern of patterns) {
            const match = title.match(pattern);
            if (match) {
                let result = match[1].trim();
                result = result.replace(/\s*\(.*?\)\s*$/g, '');
                result = result.replace(/\s*\[.*?\]\s*$/g, '');
                return result;
            }
        }
        
        return title;
    }

    async importFromDeezer(options = {}) {
        const results = {
            tracks: [],
            playlists: [],
            errors: []
        };

        return results;
    }

    async importFromSoundCloud(clientId, options = {}) {
        const results = {
            tracks: [],
            playlists: [],
            errors: []
        };

        return results;
    }

    async importFromJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const count = await db.importLibrary(e.target.result);
                    resolve({ success: true, importedCount: count });
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    async importFromCSV(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const text = e.target.result;
                    const lines = text.split('\n').filter(line => line.trim());
                    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                    
                    const titleIndex = headers.indexOf('title');
                    const artistIndex = headers.indexOf('artist');
                    const albumIndex = headers.indexOf('album');
                    
                    if (titleIndex === -1) {
                        throw new Error('CSV must have a "title" column');
                    }
                    
                    let imported = 0;
                    
                    for (let i = 1; i < lines.length; i++) {
                        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                        
                        const trackData = {
                            title: values[titleIndex] || 'Unknown',
                            artist: artistIndex !== -1 ? values[artistIndex] : 'Unknown',
                            album: albumIndex !== -1 ? values[albumIndex] : '',
                            source: 'import',
                            sourceId: `csv-${i}`,
                            isLocal: false
                        };
                        
                        const added = await db.addTrack(trackData);
                        if (added) imported++;
                    }
                    
                    resolve({ success: true, importedCount: imported });
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }
}

window.importer = new MusicImporter();
