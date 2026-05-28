(function() {
    'use strict';

    function UIManager() {
        this.currentPage = 'home';
        this.currentLibraryTab = 'tracks';
        this.searchTimeout = null;
    }

    UIManager.prototype.init = function() {
        this.renderSidebar();
        this.renderTopbar();
        this.renderPlayer();
        this.renderNotificationContainer();
        this.bindGlobalEvents();
        this.checkSpotifyCallback();
        var self = this;
        var savedPage = storage.get('current_page', 'home');
        return this.navigateTo(savedPage).then(function() {
            self.loadSidebarStats();
            self.bindPlayerEvents();
        });
    };

    UIManager.prototype.checkSpotifyCallback = function() {
        if (services.checkSpotifyCallback()) {
            this.showNotification('Spotify connected', 'success');
            this.renderSidebar();
        }
    };

    UIManager.prototype.loadSidebarStats = function() {
        var self = this;
        library.getStats().then(function(stats) {
            var statsEl = document.getElementById('sidebarStats');
            if (!statsEl) return;
            
            var html = '';
            html += '<div class="sidebar-stat"><span class="stat-value">' + stats.totalTracks + '</span><span class="stat-label">tracks</span></div>';
            html += '<div class="sidebar-stat"><span class="stat-value">' + stats.totalPlaylists + '</span><span class="stat-label">playlists</span></div>';
            html += '<div class="sidebar-stat"><span class="stat-value">' + self.formatStorageSize(stats.storageUsage) + '</span><span class="stat-label">used</span></div>';
            statsEl.innerHTML = html;
        }).catch(function(e) {
            console.error('Failed to load stats:', e);
        });
    };

    UIManager.prototype.formatStorageSize = function(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        var units = ['B', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(1024));
        if (i >= units.length) i = units.length - 1;
        return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
    };

    UIManager.prototype.renderSidebar = function() {
        var sidebar = document.getElementById('sidebar');
        if (!sidebar) return;
        
        var allServices = services.getAll();
        var self = this;
        
        var html = '';
        // Header
        html += '<div class="sidebar-header">';
        html += '<div class="sidebar-logo">';
        html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
        html += '<span>MusicHub</span>';
        html += '</div></div>';
        
        // Navigation
        html += '<nav class="sidebar-nav">';
        var navItems = [
            { page: 'home', svg: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>', label: 'Home' },
            { page: 'library', svg: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>', label: 'Library' },
            { page: 'search', svg: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>', label: 'Search' },
            { page: 'upload', svg: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>', label: 'Upload' },
            { page: 'import', svg: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>', label: 'Import' },
            { page: 'playlists', svg: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>', label: 'Playlists' }
        ];
        
        for (var i = 0; i < navItems.length; i++) {
            html += '<a class="nav-item" data-page="' + navItems[i].page + '">';
            html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' + navItems[i].svg + '</svg>';
            html += navItems[i].label;
            html += '</a>';
        }
        html += '</nav>';
        
        // Stats
        html += '<div class="sidebar-divider"></div>';
        html += '<div class="sidebar-section">';
        html += '<div class="sidebar-section-title">Stats</div>';
        html += '<div class="sidebar-stats" id="sidebarStats"><span class="text-muted">Loading...</span></div>';
        html += '</div>';
        
        // Services
        html += '<div class="sidebar-divider"></div>';
        html += '<div class="sidebar-section">';
        html += '<div class="sidebar-section-title">Services</div>';
        html += '<div class="services-list">';
        
        for (var j = 0; j < allServices.length; j++) {
            var s = allServices[j];
            var dotColor = s.connected ? s.color : '#3a3a4a';
            var textColor = s.connected ? 'var(--text-primary)' : 'var(--text-muted)';
            html += '<div class="service-item">';
            html += '<span class="service-dot" style="background:' + dotColor + '"></span>';
            html += '<span style="color:' + textColor + '">' + s.name + '</span>';
            html += '</div>';
        }
        html += '</div></div>';
        
        // Footer
        html += '<div class="sidebar-footer">';
        html += '<a class="nav-item" data-page="settings">';
        html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
        html += 'Settings';
        html += '</a></div>';
        
        sidebar.innerHTML = html;
        
        // Bind nav events
        var navLinks = sidebar.querySelectorAll('.nav-item');
        for (var k = 0; k < navLinks.length; k++) {
            (function(link) {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    self.navigateTo(link.getAttribute('data-page'));
                });
            })(navLinks[k]);
        }
    };

    UIManager.prototype.renderTopbar = function() {
        var topbar = document.getElementById('topbar');
        if (!topbar) return;
        
        var self = this;
        topbar.innerHTML = '' +
            '<div class="search-container">' +
                '<div class="search-input-wrapper">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
                    '<input type="text" id="globalSearch" placeholder="Search your library..." autocomplete="off">' +
                    '<span class="search-shortcut">Ctrl+K</span>' +
                '</div>' +
            '</div>' +
            '<div class="topbar-actions">' +
                '<button class="btn-icon" id="exportBtn" title="Export">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
                '</button>' +
            '</div>';
        
        document.getElementById('exportBtn').addEventListener('click', function() {
            self.exportLibrary();
        });
    };

    UIManager.prototype.renderPlayer = function() {
        var playerEl = document.getElementById('player');
        if (!playerEl) return;
        
        playerEl.innerHTML = '' +
            '<div class="player-container">' +
                '<div class="player-track">' +
                    '<div class="player-track-cover-placeholder" id="playerCover">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" width="24" height="24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>' +
                    '</div>' +
                    '<div class="player-track-info">' +
                        '<div class="player-track-title" id="playerTitle">Nothing playing</div>' +
                        '<div class="player-track-artist" id="playerArtist">Select a track</div>' +
                    '</div>' +
                    '<div class="player-track-actions">' +
                        '<button class="btn-icon" id="playerAddToPlaylistBtn" title="Add to playlist">' +
                            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
                        '</button>' +
                    '</div>' +
                '</div>' +
                '<div class="player-main">' +
                    '<div class="player-controls">' +
                        '<button class="player-btn" id="shuffleBtn">' +
                            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>' +
                        '</button>' +
                        '<button class="player-btn" id="prevBtn">' +
                            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>' +
                        '</button>' +
                        '<button class="player-btn-play" id="playBtn">' +
                            '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" id="playIcon"><polygon points="5 3 19 12 5 21 5 3"/></svg>' +
                        '</button>' +
                        '<button class="player-btn" id="nextBtn">' +
                            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>' +
                        '</button>' +
                        '<button class="player-btn" id="repeatBtn">' +
                            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>' +
                        '</button>' +
                    '</div>' +
                    '<div class="player-progress">' +
                        '<span class="player-time" id="currentTime">0:00</span>' +
                        '<div class="player-progress-bar" id="progressBar"><div class="player-progress-fill" id="progressFill" style="width:0%"><div class="player-progress-thumb"></div></div></div>' +
                        '<span class="player-time" id="totalTime">0:00</span>' +
                    '</div>' +
                '</div>' +
                '<div class="player-extras">' +
                    '<div class="player-volume">' +
                        '<button class="btn-icon" id="volumeBtn">' +
                            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>' +
                        '</button>' +
                        '<input type="range" class="player-volume-slider" id="volumeSlider" min="0" max="100" value="70">' +
                    '</div>' +
                '</div>' +
            '</div>';
    };

    UIManager.prototype.renderNotificationContainer = function() {
        var container = document.createElement('div');
        container.className = 'notification-container';
        container.id = 'notificationContainer';
        document.body.appendChild(container);
    };

    UIManager.prototype.showNotification = function(message, type) {
        var container = document.getElementById('notificationContainer');
        if (!container) return;
        
        var notification = document.createElement('div');
        notification.className = 'notification ' + (type || 'info');
        notification.textContent = message;
        container.appendChild(notification);
        
        setTimeout(function() {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            notification.style.transition = 'all 0.3s ease';
            setTimeout(function() {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    };

    UIManager.prototype.navigateTo = function(page) {
        this.currentPage = page;
        storage.set('current_page', page);
        
        // Update active nav
        var navItems = document.querySelectorAll('#sidebar .nav-item');
        for (var i = 0; i < navItems.length; i++) {
            var isActive = navItems[i].getAttribute('data-page') === page;
            if (isActive) {
                navItems[i].classList.add('active');
            } else {
                navItems[i].classList.remove('active');
            }
        }
        
        var content = document.getElementById('content');
        if (!content) return Promise.resolve();
        
        content.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div></div>';
        
        var self = this;
        var result;
        
        switch(page) {
            case 'home':
                content.innerHTML = this.getHomePage();
                result = this.loadHomeContent();
                break;
            case 'library':
                content.innerHTML = this.getLibraryPage();
                this.bindLibraryTabs();
                result = this.loadLibraryContent('tracks', 'all', 'dateAdded');
                break;
            case 'search':
                content.innerHTML = this.getSearchPage();
                result = Promise.resolve();
                break;
            case 'upload':
                content.innerHTML = this.getUploadPage();
                this.bindUploadEvents();
                result = Promise.resolve();
                break;
            case 'import':
                content.innerHTML = this.getImportPage();
                this.bindImportEvents();
                result = Promise.resolve();
                break;
            case 'playlists':
                result = this.loadPlaylistsPage();
                break;
            case 'settings':
                content.innerHTML = this.getSettingsPage();
                this.bindSettingsEvents();
                result = Promise.resolve();
                break;
            default:
                result = Promise.resolve();
        }
        
        return result;
    };

    UIManager.prototype.getHomePage = function() {
        var html = '';
        html += '<div class="page">';
        html += '<div class="page-header">';
        html += '<h1 class="page-title">My Music Platform</h1>';
        html += '<p class="page-subtitle">Independent library with import from any service</p>';
        html += '</div>';
        
        // Quick actions
        html += '<div class="quick-actions">';
        html += '<div class="action-card" id="actionUpload"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><span>Upload Music</span></div>';
        html += '<div class="action-card" id="actionImport"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg><span>Import</span></div>';
        html += '<div class="action-card" id="actionLibrary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg><span>Library</span></div>';
        html += '<div class="action-card" id="actionSearch"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><span>Search</span></div>';
        html += '</div>';
        
        // Recent tracks
        html += '<div class="section"><div class="section-header"><h2 class="section-title">Recently Added</h2></div><div id="recentTracksContainer"></div></div>';
        
        // Playlists
        html += '<div class="section"><div class="section-header"><h2 class="section-title">My Playlists</h2></div><div id="homePlaylistsContainer"></div></div>';
        
        html += '</div>';
        return html;
    };

    UIManager.prototype.loadHomeContent = function() {
        var self = this;
        var recentContainer = document.getElementById('recentTracksContainer');
        var playlistsContainer = document.getElementById('homePlaylistsContainer');
        
        if (recentContainer) {
            library.getRecentTracks(8).then(function(tracks) {
                if (tracks.length === 0) {
                    recentContainer.innerHTML = '<div class="empty-state"><p>Library is empty</p><span>Upload music or import from other services</span></div>';
                } else {
                    var html = '<div class="track-list">';
                    for (var i = 0; i < tracks.length; i++) {
                        html += self.renderTrackRow(tracks[i], i);
                    }
                    html += '</div>';
                    recentContainer.innerHTML = html;
                    
                    var rows = recentContainer.querySelectorAll('.track-row');
                    for (var j = 0; j < rows.length; j++) {
                        (function(row) {
                            row.addEventListener('click', function() {
                                self.playTrackFromRow(row);
                            });
                        })(rows[j]);
                    }
                }
            }).catch(function() {
                recentContainer.innerHTML = '<div class="empty-state"><p>Error loading tracks</p></div>';
            });
        }
        
        if (playlistsContainer) {
            library.getPlaylists().then(function(playlists) {
                if (playlists.length === 0) {
                    playlistsContainer.innerHTML = '<div class="empty-state"><p>No playlists</p></div>';
                } else {
                    var html = '<div class="playlist-grid">';
                    var limit = Math.min(playlists.length, 6);
                    for (var i = 0; i < limit; i++) {
                        html += self.renderPlaylistCard(playlists[i]);
                    }
                    html += '</div>';
                    playlistsContainer.innerHTML = html;
                    
                    var cards = playlistsContainer.querySelectorAll('.playlist-card');
                    for (var j = 0; j < cards.length; j++) {
                        (function(card) {
                            card.addEventListener('click', function() {
                                self.showPlaylistModal(card.getAttribute('data-playlist-id'));
                            });
                        })(cards[j]);
                    }
                }
            }).catch(function() {
                playlistsContainer.innerHTML = '<div class="empty-state"><p>Error loading playlists</p></div>';
            });
        }
        
        // Quick action buttons
        var actionUpload = document.getElementById('actionUpload');
        var actionImport = document.getElementById('actionImport');
        var actionLibrary = document.getElementById('actionLibrary');
        var actionSearch = document.getElementById('actionSearch');
        
        if (actionUpload) actionUpload.addEventListener('click', function() { self.navigateTo('upload'); });
        if (actionImport) actionImport.addEventListener('click', function() { self.navigateTo('import'); });
        if (actionLibrary) actionLibrary.addEventListener('click', function() { self.navigateTo('library'); });
        if (actionSearch) actionSearch.addEventListener('click', function() { self.navigateTo('search'); });
        
        return Promise.resolve();
    };

    UIManager.prototype.renderTrackRow = function(track, index) {
        var duration = track.duration ? player.formatTime(track.duration / 1000) : '--:--';
        var sourceLabel = track.source === 'local' ? 'My file' : track.source;
        var escaped = this.escapeHtml(JSON.stringify(track));
        
        return '<div class="track-row" data-track=\'' + escaped + '\'>' +
            '<span class="track-row-index">' + (index + 1) + '</span>' +
            '<div class="track-row-info">' +
                '<div class="track-row-cover-placeholder">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>' +
                '</div>' +
                '<div class="track-row-text">' +
                    '<div class="track-row-title">' + this.escapeHtml(track.title) + '</div>' +
                    '<div class="track-row-artist">' + this.escapeHtml(track.artist) + '</div>' +
                '</div>' +
            '</div>' +
            '<span class="track-row-source">' + this.escapeHtml(sourceLabel) + '</span>' +
            '<span class="track-row-duration">' + duration + '</span>' +
        '</div>';
    };

    UIManager.prototype.renderPlaylistCard = function(playlist) {
        var trackCount = playlist.tracks ? playlist.tracks.length : 0;
        return '<div class="playlist-card" data-playlist-id="' + playlist.id + '">' +
            '<div class="playlist-card-cover">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>' +
            '</div>' +
            '<div class="playlist-card-name">' + this.escapeHtml(playlist.name) + '</div>' +
            '<div class="playlist-card-count">' + trackCount + ' tracks</div>' +
        '</div>';
    };

    UIManager.prototype.getLibraryPage = function() {
        var html = '';
        html += '<div class="page">';
        html += '<div class="page-header">';
        html += '<h1 class="page-title">Library</h1>';
        html += '<div class="library-actions">';
        html += '<button class="btn btn-secondary btn-sm" id="findDuplicatesBtn">Find duplicates</button>';
        html += '<button class="btn btn-secondary btn-sm" id="removeDuplicatesBtn">Remove duplicates</button>';
        html += '</div></div>';
        
        html += '<div class="tabs">';
        html += '<button class="tab active" data-tab="tracks">Tracks</button>';
        html += '<button class="tab" data-tab="artists">Artists</button>';
        html += '<button class="tab" data-tab="albums">Albums</button>';
        html += '</div>';
        
        html += '<div class="library-filters">';
        html += '<select id="sourceFilter" class="form-input" style="width:auto;">';
        html += '<option value="all">All sources</option>';
        html += '<option value="local">Local files</option>';
        html += '<option value="spotify">Spotify</option>';
        html += '<option value="youtube">YouTube</option>';
        html += '<option value="import">Imported</option>';
        html += '</select>';
        html += '<select id="sortFilter" class="form-input" style="width:auto;">';
        html += '<option value="dateAdded">By date</option>';
        html += '<option value="title">By title</option>';
        html += '<option value="artist">By artist</option>';
        html += '<option value="playCount">By popularity</option>';
        html += '</select>';
        html += '</div>';
        
        html += '<div id="libraryContent"></div>';
        html += '</div>';
        return html;
    };

    UIManager.prototype.loadLibraryContent = function(tab, source, sort) {
        var container = document.getElementById('libraryContent');
        if (!container) return Promise.resolve();
        
        container.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div></div>';
        
        var self = this;
        var promise;
        
        if (tab === 'tracks') {
            promise = library.getTracks({ source: source || 'all', sort: sort || 'dateAdded' }).then(function(tracks) {
                if (tracks.length === 0) {
                    container.innerHTML = '<div class="empty-state"><p>No tracks found</p></div>';
                    return;
                }
                var html = '<div class="track-list">';
                for (var i = 0; i < tracks.length; i++) {
                    html += self.renderTrackRow(tracks[i], i);
                }
                html += '</div>';
                container.innerHTML = html;
                
                var rows = container.querySelectorAll('.track-row');
                for (var j = 0; j < rows.length; j++) {
                    (function(row) {
                        row.addEventListener('click', function() {
                            self.playTrackFromRow(row);
                        });
                    })(rows[j]);
                }
            });
        } else if (tab === 'artists') {
            promise = library.getArtists().then(function(artists) {
                if (artists.length === 0) {
                    container.innerHTML = '<div class="empty-state"><p>No artists found</p></div>';
                    return;
                }
                var html = '<div class="artist-grid">';
                for (var i = 0; i < artists.length; i++) {
                    html += '<div class="artist-card">';
                    html += '<div class="artist-card-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>';
                    html += '<div class="artist-card-name">' + self.escapeHtml(artists[i].name) + '</div>';
                    html += '<div class="artist-card-info">' + artists[i].trackCount + ' tracks, ' + artists[i].albums.length + ' albums</div>';
                    html += '</div>';
                }
                html += '</div>';
                container.innerHTML = html;
            });
        } else if (tab === 'albums') {
            promise = library.getAlbums().then(function(albums) {
                if (albums.length === 0) {
                    container.innerHTML = '<div class="empty-state"><p>No albums found</p></div>';
                    return;
                }
                var html = '<div class="album-grid">';
                for (var i = 0; i < albums.length; i++) {
                    html += '<div class="album-card">';
                    html += '<div class="album-card-cover"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg></div>';
                    html += '<div class="album-card-name">' + self.escapeHtml(albums[i].name) + '</div>';
                    html += '<div class="album-card-artist">' + self.escapeHtml(albums[i].artist) + '</div>';
                    html += '<div class="album-card-info">' + albums[i].trackCount + ' tracks</div>';
                    html += '</div>';
                }
                html += '</div>';
                container.innerHTML = html;
            });
        } else {
            promise = Promise.resolve();
        }
        
        return promise.catch(function() {
            container.innerHTML = '<div class="empty-state"><p>Error loading content</p></div>';
        });
    };

    UIManager.prototype.getUploadPage = function() {
        var html = '';
        html += '<div class="page">';
        html += '<div class="page-header"><h1 class="page-title">Upload Music</h1><p class="page-subtitle">Supported: MP3, WAV, FLAC, OGG, AAC, M4A</p></div>';
        html += '<div class="upload-area" id="uploadArea">';
        html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>';
        html += '<p>Drag and drop files here</p><span>or</span>';
        html += '<button class="btn btn-primary" id="selectFilesBtn">Select files</button>';
        html += '<input type="file" id="fileInput" multiple accept=".mp3,.wav,.flac,.ogg,.aac,.m4a" hidden>';
        html += '</div>';
        html += '<div id="uploadProgress" class="hidden">';
        html += '<div class="loading-container"><div class="loading-spinner"></div><span>Uploading...</span></div>';
        html += '</div>';
        html += '</div>';
        return html;
    };

    UIManager.prototype.bindUploadEvents = function() {
        var self = this;
        var fileInput = document.getElementById('fileInput');
        var selectBtn = document.getElementById('selectFilesBtn');
        var uploadArea = document.getElementById('uploadArea');
        
        if (selectBtn) {
            selectBtn.addEventListener('click', function() {
                if (fileInput) fileInput.click();
            });
        }
        
        if (uploadArea) {
            uploadArea.addEventListener('dragover', function(e) {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
            
            uploadArea.addEventListener('dragleave', function() {
                uploadArea.classList.remove('dragover');
            });
            
            uploadArea.addEventListener('drop', function(e) {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                if (e.dataTransfer.files.length > 0) {
                    self.processUpload(e.dataTransfer.files);
                }
            });
        }
        
        if (fileInput) {
            fileInput.addEventListener('change', function(e) {
                if (e.target.files.length > 0) {
                    self.processUpload(e.target.files);
                }
            });
        }
    };

    UIManager.prototype.processUpload = function(files) {
        var self = this;
        var uploadArea = document.getElementById('uploadArea');
        var progressArea = document.getElementById('uploadProgress');
        
        if (uploadArea) uploadArea.classList.add('hidden');
        if (progressArea) progressArea.classList.remove('hidden');
        
        uploadManager.uploadFiles(files, function() {}).then(function(result) {
            self.showNotification('Uploaded: ' + result.uploaded.length + ' tracks', 'success');
            self.loadSidebarStats();
            
            if (progressArea) {
                progressArea.innerHTML = '<div class="empty-state"><p>Uploaded ' + result.uploaded.length + ' tracks</p><span>' + result.failed.length + ' failed</span></div>';
            }
            
            setTimeout(function() {
                if (uploadArea) uploadArea.classList.remove('hidden');
                if (progressArea) progressArea.classList.add('hidden');
            }, 2000);
        }).catch(function(err) {
            self.showNotification('Upload failed: ' + err.message, 'error');
            if (uploadArea) uploadArea.classList.remove('hidden');
            if (progressArea) progressArea.classList.add('hidden');
        });
    };

    UIManager.prototype.getImportPage = function() {
        var allServices = services.getAll();
        var html = '';
        
        html += '<div class="page">';
        html += '<div class="page-header"><h1 class="page-title">Import Music</h1><p class="page-subtitle">Import tracks and playlists from other services</p></div>';
        
        // Services section
        html += '<div class="settings-section"><h2 class="settings-section-title">From external services</h2><div class="services-grid">';
        for (var i = 0; i < allServices.length; i++) {
            var s = allServices[i];
            html += '<div class="service-card ' + (s.connected ? 'connected' : '') + '">';
            html += '<div class="service-card-header">';
            html += '<div class="service-card-icon" style="background:' + s.color + '20;color:' + s.color + ';font-weight:bold;">' + s.name.charAt(0) + '</div>';
            html += '<div><div class="service-card-name">' + s.name + '</div>';
            html += '<div class="service-card-status ' + (s.connected ? 'connected' : '') + '">' + (s.connected ? 'Connected' : 'Not connected') + '</div></div>';
            html += '</div>';
            html += '<div class="service-card-actions">';
            if (s.connected) {
                html += '<button class="btn btn-primary btn-sm start-import" data-service="' + s.id + '">Import</button>';
            } else {
                html += '<button class="btn btn-secondary btn-sm connect-service" data-service="' + s.id + '">Connect</button>';
            }
            html += '</div></div>';
        }
        html += '</div></div>';
        
        // File import section
        html += '<div class="settings-section"><h2 class="settings-section-title">From file</h2><div class="import-options">';
        html += '<div class="import-option-card" id="importJSON"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="32" height="32"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span>Import JSON</span></div>';
        html += '<div class="import-option-card" id="importCSV"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="32" height="32"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg><span>Import CSV</span></div>';
        html += '</div><input type="file" id="importFileInput" accept=".json,.csv" hidden></div>';
        
        html += '</div>';
        return html;
    };

    UIManager.prototype.bindImportEvents = function() {
        var self = this;
        
        var connectBtns = document.querySelectorAll('.connect-service');
        for (var i = 0; i < connectBtns.length; i++) {
            (function(btn) {
                btn.addEventListener('click', function() {
                    self.showConnectModal(btn.getAttribute('data-service'));
                });
            })(connectBtns[i]);
        }
        
        var importBtns = document.querySelectorAll('.start-import');
        for (var j = 0; j < importBtns.length; j++) {
            (function(btn) {
                btn.addEventListener('click', function() {
                    self.startServiceImport(btn.getAttribute('data-service'));
                });
            })(importBtns[j]);
        }
        
        var importJSON = document.getElementById('importJSON');
        if (importJSON) {
            importJSON.addEventListener('click', function() {
                var input = document.getElementById('importFileInput');
                input.setAttribute('accept', '.json');
                input.onchange = function(e) {
                    if (e.target.files[0]) {
                        var reader = new FileReader();
                        reader.onload = function(ev) {
                            db.importLibrary(ev.target.result).then(function(count) {
                                self.showNotification('Imported ' + count + ' tracks', 'success');
                                self.loadSidebarStats();
                            }).catch(function() {
                                self.showNotification('Import failed', 'error');
                            });
                        };
                        reader.readAsText(e.target.files[0]);
                    }
                };
                input.click();
            });
        }
        
        var importCSV = document.getElementById('importCSV');
        if (importCSV) {
            importCSV.addEventListener('click', function() {
                var input = document.getElementById('importFileInput');
                input.setAttribute('accept', '.csv');
                input.onchange = function(e) {
                    if (e.target.files[0]) {
                        var reader = new FileReader();
                        reader.onload = function(ev) {
                            var text = ev.target.result;
                            var lines = text.split('\n');
                            var imported = 0;
                            var chain = Promise.resolve();
                            
                            for (var i = 1; i < lines.length; i++) {
                                if (lines[i].trim()) {
                                    (function(line) {
                                        var parts = line.split(',');
                                        chain = chain.then(function() {
                                            return db.addTrack({
                                                title: (parts[0] || '').replace(/"/g, '').trim(),
                                                artist: parts.length >= 2 ? parts[1].replace(/"/g, '').trim() : 'Unknown',
                                                source: 'import'
                                            }).then(function() { imported++; });
                                        });
                                    })(lines[i]);
                                }
                            }
                            
                            chain.then(function() {
                                self.showNotification('Imported ' + imported + ' tracks', 'success');
                                self.loadSidebarStats();
                            }).catch(function() {
                                self.showNotification('Import failed', 'error');
                            });
                        };
                        reader.readAsText(e.target.files[0]);
                    }
                };
                input.click();
            });
        }
    };

    UIManager.prototype.startServiceImport = function(serviceId) {
        var self = this;
        this.showNotification('Starting import...', 'info');
        
        if (serviceId === 'spotify') {
            var spotifyAuth = storage.get('spotify_auth');
            if (!spotifyAuth || !spotifyAuth.accessToken) {
                this.showNotification('Spotify not connected', 'error');
                return;
            }
            importer.importFromSpotify(spotifyAuth.accessToken, {
                importLiked: true,
                importPlaylists: true,
                importAlbums: true
            }).then(function(results) {
                self.showNotification('Imported: ' + results.tracks.length + ' tracks, ' + results.playlists.length + ' playlists', 'success');
                self.loadSidebarStats();
            }).catch(function(err) {
                self.showNotification('Import error: ' + err.message, 'error');
            });
        } else if (serviceId === 'youtube') {
            var youtubeConfig = storage.get('youtube_config');
            if (!youtubeConfig || !youtubeConfig.apiKey) {
                this.showNotification('YouTube not connected', 'error');
                return;
            }
            importer.importFromYouTube(youtubeConfig.apiKey, {}).then(function(results) {
                self.showNotification('Imported: ' + results.tracks.length + ' tracks', 'success');
                self.loadSidebarStats();
            }).catch(function(err) {
                self.showNotification('Import error: ' + err.message, 'error');
            });
        } else {
            this.showNotification('Import for this service is not available yet', 'error');
        }
    };

    UIManager.prototype.loadPlaylistsPage = function() {
        var self = this;
        var content = document.getElementById('content');
        if (!content) return Promise.resolve();
        
        return library.getPlaylists().then(function(playlists) {
            var html = '<div class="page"><div class="page-header"><h1 class="page-title">Playlists</h1>';
            html += '<button class="btn btn-primary" id="createPlaylistBtn">Create playlist</button></div>';
            
            if (playlists.length === 0) {
                html += '<div class="empty-state"><p>No playlists</p></div>';
            } else {
                html += '<div class="playlist-grid">';
                for (var i = 0; i < playlists.length; i++) {
                    html += self.renderPlaylistCard(playlists[i]);
                }
                html += '</div>';
            }
            html += '</div>';
            
            content.innerHTML = html;
            
            var createBtn = document.getElementById('createPlaylistBtn');
            if (createBtn) {
                createBtn.addEventListener('click', function() {
                    self.showCreatePlaylistModal();
                });
            }
            
            var cards = content.querySelectorAll('.playlist-card');
            for (var j = 0; j < cards.length; j++) {
                (function(card) {
                    card.addEventListener('click', function() {
                        self.showPlaylistModal(card.getAttribute('data-playlist-id'));
                    });
                })(cards[j]);
            }
        });
    };

    UIManager.prototype.getSearchPage = function() {
        return '<div class="page"><div class="page-header"><h1 class="page-title">Search Library</h1></div><div id="searchResults"><div class="empty-state"><p>Enter a search query</p></div></div></div>';
    };

    UIManager.prototype.getSettingsPage = function() {
        var allServices = services.getAll();
        var html = '';
        
        html += '<div class="page"><div class="page-header"><h1 class="page-title">Settings</h1></div>';
        
        html += '<div class="settings-section"><h2 class="settings-section-title">External services</h2><div class="services-grid">';
        for (var i = 0; i < allServices.length; i++) {
            var s = allServices[i];
            html += '<div class="service-card ' + (s.connected ? 'connected' : '') + '">';
            html += '<div class="service-card-header">';
            html += '<div class="service-card-icon" style="background:' + s.color + '20;color:' + s.color + ';font-weight:bold;">' + s.name.charAt(0) + '</div>';
            html += '<div><div class="service-card-name">' + s.name + '</div>';
            html += '<div class="service-card-status ' + (s.connected ? 'connected' : '') + '">' + (s.connected ? 'Connected' : 'Not connected') + '</div></div>';
            html += '</div>';
            html += '<div class="service-card-actions">';
            if (s.connected) {
                html += '<button class="btn btn-secondary btn-sm disconnect-service" data-service="' + s.id + '">Disconnect</button>';
            } else {
                html += '<button class="btn btn-primary btn-sm connect-service" data-service="' + s.id + '">Connect</button>';
            }
            html += '</div></div>';
        }
        html += '</div></div>';
        
        html += '<div class="settings-section"><h2 class="settings-section-title">Data management</h2><div class="data-actions">';
        html += '<button class="btn btn-secondary" id="exportDataBtn">Export library (JSON)</button>';
        html += '<button class="btn btn-secondary" id="clearDataBtn" style="color:var(--red);">Clear all data</button>';
        html += '</div></div>';
        
        html += '<div class="settings-section"><h2 class="settings-section-title">About</h2>';
        html += '<p class="text-muted">MusicHub Platform v1.0.0</p>';
        html += '<p class="text-muted text-sm mt-2">Independent music platform. All data is stored locally in your browser.</p>';
        html += '</div></div>';
        
        return html;
    };

    UIManager.prototype.bindSettingsEvents = function() {
        var self = this;
        
        var connectBtns = document.querySelectorAll('.connect-service');
        for (var i = 0; i < connectBtns.length; i++) {
            (function(btn) {
                btn.addEventListener('click', function() {
                    self.showConnectModal(btn.getAttribute('data-service'));
                });
            })(connectBtns[i]);
        }
        
        var disconnectBtns = document.querySelectorAll('.disconnect-service');
        for (var j = 0; j < disconnectBtns.length; j++) {
            (function(btn) {
                btn.addEventListener('click', function() {
                    services.disconnect(btn.getAttribute('data-service'));
                    self.showNotification('Service disconnected', 'success');
                    self.navigateTo('settings');
                });
            })(disconnectBtns[j]);
        }
        
        var exportBtn = document.getElementById('exportDataBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', function() {
                self.exportLibrary();
            });
        }
        
        var clearBtn = document.getElementById('clearDataBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', function() {
                self.showConfirmModal(
                    'Clear all data?',
                    'All tracks, playlists, and uploaded files will be permanently deleted.',
                    function() {
                        db.clearAll().then(function() {
                            storage.remove('play_history');
                            storage.remove('favorites');
                            storage.remove('queue');
                            self.showNotification('All data cleared', 'success');
                            self.loadSidebarStats();
                            self.navigateTo('home');
                        });
                    }
                );
            });
        }
    };

    UIManager.prototype.bindLibraryTabs = function() {
        var self = this;
        
        var tabs = document.querySelectorAll('.tab');
        for (var i = 0; i < tabs.length; i++) {
            (function(tab) {
                tab.addEventListener('click', function() {
                    // Remove active from all tabs
                    var allTabs = document.querySelectorAll('.tab');
                    for (var k = 0; k < allTabs.length; k++) {
                        allTabs[k].classList.remove('active');
                    }
                    tab.classList.add('active');
                    
                    self.currentLibraryTab = tab.getAttribute('data-tab');
                    var source = document.getElementById('sourceFilter');
                    var sort = document.getElementById('sortFilter');
                    self.loadLibraryContent(
                        self.currentLibraryTab,
                        source ? source.value : 'all',
                        sort ? sort.value : 'dateAdded'
                    );
                });
            })(tabs[i]);
        }
        
        var sourceFilter = document.getElementById('sourceFilter');
        if (sourceFilter) {
            sourceFilter.addEventListener('change', function() {
                var sort = document.getElementById('sortFilter');
                self.loadLibraryContent(
                    self.currentLibraryTab,
                    sourceFilter.value,
                    sort ? sort.value : 'dateAdded'
                );
            });
        }
        
        var sortFilter = document.getElementById('sortFilter');
        if (sortFilter) {
            sortFilter.addEventListener('change', function() {
                var source = document.getElementById('sourceFilter');
                self.loadLibraryContent(
                    self.currentLibraryTab,
                    source ? source.value : 'all',
                    sortFilter.value
                );
            });
        }
        
        var findDupBtn = document.getElementById('findDuplicatesBtn');
        if (findDupBtn) {
            findDupBtn.addEventListener('click', function() {
                library.getDuplicates().then(function(duplicates) {
                    if (duplicates.length === 0) {
                        self.showNotification('No duplicates found', 'info');
                    } else {
                        self.showNotification('Found ' + duplicates.length + ' duplicates', 'info');
                    }
                });
            });
        }
        
        var removeDupBtn = document.getElementById('removeDuplicatesBtn');
        if (removeDupBtn) {
            removeDupBtn.addEventListener('click', function() {
                library.removeDuplicates().then(function(removed) {
                    self.showNotification('Removed ' + removed.length + ' duplicates', 'success');
                    self.loadLibraryContent(self.currentLibraryTab, 'all', 'dateAdded');
                    self.loadSidebarStats();
                });
            });
        }
    };

    UIManager.prototype.showConnectModal = function(serviceId) {
        var self = this;
        var overlay = document.getElementById('modal-overlay');
        var content = document.getElementById('modal-content');
        if (!overlay || !content) return;
        
        var html = '';
        
        if (serviceId === 'spotify') {
            html += '<div class="modal-header"><h3 class="modal-title">Connect Spotify</h3><button class="modal-close" id="modalClose">X</button></div>';
            html += '<div class="form-group"><label class="form-label">Client ID</label><input type="text" class="form-input" id="spotifyClientId" placeholder="Enter Client ID">';
            html += '<p class="form-hint">Create an app at developer.spotify.com. Add ' + window.location.origin + '/callback.html to Redirect URIs.</p></div>';
            html += '<button class="btn btn-primary" id="connectSpotifyBtn" style="width:100%;">Connect</button>';
        } else if (serviceId === 'youtube') {
            html += '<div class="modal-header"><h3 class="modal-title">Connect YouTube Music</h3><button class="modal-close" id="modalClose">X</button></div>';
            html += '<div class="form-group"><label class="form-label">API Key</label><input type="text" class="form-input" id="youtubeApiKey" placeholder="Enter API Key">';
            html += '<p class="form-hint">Get API key from Google Cloud Console. Enable YouTube Data API v3.</p></div>';
            html += '<button class="btn btn-primary" id="connectYoutubeBtn" style="width:100%;">Connect</button>';
        } else if (serviceId === 'soundcloud') {
            html += '<div class="modal-header"><h3 class="modal-title">Connect SoundCloud</h3><button class="modal-close" id="modalClose">X</button></div>';
            html += '<div class="form-group"><label class="form-label">Client ID</label><input type="text" class="form-input" id="soundcloudClientId" placeholder="Enter Client ID">';
            html += '<p class="form-hint">Get Client ID from developers.soundcloud.com</p></div>';
            html += '<button class="btn btn-primary" id="connectSoundcloudBtn" style="width:100%;">Connect</button>';
        }
        
        content.innerHTML = html;
        overlay.classList.remove('hidden');
        
        this.bindModalClose(overlay, content);
        
        if (serviceId === 'spotify') {
            var spotifyBtn = document.getElementById('connectSpotifyBtn');
            if (spotifyBtn) {
                spotifyBtn.addEventListener('click', function() {
                    var clientId = document.getElementById('spotifyClientId').value.trim();
                    if (clientId) services.connectSpotify(clientId);
                });
            }
        }
        
        if (serviceId === 'youtube') {
            var ytBtn = document.getElementById('connectYoutubeBtn');
            if (ytBtn) {
                ytBtn.addEventListener('click', function() {
                    var apiKey = document.getElementById('youtubeApiKey').value.trim();
                    if (apiKey) {
                        services.connectYouTube(apiKey);
                        overlay.classList.add('hidden');
                        self.showNotification('YouTube connected', 'success');
                        self.navigateTo('settings');
                    }
                });
            }
        }
        
        if (serviceId === 'soundcloud') {
            var scBtn = document.getElementById('connectSoundcloudBtn');
            if (scBtn) {
                scBtn.addEventListener('click', function() {
                    var clientId = document.getElementById('soundcloudClientId').value.trim();
                    if (clientId) {
                        services.connectSoundCloud(clientId);
                        overlay.classList.add('hidden');
                        self.showNotification('SoundCloud connected', 'success');
                        self.navigateTo('settings');
                    }
                });
            }
        }
    };

    UIManager.prototype.showCreatePlaylistModal = function() {
        var self = this;
        var overlay = document.getElementById('modal-overlay');
        var content = document.getElementById('modal-content');
        if (!overlay || !content) return;
        
        content.innerHTML = '' +
            '<div class="modal-header"><h3 class="modal-title">Create Playlist</h3><button class="modal-close" id="modalClose">X</button></div>' +
            '<div class="form-group"><label class="form-label">Name</label><input type="text" class="form-input" id="playlistName" placeholder="My playlist"></div>' +
            '<button class="btn btn-primary" id="savePlaylistBtn" style="width:100%;">Create</button>';
        
        overlay.classList.remove('hidden');
        this.bindModalClose(overlay, content);
        
        var saveBtn = document.getElementById('savePlaylistBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', function() {
                var name = document.getElementById('playlistName').value.trim() || 'New playlist';
                library.createPlaylist(name, '').then(function() {
                    self.showNotification('Playlist created', 'success');
                    overlay.classList.add('hidden');
                    self.navigateTo('playlists');
                });
            });
        }
    };

    UIManager.prototype.showPlaylistModal = function(playlistId) {
        var self = this;
        var overlay = document.getElementById('modal-overlay');
        var content = document.getElementById('modal-content');
        if (!overlay || !content) return;
        
        library.getPlaylist(playlistId).then(function(playlist) {
            if (!playlist) return;
            
            library.getPlaylistTracks(playlistId).then(function(tracks) {
                var html = '';
                html += '<div class="modal-header"><h3 class="modal-title">' + self.escapeHtml(playlist.name) + '</h3><button class="modal-close" id="modalClose">X</button></div>';
                html += '<p class="text-muted text-sm mb-4">' + playlist.tracks.length + ' tracks</p>';
                
                html += '<div class="track-list">';
                for (var i = 0; i < tracks.length; i++) {
                    html += self.renderTrackRow(tracks[i], i);
                }
                html += '</div>';
                
                html += '<div class="mt-4">';
                html += '<button class="btn btn-secondary btn-sm" id="playAllBtn">Play all</button> ';
                html += '<button class="btn btn-secondary btn-sm" id="deletePlaylistBtn" style="color:var(--red);">Delete playlist</button>';
                html += '</div>';
                
                content.innerHTML = html;
                overlay.classList.remove('hidden');
                self.bindModalClose(overlay, content);
                
                var rows = content.querySelectorAll('.track-row');
                for (var j = 0; j < rows.length; j++) {
                    (function(row) {
                        row.addEventListener('click', function() {
                            var track = JSON.parse(row.getAttribute('data-track'));
                            player.play(track);
                        });
                    })(rows[j]);
                }
                
                var playAllBtn = document.getElementById('playAllBtn');
                if (playAllBtn) {
                    playAllBtn.addEventListener('click', function() {
                        if (tracks.length > 0) {
                            queueManager.clear();
                            for (var k = 0; k < tracks.length; k++) {
                                queueManager.add(tracks[k]);
                            }
                            player.play(tracks[0]);
                        }
                    });
                }
                
                var deleteBtn = document.getElementById('deletePlaylistBtn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', function() {
                        library.deletePlaylist(playlistId).then(function() {
                            self.showNotification('Playlist deleted', 'success');
                            overlay.classList.add('hidden');
                            self.navigateTo('playlists');
                        });
                    });
                }
            });
        });
    };

    UIManager.prototype.showConfirmModal = function(title, message, onConfirm) {
        var overlay = document.getElementById('modal-overlay');
        var content = document.getElementById('modal-content');
        if (!overlay || !content) return;
        
        content.innerHTML = '' +
            '<div class="modal-header"><h3 class="modal-title">' + title + '</h3><button class="modal-close" id="modalClose">X</button></div>' +
            '<p class="mb-4">' + message + '</p>' +
            '<div style="display:flex;gap:8px;">' +
            '<button class="btn btn-secondary" id="cancelBtn">Cancel</button>' +
            '<button class="btn btn-primary" id="confirmBtn" style="background:var(--red);">Confirm</button>' +
            '</div>';
        
        overlay.classList.remove('hidden');
        this.bindModalClose(overlay, content);
        
        var confirmBtn = document.getElementById('confirmBtn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', function() {
                overlay.classList.add('hidden');
                if (onConfirm) onConfirm();
            });
        }
        
        var cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                overlay.classList.add('hidden');
            });
        }
    };

    UIManager.prototype.bindModalClose = function(overlay, content) {
        var closeBtn = content.querySelector('#modalClose');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                overlay.classList.add('hidden');
            });
        }
        
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                overlay.classList.add('hidden');
            }
        });
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && !overlay.classList.contains('hidden')) {
                overlay.classList.add('hidden');
            }
        });
    };

    UIManager.prototype.bindGlobalEvents = function() {
        var self = this;
        var searchInput = document.getElementById('globalSearch');
        
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                var query = searchInput.value;
                if (query.length >= 2) {
                    if (self.searchTimeout) clearTimeout(self.searchTimeout);
                    self.searchTimeout = setTimeout(function() {
                        self.performSearch(query);
                    }, 300);
                }
            });
            
            searchInput.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    searchInput.value = '';
                    searchInput.blur();
                }
            });
        }
        
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                var input = document.getElementById('globalSearch');
                if (input) input.focus();
            }
            if (e.code === 'Space' && e.target === document.body) {
                e.preventDefault();
                player.togglePlay();
            }
        });
    };

    UIManager.prototype.performSearch = function(query) {
        var self = this;
        
        if (this.currentPage !== 'search') {
            this.navigateTo('search').then(function() {
                self.doSearch(query);
            });
        } else {
            this.doSearch(query);
        }
    };

    UIManager.prototype.doSearch = function(query) {
        var container = document.getElementById('searchResults');
        if (!container) return;
        
        container.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div></div>';
        
        var self = this;
        library.search(query).then(function(results) {
            if (results.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>Nothing found</p></div>';
                return;
            }
            
            var html = '<div class="track-list">';
            for (var i = 0; i < results.length; i++) {
                html += self.renderTrackRow(results[i], i);
            }
            html += '</div>';
            container.innerHTML = html;
            
            var rows = container.querySelectorAll('.track-row');
            for (var j = 0; j < rows.length; j++) {
                (function(row) {
                    row.addEventListener('click', function() {
                        self.playTrackFromRow(row);
                    });
                })(rows[j]);
            }
        }).catch(function() {
            container.innerHTML = '<div class="empty-state"><p>Search error</p></div>';
        });
    };

    UIManager.prototype.playTrackFromRow = function(row) {
        var trackData = row.getAttribute('data-track');
        if (trackData) {
            try {
                var track = JSON.parse(trackData);
                player.play(track);
            } catch (e) {
                console.error('Failed to parse track data:', e);
            }
        }
    };

    UIManager.prototype.updatePlayerUI = function() {
        var track = player.currentTrack;
        
        var titleEl = document.getElementById('playerTitle');
        var artistEl = document.getElementById('playerArtist');
        var playIcon = document.getElementById('playIcon');
        
        if (titleEl) titleEl.textContent = track ? track.title : 'Nothing playing';
        if (artistEl) artistEl.textContent = track ? track.artist : 'Select a track';
        
        if (playIcon) {
            if (player.isPlaying) {
                playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
            } else {
                playIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
            }
        }
    };

    UIManager.prototype.updateProgress = function(data) {
        var currentTime = document.getElementById('currentTime');
        var totalTime = document.getElementById('totalTime');
        var progressFill = document.getElementById('progressFill');
        
        if (currentTime) currentTime.textContent = player.formatTime(data.currentTime);
        if (totalTime) totalTime.textContent = player.formatTime(data.duration);
        if (progressFill) progressFill.style.width = (data.progress * 100) + '%';
    };

    UIManager.prototype.bindPlayerEvents = function() {
        var self = this;
        
        var playBtn = document.getElementById('playBtn');
        var prevBtn = document.getElementById('prevBtn');
        var nextBtn = document.getElementById('nextBtn');
        var shuffleBtn = document.getElementById('shuffleBtn');
        var repeatBtn = document.getElementById('repeatBtn');
        var volumeSlider = document.getElementById('volumeSlider');
        var progressBar = document.getElementById('progressBar');
        var addToPlaylistBtn = document.getElementById('playerAddToPlaylistBtn');
        
        if (playBtn) playBtn.addEventListener('click', function() { player.togglePlay(); });
        
        if (prevBtn) {
            prevBtn.addEventListener('click', function() {
                var prev = queueManager.getPrevious();
                if (prev) player.play(prev);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                var next = queueManager.getNext();
                if (next) player.play(next);
            });
        }
        
        if (shuffleBtn) shuffleBtn.addEventListener('click', function() { queueManager.toggleShuffle(); });
        if (repeatBtn) repeatBtn.addEventListener('click', function() { queueManager.toggleRepeat(); });
        
        if (volumeSlider) {
            volumeSlider.addEventListener('input', function() {
                player.setVolume(volumeSlider.value / 100);
            });
        }
        
        if (progressBar) {
            progressBar.addEventListener('click', function(e) {
                var rect = progressBar.getBoundingClientRect();
                var ratio = (e.clientX - rect.left) / rect.width;
                var duration = player.getDuration();
                if (duration) player.seek(ratio * duration);
            });
        }
        
        if (addToPlaylistBtn) {
            addToPlaylistBtn.addEventListener('click', function() {
                var track = player.currentTrack;
                if (track) self.showAddToPlaylistModal(track.id);
            });
        }
    };

    UIManager.prototype.showAddToPlaylistModal = function(trackId) {
        var self = this;
        var overlay = document.getElementById('modal-overlay');
        var content = document.getElementById('modal-content');
        if (!overlay || !content) return;
        
        library.getPlaylists().then(function(playlists) {
            var html = '';
            html += '<div class="modal-header"><h3 class="modal-title">Add to playlist</h3><button class="modal-close" id="modalClose">X</button></div>';
            
            if (playlists.length === 0) {
                html += '<p class="text-muted">No playlists</p>';
            } else {
                for (var i = 0; i < playlists.length; i++) {
                    html += '<div class="playlist-option" data-playlist-id="' + playlists[i].id + '">';
                    html += self.escapeHtml(playlists[i].name) + ' (' + playlists[i].tracks.length + ')';
                    html += '</div>';
                }
            }
            
            html += '<button class="btn btn-secondary btn-sm mt-4" id="createNewPlaylistBtn">New playlist</button>';
            
            content.innerHTML = html;
            overlay.classList.remove('hidden');
            self.bindModalClose(overlay, content);
            
            var options = content.querySelectorAll('.playlist-option');
            for (var j = 0; j < options.length; j++) {
                (function(option) {
                    option.addEventListener('click', function() {
                        library.addToPlaylist(option.getAttribute('data-playlist-id'), trackId).then(function() {
                            self.showNotification('Added to playlist', 'success');
                            overlay.classList.add('hidden');
                        });
                    });
                })(options[j]);
            }
            
            var createBtn = document.getElementById('createNewPlaylistBtn');
            if (createBtn) {
                createBtn.addEventListener('click', function() {
                    overlay.classList.add('hidden');
                    self.showCreatePlaylistModal();
                });
            }
        });
    };

    UIManager.prototype.exportLibrary = function() {
        var self = this;
        library.exportLibrary().then(function(data) {
            var blob = new Blob([data], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'musichub-export-' + new Date().toISOString().split('T')[0] + '.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            self.showNotification('Library exported', 'success');
        }).catch(function() {
            self.showNotification('Export failed', 'error');
        });
    };

    UIManager.prototype.escapeHtml = function(str) {
        if (!str) return '';
        var div = document.createElement('div');
        if (div.textContent !== undefined) {
            div.textContent = str;
        } else {
            div.innerText = str;
        }
        return div.innerHTML;
    };

    window.ui = new UIManager();
})();
