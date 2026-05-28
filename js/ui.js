(function() {
    'use strict';

    function UIManager() {
        this.currentPage = 'home';
        this.currentTab = 'tracks';
        this.searchTimeout = null;
        this.renderingSidebar = false;
    }

    UIManager.prototype.init = function() {
        var self = this;
        this.renderSidebar();
        this.bindSidebarEvents();
        this.bindTopbarEvents();
        this.bindPlayerEvents();
        this.bindGlobalKeys();
        this.checkSpotifyCallback();
        
        var savedPage = storage.get('current_page', 'home');
        return this.navigateTo(savedPage).then(function() {
            self.loadSidebarStats();
        });
    };

    UIManager.prototype.renderSidebar = function() {
        if (this.renderingSidebar) return;
        this.renderingSidebar = true;
        
        var nav = document.getElementById('sidebarNav');
        if (!nav) { this.renderingSidebar = false; return; }
        
        var navItems = [
            { page: 'home', svg: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>', label: 'Home' },
            { page: 'library', svg: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>', label: 'Library' },
            { page: 'search', svg: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>', label: 'Search' },
            { page: 'upload', svg: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>', label: 'Upload' },
            { page: 'import', svg: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>', label: 'Import' },
            { page: 'playlists', svg: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>', label: 'Playlists' }
        ];
        
        var html = '';
        for (var i = 0; i < navItems.length; i++) {
            html += '<a class="nav-item' + (navItems[i].page === this.currentPage ? ' active' : '') + '" data-page="' + navItems[i].page + '">';
            html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' + navItems[i].svg + '</svg>';
            html += navItems[i].label;
            html += '</a>';
        }
        nav.innerHTML = html;
        this.renderingSidebar = false;
    };

    UIManager.prototype.bindSidebarEvents = function() {
        var self = this;
        var nav = document.getElementById('sidebarNav');
        if (!nav) return;
        
        nav.addEventListener('click', function(e) {
            var item = e.target.closest ? e.target.closest('.nav-item') : null;
            if (!item) return;
            e.preventDefault();
            var page = item.getAttribute('data-page');
            if (page) self.navigateTo(page);
        });
    };

    UIManager.prototype.bindTopbarEvents = function() {
        var self = this;
        var exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', function() { self.exportLibrary(); });
        }
        
        var searchInput = document.getElementById('globalSearch');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                var query = searchInput.value.trim();
                if (self.searchTimeout) clearTimeout(self.searchTimeout);
                if (query.length >= 2) {
                    self.searchTimeout = setTimeout(function() {
                        self.performSearch(query);
                    }, 350);
                }
            });
        }
    };

    UIManager.prototype.bindGlobalKeys = function() {
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                var input = document.getElementById('globalSearch');
                if (input) input.focus();
            }
            if (e.code === 'Space' && document.activeElement === document.body) {
                e.preventDefault();
                player.togglePlay();
            }
            if (e.key === 'Escape') {
                var overlay = document.getElementById('modal-overlay');
                if (overlay && !overlay.classList.contains('hidden')) {
                    overlay.classList.add('hidden');
                }
            }
        });
    };

    UIManager.prototype.navigateTo = function(page) {
        this.currentPage = page;
        storage.set('current_page', page);
        this.renderSidebar();
        this.bindSidebarEvents();
        
        var content = document.getElementById('content');
        if (!content) return Promise.resolve();
        
        content.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div></div>';
        
        var self = this;
        var promise;
        
        switch(page) {
            case 'home': promise = this.renderHome(); break;
            case 'library': promise = this.renderLibrary(); break;
            case 'search': promise = this.renderSearch(); break;
            case 'upload': promise = this.renderUpload(); break;
            case 'import': promise = this.renderImport(); break;
            case 'playlists': promise = this.renderPlaylists(); break;
            case 'settings': promise = this.renderSettings(); break;
            default: promise = Promise.resolve(); break;
        }
        
        return promise.catch(function(err) {
            content.innerHTML = '<div class="empty-state"><p>Error loading page</p><span>' + err.message + '</span></div>';
        });
    };

    UIManager.prototype.renderHome = function() {
        var self = this;
        var content = document.getElementById('content');
        
        content.innerHTML = '' +
            '<div class="page">' +
                '<div class="page-header"><h1 class="page-title">My Music Platform</h1><p class="page-subtitle">Independent library with import from any service</p></div>' +
                '<div class="quick-actions">' +
                    '<div class="action-card" data-action="upload"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><span>Upload Music</span></div>' +
                    '<div class="action-card" data-action="import"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg><span>Import</span></div>' +
                    '<div class="action-card" data-action="library"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg><span>Library</span></div>' +
                    '<div class="action-card" data-action="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><span>Search</span></div>' +
                '</div>' +
                '<div class="section"><div class="section-header"><h2 class="section-title">Recently Added</h2></div><div id="recentTracksContainer"></div></div>' +
                '<div class="section"><div class="section-header"><h2 class="section-title">My Playlists</h2></div><div id="homePlaylistsContainer"></div></div>' +
            '</div>';
        
        content.querySelectorAll('.action-card').forEach(function(card) {
            card.addEventListener('click', function() {
                var action = card.getAttribute('data-action');
                if (action) self.navigateTo(action);
            });
        });
        
        var recentDiv = document.getElementById('recentTracksContainer');
        if (recentDiv) {
            library.getRecentTracks(8).then(function(tracks) {
                if (tracks.length === 0) {
                    recentDiv.innerHTML = '<div class="empty-state"><p>Library is empty</p><span>Upload or import music to get started</span></div>';
                } else {
                    var html = '<div class="track-list">';
                    for (var i = 0; i < tracks.length; i++) {
                        html += self.renderTrackRow(tracks[i], i);
                    }
                    html += '</div>';
                    recentDiv.innerHTML = html;
                    self.bindTrackRowClicks(recentDiv);
                }
            }).catch(function() {
                recentDiv.innerHTML = '<div class="empty-state"><p>Error loading</p></div>';
            });
        }
        
        var plDiv = document.getElementById('homePlaylistsContainer');
        if (plDiv) {
            library.getPlaylists().then(function(playlists) {
                if (playlists.length === 0) {
                    plDiv.innerHTML = '<div class="empty-state"><p>No playlists</p></div>';
                } else {
                    var html = '<div class="playlist-grid">';
                    var max = Math.min(playlists.length, 6);
                    for (var j = 0; j < max; j++) {
                        html += self.renderPlaylistCard(playlists[j]);
                    }
                    html += '</div>';
                    plDiv.innerHTML = html;
                    plDiv.querySelectorAll('.playlist-card').forEach(function(card) {
                        card.addEventListener('click', function() {
                            self.showPlaylistModal(card.getAttribute('data-playlist-id'));
                        });
                    });
                }
            }).catch(function() {
                plDiv.innerHTML = '<div class="empty-state"><p>Error loading</p></div>';
            });
        }
        
        return Promise.resolve();
    };

    UIManager.prototype.renderLibrary = function() {
        var self = this;
        var content = document.getElementById('content');
        
        content.innerHTML = '' +
            '<div class="page">' +
                '<div class="page-header"><h1 class="page-title">Library</h1>' +
                    '<div class="library-actions">' +
                        '<button class="btn btn-secondary btn-sm" id="findDuplicatesBtn">Find duplicates</button>' +
                        '<button class="btn btn-danger btn-sm" id="removeDuplicatesBtn">Remove duplicates</button>' +
                    '</div>' +
                '</div>' +
                '<div class="tabs" id="libraryTabs">' +
                    '<button class="tab active" data-tab="tracks">Tracks</button>' +
                    '<button class="tab" data-tab="artists">Artists</button>' +
                    '<button class="tab" data-tab="albums">Albums</button>' +
                '</div>' +
                '<div class="library-filters">' +
                    '<select id="sourceFilter" class="form-input" style="width:auto;">' +
                        '<option value="all">All</option><option value="local">Local</option><option value="spotify">Spotify</option><option value="youtube">YouTube</option><option value="import">Imported</option>' +
                    '</select>' +
                    '<select id="sortFilter" class="form-input" style="width:auto;">' +
                        '<option value="dateAdded">By date</option><option value="title">By title</option><option value="artist">By artist</option><option value="playCount">By popularity</option>' +
                    '</select>' +
                '</div>' +
                '<div id="libraryContent"></div>' +
            '</div>';
        
        document.getElementById('libraryTabs').addEventListener('click', function(e) {
            var tab = e.target.closest ? e.target.closest('.tab') : null;
            if (!tab) return;
            var tabs = document.querySelectorAll('#libraryTabs .tab');
            for (var i = 0; i < tabs.length; i++) { tabs[i].classList.remove('active'); }
            tab.classList.add('active');
            self.currentTab = tab.getAttribute('data-tab');
            self.loadLibraryContent();
        });
        
        var sourceEl = document.getElementById('sourceFilter');
        var sortEl = document.getElementById('sortFilter');
        if (sourceEl) sourceEl.addEventListener('change', function() { self.loadLibraryContent(); });
        if (sortEl) sortEl.addEventListener('change', function() { self.loadLibraryContent(); });
        
        document.getElementById('findDuplicatesBtn').addEventListener('click', function() {
            library.getDuplicates().then(function(dups) {
                self.showNotification(dups.length === 0 ? 'No duplicates found' : 'Found ' + dups.length + ' duplicates', 'info');
            });
        });
        
        document.getElementById('removeDuplicatesBtn').addEventListener('click', function() {
            self.showConfirm('Remove all duplicates?', 'This will delete duplicate tracks permanently.', function() {
                library.removeDuplicates().then(function(removed) {
                    self.showNotification('Removed ' + removed.length + ' duplicates', 'success');
                    self.loadLibraryContent();
                    self.loadSidebarStats();
                });
            });
        });
        
        return this.loadLibraryContent();
    };

    UIManager.prototype.loadLibraryContent = function() {
        var self = this;
        var container = document.getElementById('libraryContent');
        if (!container) return Promise.resolve();
        
        container.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div></div>';
        
        var source = document.getElementById('sourceFilter');
        var sort = document.getElementById('sortFilter');
        var sourceVal = source ? source.value : 'all';
        var sortVal = sort ? sort.value : 'dateAdded';
        
        var promise;
        if (this.currentTab === 'tracks') {
            promise = library.getTracks({ source: sourceVal, sort: sortVal }).then(function(tracks) {
                if (tracks.length === 0) {
                    container.innerHTML = '<div class="empty-state"><p>No tracks found</p></div>';
                    return;
                }
                var html = '<div class="track-list">';
                for (var i = 0; i < tracks.length; i++) { html += self.renderTrackRow(tracks[i], i); }
                html += '</div>';
                container.innerHTML = html;
                self.bindTrackRowClicks(container);
            });
        } else if (this.currentTab === 'artists') {
            promise = library.getArtists().then(function(artists) {
                if (artists.length === 0) {
                    container.innerHTML = '<div class="empty-state"><p>No artists found</p></div>';
                    return;
                }
                var html = '<div class="artist-grid">';
                for (var i = 0; i < artists.length; i++) {
                    html += '<div class="artist-card"><div class="artist-card-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div><div class="artist-card-name">' + self.esc(artists[i].name) + '</div><div class="artist-card-info">' + artists[i].trackCount + ' tracks</div></div>';
                }
                html += '</div>';
                container.innerHTML = html;
            });
        } else {
            promise = library.getAlbums().then(function(albums) {
                if (albums.length === 0) {
                    container.innerHTML = '<div class="empty-state"><p>No albums found</p></div>';
                    return;
                }
                var html = '<div class="album-grid">';
                for (var i = 0; i < albums.length; i++) {
                    html += '<div class="album-card"><div class="album-card-cover"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg></div><div class="album-card-name">' + self.esc(albums[i].name) + '</div><div class="album-card-artist">' + self.esc(albums[i].artist) + '</div><div class="album-card-info">' + albums[i].trackCount + ' tracks</div></div>';
                }
                html += '</div>';
                container.innerHTML = html;
            });
        }
        
        return promise.catch(function() {
            container.innerHTML = '<div class="empty-state"><p>Error loading</p></div>';
        });
    };

    UIManager.prototype.renderSearch = function() {
        document.getElementById('content').innerHTML = '<div class="page"><div class="page-header"><h1 class="page-title">Search Library</h1></div><div id="searchResults"><div class="empty-state"><p>Enter a search query in the search bar</p></div></div></div>';
        return Promise.resolve();
    };

    UIManager.prototype.renderUpload = function() {
        var self = this;
        var content = document.getElementById('content');
        content.innerHTML = '' +
            '<div class="page"><div class="page-header"><h1 class="page-title">Upload Music</h1><p class="page-subtitle">MP3, WAV, FLAC, OGG, AAC, M4A</p></div>' +
            '<div class="upload-area" id="uploadArea"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><p>Drag files here</p><span>or</span><button class="btn btn-primary" id="selectFilesBtn">Select files</button></div>' +
            '<input type="file" id="fileInput" multiple accept=".mp3,.wav,.flac,.ogg,.aac,.m4a" hidden>' +
            '<div id="uploadProgress" class="hidden mt-4"></div></div>';
        
        var area = document.getElementById('uploadArea');
        var input = document.getElementById('fileInput');
        var progress = document.getElementById('uploadProgress');
        
        document.getElementById('selectFilesBtn').addEventListener('click', function() { input.click(); });
        area.addEventListener('dragover', function(e) { e.preventDefault(); area.classList.add('dragover'); });
        area.addEventListener('dragleave', function() { area.classList.remove('dragover'); });
        area.addEventListener('drop', function(e) {
            e.preventDefault();
            area.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) self.doUpload(e.dataTransfer.files, area, progress);
        });
        input.addEventListener('change', function() {
            if (input.files.length > 0) self.doUpload(input.files, area, progress);
        });
        
        return Promise.resolve();
    };

    UIManager.prototype.doUpload = function(files, area, progress) {
        var self = this;
        area.classList.add('hidden');
        progress.classList.remove('hidden');
        progress.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><span>Uploading...</span></div>';
        
        uploadManager.uploadFiles(files).then(function(result) {
            progress.innerHTML = '<div class="empty-state"><p>Uploaded: ' + result.uploaded.length + ' tracks</p>' + (result.failed.length > 0 ? '<span>Failed: ' + result.failed.length + '</span>' : '') + '</div>';
            self.showNotification('Uploaded ' + result.uploaded.length + ' tracks', 'success');
            self.loadSidebarStats();
            setTimeout(function() { area.classList.remove('hidden'); progress.classList.add('hidden'); }, 2000);
        }).catch(function(err) {
            progress.innerHTML = '<div class="empty-state"><p>Upload failed</p><span>' + err.message + '</span></div>';
            self.showNotification('Upload failed', 'error');
        });
    };

    UIManager.prototype.renderImport = function() {
        var self = this;
        var allServices = services.getAll();
        var content = document.getElementById('content');
        
        var html = '<div class="page"><div class="page-header"><h1 class="page-title">Import Music</h1><p class="page-subtitle">Import from external services or files</p></div>';
        html += '<div class="settings-section"><h2 class="settings-section-title">External services</h2><div class="services-grid">';
        
        for (var i = 0; i < allServices.length; i++) {
            var s = allServices[i];
            html += '<div class="service-card ' + (s.connected ? 'connected' : '') + '">';
            html += '<div class="service-card-header"><div class="service-card-icon" style="background:' + s.color + '20;color:' + s.color + ';">' + s.name.charAt(0) + '</div>';
            html += '<div><div class="service-card-name">' + s.name + '</div><div class="service-card-status' + (s.connected ? ' connected' : '') + '">' + (s.connected ? 'Connected' : 'Not connected') + '</div></div></div>';
            html += '<div class="service-card-actions">';
            if (s.connected) {
                html += '<button class="btn btn-primary btn-sm start-import" data-service="' + s.id + '">Import</button>';
            } else {
                html += '<button class="btn btn-secondary btn-sm connect-service" data-service="' + s.id + '">Connect</button>';
            }
            html += '</div></div>';
        }
        html += '</div></div>';
        
        html += '<div class="settings-section"><h2 class="settings-section-title">From file</h2><div class="import-options">';
        html += '<div class="import-option-card" id="importJSON"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span>Import JSON</span></div>';
        html += '<div class="import-option-card" id="importCSV"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg><span>Import CSV</span></div>';
        html += '</div><input type="file" id="importFileInput" accept=".json,.csv" hidden></div></div>';
        
        content.innerHTML = html;
        
        content.querySelectorAll('.connect-service').forEach(function(btn) {
            btn.addEventListener('click', function() { self.showConnectModal(btn.getAttribute('data-service')); });
        });
        
        content.querySelectorAll('.start-import').forEach(function(btn) {
            btn.addEventListener('click', function() { self.startServiceImport(btn.getAttribute('data-service')); });
        });
        
        document.getElementById('importJSON').addEventListener('click', function() {
            var inp = document.getElementById('importFileInput');
            inp.accept = '.json';
            inp.onchange = function(e) {
                if (e.target.files[0]) {
                    importer.importFromJSON(e.target.files[0]).then(function(r) {
                        self.showNotification('Imported ' + r.importedCount + ' tracks', 'success');
                        self.loadSidebarStats();
                    }).catch(function() { self.showNotification('Import failed', 'error'); });
                }
            };
            inp.click();
        });
        
        document.getElementById('importCSV').addEventListener('click', function() {
            var inp = document.getElementById('importFileInput');
            inp.accept = '.csv';
            inp.onchange = function(e) {
                if (e.target.files[0]) {
                    importer.importFromCSV(e.target.files[0]).then(function(r) {
                        self.showNotification('Imported ' + r.importedCount + ' tracks', 'success');
                        self.loadSidebarStats();
                    }).catch(function() { self.showNotification('Import failed', 'error'); });
                }
            };
            inp.click();
        });
        
        return Promise.resolve();
    };

    UIManager.prototype.startServiceImport = function(serviceId) {
        var self = this;
        this.showNotification('Starting import...', 'info');
        
        if (serviceId === 'spotify') {
            var auth = storage.get('spotify_auth');
            if (!auth || !auth.accessToken) { this.showNotification('Spotify not connected', 'error'); return; }
            importer.importFromSpotify(auth.accessToken, { importLiked: true, importPlaylists: true, importAlbums: true })
                .then(function(r) { self.showNotification('Imported ' + r.tracks.length + ' tracks, ' + r.playlists.length + ' playlists', 'success'); self.loadSidebarStats(); })
                .catch(function(e) { self.showNotification('Import error: ' + e.message, 'error'); });
        } else if (serviceId === 'youtube') {
            var yt = storage.get('youtube_config');
            if (!yt || !yt.apiKey) { this.showNotification('YouTube not connected', 'error'); return; }
            importer.importFromYouTube(yt.apiKey, {}).then(function(r) { self.showNotification('Imported ' + r.tracks.length + ' tracks', 'success'); self.loadSidebarStats(); })
                .catch(function(e) { self.showNotification('Import error: ' + e.message, 'error'); });
        } else {
            this.showNotification('Import not available for this service', 'error');
        }
    };

    UIManager.prototype.renderPlaylists = function() {
        var self = this;
        var content = document.getElementById('content');
        return library.getPlaylists().then(function(playlists) {
            var html = '<div class="page"><div class="page-header"><h1 class="page-title">Playlists</h1><button class="btn btn-primary" id="createPlaylistBtn">Create playlist</button></div>';
            if (playlists.length === 0) {
                html += '<div class="empty-state"><p>No playlists</p></div>';
            } else {
                html += '<div class="playlist-grid">';
                for (var i = 0; i < playlists.length; i++) { html += self.renderPlaylistCard(playlists[i]); }
                html += '</div>';
            }
            html += '</div>';
            content.innerHTML = html;
            
            document.getElementById('createPlaylistBtn').addEventListener('click', function() { self.showCreatePlaylistModal(); });
            content.querySelectorAll('.playlist-card').forEach(function(card) {
                card.addEventListener('click', function() { self.showPlaylistModal(card.getAttribute('data-playlist-id')); });
            });
        });
    };

    UIManager.prototype.renderSettings = function() {
        var self = this;
        var allServices = services.getAll();
        var content = document.getElementById('content');
        
        var html = '<div class="page"><div class="page-header"><h1 class="page-title">Settings</h1></div>';
        html += '<div class="settings-section"><h2 class="settings-section-title">External services</h2><div class="services-grid">';
        
        for (var i = 0; i < allServices.length; i++) {
            var s = allServices[i];
            html += '<div class="service-card ' + (s.connected ? 'connected' : '') + '">';
            html += '<div class="service-card-header"><div class="service-card-icon" style="background:' + s.color + '20;color:' + s.color + ';">' + s.name.charAt(0) + '</div>';
            html += '<div><div class="service-card-name">' + s.name + '</div><div class="service-card-status' + (s.connected ? ' connected' : '') + '">' + (s.connected ? 'Connected' : 'Not connected') + '</div></div></div>';
            html += '<div class="service-card-actions">';
            html += s.connected ? '<button class="btn btn-secondary btn-sm disconnect-service" data-service="' + s.id + '">Disconnect</button>' : '<button class="btn btn-primary btn-sm connect-service" data-service="' + s.id + '">Connect</button>';
            html += '</div></div>';
        }
        html += '</div></div>';
        
        html += '<div class="settings-section"><h2 class="settings-section-title">Data</h2><div class="data-actions">';
        html += '<button class="btn btn-secondary" id="exportDataBtn">Export library (JSON)</button>';
        html += '<button class="btn btn-danger" id="clearDataBtn">Clear all data</button></div></div>';
        html += '<div class="settings-section"><h2 class="settings-section-title">About</h2><p class="text-muted">MusicHub Platform v1.0.0</p><p class="text-muted text-sm mt-2">All data stored locally in your browser.</p></div></div>';
        
        content.innerHTML = html;
        
        content.querySelectorAll('.connect-service').forEach(function(btn) {
            btn.addEventListener('click', function() { self.showConnectModal(btn.getAttribute('data-service')); });
        });
        content.querySelectorAll('.disconnect-service').forEach(function(btn) {
            btn.addEventListener('click', function() {
                services.disconnect(btn.getAttribute('data-service'));
                self.showNotification('Disconnected', 'success');
                self.navigateTo('settings');
            });
        });
        document.getElementById('exportDataBtn').addEventListener('click', function() { self.exportLibrary(); });
        document.getElementById('clearDataBtn').addEventListener('click', function() {
            self.showConfirm('Clear all data?', 'Everything will be permanently deleted.', function() {
                db.clearAll().then(function() {
                    storage.remove('play_history'); storage.remove('queue');
                    self.showNotification('Data cleared', 'success');
                    self.loadSidebarStats(); self.navigateTo('home');
                });
            });
        });
        
        return Promise.resolve();
    };

    UIManager.prototype.renderTrackRow = function(track, index) {
        var dur = track.duration ? player.formatTime(track.duration / 1000) : '--:--';
        var src = track.source === 'local' ? 'My file' : track.source;
        return '<div class="track-row" data-track=\'' + this.esc(JSON.stringify(track)) + '\'>' +
            '<span class="track-row-index">' + (index + 1) + '</span>' +
            '<div class="track-row-info"><div class="track-row-cover-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div>' +
            '<div class="track-row-text"><div class="track-row-title">' + this.esc(track.title) + '</div><div class="track-row-artist">' + this.esc(track.artist) + '</div></div></div>' +
            '<span class="track-row-source">' + this.esc(src) + '</span><span class="track-row-duration">' + dur + '</span></div>';
    };

    UIManager.prototype.renderPlaylistCard = function(pl) {
        var count = pl.tracks ? pl.tracks.length : 0;
        return '<div class="playlist-card" data-playlist-id="' + pl.id + '"><div class="playlist-card-cover"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="36"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg></div><div class="playlist-card-name">' + this.esc(pl.name) + '</div><div class="playlist-card-count">' + count + ' tracks</div></div>';
    };

    UIManager.prototype.bindTrackRowClicks = function(container) {
        var self = this;
        var rows = container.querySelectorAll('.track-row');
        for (var i = 0; i < rows.length; i++) {
            (function(row) {
                row.addEventListener('click', function() {
                    try {
                        var track = JSON.parse(row.getAttribute('data-track'));
                        player.play(track);
                        queueManager.add(track);
                    } catch(e) {}
                });
            })(rows[i]);
        }
    };

    UIManager.prototype.performSearch = function(query) {
        var self = this;
        if (this.currentPage !== 'search') {
            this.navigateTo('search').then(function() { self.doSearch(query); });
        } else {
            this.doSearch(query);
        }
    };

    UIManager.prototype.doSearch = function(query) {
        var self = this;
        var container = document.getElementById('searchResults');
        if (!container) return;
        container.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div></div>';
        
        library.search(query).then(function(results) {
            if (results.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>Nothing found</p></div>';
                return;
            }
            var html = '<div class="track-list">';
            for (var i = 0; i < results.length; i++) { html += self.renderTrackRow(results[i], i); }
            html += '</div>';
            container.innerHTML = html;
            self.bindTrackRowClicks(container);
        }).catch(function() {
            container.innerHTML = '<div class="empty-state"><p>Search error</p></div>';
        });
    };

    UIManager.prototype.showConnectModal = function(serviceId) {
        var self = this;
        var overlay = document.getElementById('modal-overlay');
        var content = document.getElementById('modal-content');
        if (!overlay || !content) return;
        
        var html = '';
        if (serviceId === 'spotify') {
            html = '<div class="modal-header"><h3 class="modal-title">Connect Spotify</h3><span class="modal-close">X</span></div><div class="form-group"><label class="form-label">Client ID</label><input type="text" class="form-input" id="modalInput" placeholder="Client ID"><p class="form-hint">From developer.spotify.com dashboard</p></div><button class="btn btn-primary" id="modalSubmit" style="width:100%;">Connect</button>';
        } else if (serviceId === 'youtube') {
            html = '<div class="modal-header"><h3 class="modal-title">Connect YouTube</h3><span class="modal-close">X</span></div><div class="form-group"><label class="form-label">API Key</label><input type="text" class="form-input" id="modalInput" placeholder="API Key"><p class="form-hint">From Google Cloud Console</p></div><button class="btn btn-primary" id="modalSubmit" style="width:100%;">Connect</button>';
        } else if (serviceId === 'soundcloud') {
            html = '<div class="modal-header"><h3 class="modal-title">Connect SoundCloud</h3><span class="modal-close">X</span></div><div class="form-group"><label class="form-label">Client ID</label><input type="text" class="form-input" id="modalInput" placeholder="Client ID"></div><button class="btn btn-primary" id="modalSubmit" style="width:100%;">Connect</button>';
        }
        
        content.innerHTML = html;
        overlay.classList.remove('hidden');
        
        var close = content.querySelector('.modal-close');
        var submit = document.getElementById('modalSubmit');
        var input = document.getElementById('modalInput');
        
        var closeModal = function() { overlay.classList.add('hidden'); };
        if (close) close.addEventListener('click', closeModal);
        overlay.addEventListener('click', function(e) { if (e.target === overlay) closeModal(); });
        
        if (submit && input) {
            submit.addEventListener('click', function() {
                var val = input.value.trim();
                if (!val) return;
                if (serviceId === 'spotify') { services.connectSpotify(val); }
                else if (serviceId === 'youtube') { services.connectYouTube(val); closeModal(); self.showNotification('Connected', 'success'); self.navigateTo('settings'); }
                else if (serviceId === 'soundcloud') { services.connectSoundCloud(val); closeModal(); self.showNotification('Connected', 'success'); self.navigateTo('settings'); }
            });
        }
    };

    UIManager.prototype.showCreatePlaylistModal = function() {
        var self = this;
        var overlay = document.getElementById('modal-overlay');
        var content = document.getElementById('modal-content');
        
        content.innerHTML = '<div class="modal-header"><h3 class="modal-title">Create Playlist</h3><span class="modal-close">X</span></div><div class="form-group"><label class="form-label">Name</label><input type="text" class="form-input" id="playlistNameInput" placeholder="My playlist"></div><button class="btn btn-primary" id="savePlaylistBtn" style="width:100%;">Create</button>';
        overlay.classList.remove('hidden');
        
        var closeModal = function() { overlay.classList.add('hidden'); };
        content.querySelector('.modal-close').addEventListener('click', closeModal);
        overlay.addEventListener('click', function(e) { if (e.target === overlay) closeModal(); });
        
        document.getElementById('savePlaylistBtn').addEventListener('click', function() {
            var name = document.getElementById('playlistNameInput').value.trim() || 'New playlist';
            library.createPlaylist(name, '').then(function() {
                self.showNotification('Playlist created', 'success');
                closeModal();
                self.navigateTo('playlists');
            });
        });
    };

    UIManager.prototype.showPlaylistModal = function(playlistId) {
        var self = this;
        var overlay = document.getElementById('modal-overlay');
        var content = document.getElementById('modal-content');
        
        library.getPlaylist(playlistId).then(function(pl) {
            if (!pl) return;
            library.getPlaylistTracks(playlistId).then(function(tracks) {
                var html = '<div class="modal-header"><h3 class="modal-title">' + self.esc(pl.name) + '</h3><span class="modal-close">X</span></div>';
                html += '<p class="text-muted text-sm mb-4">' + pl.tracks.length + ' tracks</p>';
                html += '<div class="track-list">';
                for (var i = 0; i < tracks.length; i++) { html += self.renderTrackRow(tracks[i], i); }
                html += '</div>';
                html += '<div class="mt-4"><button class="btn btn-secondary btn-sm" id="playAllBtn">Play all</button> <button class="btn btn-danger btn-sm" id="deletePlaylistBtn">Delete</button></div>';
                
                content.innerHTML = html;
                overlay.classList.remove('hidden');
                
                var closeModal = function() { overlay.classList.add('hidden'); };
                content.querySelector('.modal-close').addEventListener('click', closeModal);
                overlay.addEventListener('click', function(e) { if (e.target === overlay) closeModal(); });
                
                self.bindTrackRowClicks(content);
                
                document.getElementById('playAllBtn').addEventListener('click', function() {
                    if (tracks.length > 0) {
                        queueManager.clear();
                        for (var j = 0; j < tracks.length; j++) { queueManager.add(tracks[j]); }
                        player.play(tracks[0]);
                        closeModal();
                    }
                });
                
                document.getElementById('deletePlaylistBtn').addEventListener('click', function() {
                    library.deletePlaylist(playlistId).then(function() {
                        self.showNotification('Deleted', 'success');
                        closeModal();
                        self.navigateTo('playlists');
                    });
                });
            });
        });
    };

    UIManager.prototype.showConfirm = function(title, message, onConfirm) {
        var overlay = document.getElementById('modal-overlay');
        var content = document.getElementById('modal-content');
        
        content.innerHTML = '<div class="modal-header"><h3 class="modal-title">' + title + '</h3><span class="modal-close">X</span></div><p class="mb-4">' + message + '</p><div style="display:flex;gap:8px;"><button class="btn btn-secondary" id="cancelBtn">Cancel</button><button class="btn btn-danger" id="confirmBtn">Confirm</button></div>';
        overlay.classList.remove('hidden');
        
        var closeModal = function() { overlay.classList.add('hidden'); };
        content.querySelector('.modal-close').addEventListener('click', closeModal);
        overlay.addEventListener('click', function(e) { if (e.target === overlay) closeModal(); });
        document.getElementById('cancelBtn').addEventListener('click', closeModal);
        document.getElementById('confirmBtn').addEventListener('click', function() { closeModal(); onConfirm(); });
    };

    UIManager.prototype.showAddToPlaylistModal = function(trackId) {
        var self = this;
        var overlay = document.getElementById('modal-overlay');
        var content = document.getElementById('modal-content');
        
        library.getPlaylists().then(function(playlists) {
            var html = '<div class="modal-header"><h3 class="modal-title">Add to playlist</h3><span class="modal-close">X</span></div>';
            if (playlists.length === 0) { html += '<p class="text-muted">No playlists</p>'; }
            else { for (var i = 0; i < playlists.length; i++) { html += '<div class="playlist-option" data-id="' + playlists[i].id + '">' + self.esc(playlists[i].name) + ' (' + playlists[i].tracks.length + ')</div>'; } }
            html += '<button class="btn btn-secondary btn-sm mt-4" id="createNewBtn">New playlist</button>';
            
            content.innerHTML = html;
            overlay.classList.remove('hidden');
            
            var closeModal = function() { overlay.classList.add('hidden'); };
            content.querySelector('.modal-close').addEventListener('click', closeModal);
            overlay.addEventListener('click', function(e) { if (e.target === overlay) closeModal(); });
            
            content.querySelectorAll('.playlist-option').forEach(function(opt) {
                opt.addEventListener('click', function() {
                    library.addToPlaylist(opt.getAttribute('data-id'), trackId).then(function() { self.showNotification('Added', 'success'); closeModal(); });
                });
            });
            
            document.getElementById('createNewBtn').addEventListener('click', function() { closeModal(); self.showCreatePlaylistModal(); });
        });
    };

    UIManager.prototype.loadSidebarStats = function() {
        var self = this;
        library.getStats().then(function(stats) {
            var el = document.getElementById('sidebarStats');
            if (!el) return;
            el.innerHTML = '' +
                '<div class="sidebar-stat"><span class="stat-value">' + stats.totalTracks + '</span><span class="stat-label">tracks</span></div>' +
                '<div class="sidebar-stat"><span class="stat-value">' + stats.totalPlaylists + '</span><span class="stat-label">playlists</span></div>' +
                '<div class="sidebar-stat"><span class="stat-value">' + self.formatSize(stats.storageUsage) + '</span><span class="stat-label">used</span></div>';
        }).catch(function(){});
    };

    UIManager.prototype.formatSize = function(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        var units = ['B', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(1024));
        if (i >= units.length) i = units.length - 1;
        return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
    };

    UIManager.prototype.checkSpotifyCallback = function() {
        if (services.checkSpotifyCallback()) {
            this.showNotification('Spotify connected', 'success');
            this.loadSidebarStats();
        }
    };

    UIManager.prototype.bindPlayerEvents = function() {
        var self = this;
        document.getElementById('playBtn').addEventListener('click', function() { player.togglePlay(); });
        document.getElementById('prevBtn').addEventListener('click', function() { var p = queueManager.getPrevious(); if (p) player.play(p); });
        document.getElementById('nextBtn').addEventListener('click', function() { var n = queueManager.getNext(); if (n) player.play(n); });
        document.getElementById('shuffleBtn').addEventListener('click', function() { queueManager.toggleShuffle(); });
        document.getElementById('repeatBtn').addEventListener('click', function() { queueManager.toggleRepeat(); });
        document.getElementById('volumeSlider').addEventListener('input', function(e) { player.setVolume(e.target.value / 100); });
        document.getElementById('progressBar').addEventListener('click', function(e) {
            var rect = this.getBoundingClientRect();
            var ratio = (e.clientX - rect.left) / rect.width;
            var d = player.getDuration();
            if (d) player.seek(ratio * d);
        });
        document.getElementById('playerAddToPlaylistBtn').addEventListener('click', function() {
            var t = player.currentTrack;
            if (t) self.showAddToPlaylistModal(t.id);
        });
    };

    UIManager.prototype.updatePlayerUI = function() {
        var track = player.currentTrack;
        document.getElementById('playerTitle').textContent = track ? track.title : 'Nothing playing';
        document.getElementById('playerArtist').textContent = track ? track.artist : 'Select a track';
        var icon = document.getElementById('playIcon');
        if (icon) { icon.innerHTML = player.isPlaying ? '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>' : '<polygon points="5 3 19 12 5 21 5 3"/>'; }
    };

    UIManager.prototype.updateProgress = function(data) {
        document.getElementById('currentTime').textContent = player.formatTime(data.currentTime);
        document.getElementById('totalTime').textContent = player.formatTime(data.duration);
        document.getElementById('progressFill').style.width = (data.progress * 100) + '%';
    };

    UIManager.prototype.exportLibrary = function() {
        var self = this;
        library.exportLibrary().then(function(data) {
            var blob = new Blob([data], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url; a.download = 'musichub-' + new Date().toISOString().split('T')[0] + '.json';
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            URL.revokeObjectURL(url);
            self.showNotification('Exported successfully', 'success');
        }).catch(function() { self.showNotification('Export failed', 'error'); });
    };

    UIManager.prototype.showNotification = function(message, type) {
        var container = document.getElementById('notificationContainer');
        if (!container) return;
        var el = document.createElement('div');
        el.className = 'notification ' + (type || 'info');
        el.textContent = message;
        container.appendChild(el);
        setTimeout(function() { el.style.opacity = '0'; el.style.transform = 'translateX(100%)'; el.style.transition = 'all 0.3s ease'; setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 300); }, 3000);
    };

    UIManager.prototype.esc = function(str) {
        if (!str) return '';
        var div = document.createElement('div');
        if (div.textContent !== undefined) div.textContent = str; else div.innerText = str;
        return div.innerHTML;
    };

    window.ui = new UIManager();
})();
