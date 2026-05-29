(function() {
    'use strict';
    
    function UIManager() { 
        this.page = 'home'; 
        this.tab = 'tracks'; 
        this.st = null;
        this._initialized = false;
        this.volumeBeforeMute = 70;
    }
    
    // ========================================
    // SKELETON LOADERS
    // ========================================
    
    UIManager.prototype.showSkeleton = function(container, type) {
        if (!container) return;
        if (type === 'tracks') {
            container.innerHTML = '<div class="track-list">' + 
                Array(8).fill().map(function() { return `
                    <div class="track-row">
                        <div class="skeleton" style="width:30px;height:14px;margin:0 auto;"></div>
                        <div style="display:flex;gap:12px;">
                            <div class="skeleton" style="width:40px;height:40px;border-radius:8px;"></div>
                            <div><div class="skeleton skeleton-text" style="width:150px;"></div><div class="skeleton skeleton-text" style="width:100px;margin-top:4px;"></div></div>
                        </div>
                        <div class="skeleton skeleton-text" style="width:60px;"></div>
                        <div class="skeleton skeleton-text" style="width:40px;"></div>
                        <div class="skeleton skeleton-text" style="width:24px;"></div>
                    </div>
                `; }).join('') + '</div>';
        } else if (type === 'artists') {
            container.innerHTML = '<div class="artist-grid">' + 
                Array(6).fill().map(function() { return `
                    <div class="artist-card">
                        <div class="skeleton" style="width:72px;height:72px;border-radius:50%;margin:0 auto 10px;"></div>
                        <div class="skeleton skeleton-text" style="width:100px;margin:0 auto 4px;"></div>
                        <div class="skeleton skeleton-text" style="width:60px;margin:0 auto;"></div>
                    </div>
                `; }).join('') + '</div>';
        } else if (type === 'albums') {
            container.innerHTML = '<div class="album-grid">' + 
                Array(6).fill().map(function() { return `
                    <div class="album-card">
                        <div class="skeleton skeleton-cover" style="width:100%;aspect-ratio:1;"></div>
                        <div class="skeleton skeleton-text" style="width:80%;margin-top:8px;"></div>
                        <div class="skeleton skeleton-text" style="width:60%;margin-top:4px;"></div>
                    </div>
                `; }).join('') + '</div>';
        }
    };
    
    // ========================================
    // RENDER SIDEBAR
    // ========================================
    
    UIManager.prototype.renderSidebar = function() {
        var n = document.getElementById('sidebarNav');
        if (!n) return;
        
        var items = [
            {p:'home', svg:'<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>', l:'Home'},
            {p:'library', svg:'<path d="M4 6h16v12H4z"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/>', l:'Library'},
            {p:'search', svg:'<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>', l:'Search'},
            {p:'upload', svg:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>', l:'Upload'},
            {p:'import', svg:'<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>', l:'Import'},
            {p:'playlists', svg:'<path d="M2 4h20v16H2z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="12" y2="12"/>', l:'Playlists'}
        ];
        
        var h = '';
        for (var i = 0; i < items.length; i++) {
            var activeClass = (items[i].p === this.page) ? ' active' : '';
            h += '<a class="nav-item' + activeClass + '" data-page="' + items[i].p + '">';
            h += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">' + items[i].svg + '</svg>';
            h += items[i].l + '</a>';
        }
        n.innerHTML = h;
        
        var footerNav = document.querySelector('.sidebar-footer .nav-item');
        if (footerNav) {
            if (this.page === 'settings') footerNav.classList.add('active');
            else footerNav.classList.remove('active');
        }
    };
    
    // ========================================
    // BIND SIDEBAR
    // ========================================
    
    UIManager.prototype.bindSidebar = function() {
        var s = this;
        var n = document.getElementById('sidebarNav');
        if (!n) return;
        
        n.addEventListener('click', function(e) {
            var el = e.target.closest ? e.target.closest('.nav-item') : null;
            if (el) {
                e.preventDefault();
                s.go(el.getAttribute('data-page'));
            }
        });
    };
    
    // ========================================
    // BIND TOPBAR
    // ========================================
    
    UIManager.prototype.bindTopbar = function() {
        var s = this;
        var exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', function() { s.exportLib(); });
        }
        
        var si = document.getElementById('globalSearch');
        if (si) {
            si.addEventListener('input', function() {
                var q = si.value.trim();
                if (s.st) clearTimeout(s.st);
                if (q.length >= 2) {
                    s.st = setTimeout(function() { s.doSearch(q); }, 350);
                }
            });
        }
    };
    
    // ========================================
    // BIND KEYS
    // ========================================
    
    UIManager.prototype.bindKeys = function() {
        var s = this;
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                var i = document.getElementById('globalSearch');
                if (i) {
                    i.focus();
                    i.classList.add('pulse');
                    setTimeout(function() { i.classList.remove('pulse'); }, 300);
                }
            }
            if (e.code === 'Space' && document.activeElement === document.body) {
                e.preventDefault();
                if (window.player) player.toggle();
            }
            if (e.key === 'Escape') {
                var o = document.getElementById('modal-overlay');
                if (o && !o.classList.contains('hidden')) o.classList.add('hidden');
            }
            if (e.code === 'MediaPlayPause') {
                e.preventDefault();
                if (window.player) player.toggle();
            }
            if (e.code === 'MediaNextTrack') {
                e.preventDefault();
                if (window.queueManager) {
                    var n = queueManager.next();
                    if (n && window.player) player.play(n);
                    s.animateNowPlaying();
                }
            }
            if (e.code === 'MediaPrevTrack') {
                e.preventDefault();
                if (window.queueManager) {
                    var p = queueManager.prev();
                    if (p && window.player) player.play(p);
                    s.animateNowPlaying();
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowUp') {
                e.preventDefault();
                var vol = document.getElementById('volumeSlider');
                if (vol) {
                    var newVol = Math.min(100, parseInt(vol.value) + 10);
                    vol.value = newVol;
                    if (window.player) player.setVolume(newVol / 100);
                    s.showVolumeToast(newVol);
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowDown') {
                e.preventDefault();
                var vol = document.getElementById('volumeSlider');
                if (vol) {
                    var newVol = Math.max(0, parseInt(vol.value) - 10);
                    vol.value = newVol;
                    if (window.player) player.setVolume(newVol / 100);
                    s.showVolumeToast(newVol);
                }
            }
        });
    };
    
    UIManager.prototype.showVolumeToast = function(volume) {
        var toast = document.createElement('div');
        toast.className = 'volume-toast';
        var icon = volume === 0 ? '🔇' : (volume < 30 ? '🔈' : (volume < 70 ? '🔉' : '🔊'));
        toast.innerHTML = '<div class="volume-toast-icon">' + icon + '</div><div class="volume-toast-value">' + volume + '%</div><div class="volume-toast-bar"><div class="volume-toast-fill" style="width:' + volume + '%"></div></div>';
        document.body.appendChild(toast);
        setTimeout(function() { toast.classList.add('show'); }, 10);
        setTimeout(function() { 
            toast.classList.remove('show');
            setTimeout(function() { toast.remove(); }, 300);
        }, 1500);
    };
    
    UIManager.prototype.animateNowPlaying = function() {
        var nowPlaying = document.querySelector('.player-title');
        if (nowPlaying) {
            nowPlaying.classList.add('pulse');
            setTimeout(function() { nowPlaying.classList.remove('pulse'); }, 500);
        }
        var cover = document.querySelector('.player-cover');
        if (cover) {
            cover.classList.add('playing');
            setTimeout(function() { cover.classList.remove('playing'); }, 500);
        }
    };
    
    // ========================================
    // UPDATE SIDEBAR SERVICES
    // ========================================
    
    UIManager.prototype.updateSidebarServices = function() {
        var container = document.getElementById('sidebarServices');
        if (!container) return;
        
        if (window.services) {
            var svcs = services.getAll();
            if (svcs && svcs.length) {
                var html = '';
                for (var i = 0; i < svcs.length; i++) {
                    var statusClass = svcs[i].connected ? 'connected' : '';
                    html += '<div class="service-item ' + statusClass + '">' + 
                            '<span>' + svcs[i].name + '</span>' +
                            '<span class="service-status"></span>' +
                            '</div>';
                }
                container.innerHTML = html;
                return;
            }
        }
        container.innerHTML = '<span class="text-muted text-sm">No services</span>';
    };
    
    // ========================================
    // INIT
    // ========================================
    
    UIManager.prototype.init = function() {
        var s = this;
        
        if (this._initialized) return Promise.resolve();
        this._initialized = true;
        
        var loader = document.getElementById('loader');
        var app = document.getElementById('app');
        if (loader && app) {
            setTimeout(function() {
                loader.classList.add('hidden');
                app.classList.remove('hidden');
            }, 500);
        }
        
        this.renderSidebar();
        this.bindSidebar();
        this.bindTopbar();
        this.bindPlayer();
        this.bindKeys();
        this.updateSidebarServices();
        this.checkSpotify();
        this.initWaveform();
        this.initAdvancedVisualizer();
        
        var p = storage.get('current_page', 'home');
        
        if (window.favorites) {
            window.favorites.on('change', function() { s.loadStats(); });
        }
        if (window.radioManager) {
            radioManager.loadStations();
        }
        
        var savedTheme = localStorage.getItem('musichub_theme');
        if (savedTheme === 'light') document.body.classList.add('light-theme');
        
        setInterval(function() { s.updateSidebarServices(); }, 5000);
        
        return this.go(p).then(function() { s.loadStats(); });
    };
    
    UIManager.prototype.initWaveform = function() {
        var waveformBg = document.createElement('div');
        waveformBg.className = 'waveform-bg';
        document.body.appendChild(waveformBg);
    };
    
    UIManager.prototype.initAdvancedVisualizer = function() {
        var canvas = document.createElement('canvas');
        canvas.id = 'advancedVisualizer';
        document.body.appendChild(canvas);
        
        var ctx = canvas.getContext('2d');
        var width, height;
        var bars = 128;
        var barWidth;
        
        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = 60;
            barWidth = width / bars;
        }
        
        window.addEventListener('resize', resize);
        resize();
        
        function drawVisualizer() {
            if (!window.player || !player.playing) {
                ctx.clearRect(0, 0, width, height);
                requestAnimationFrame(drawVisualizer);
                return;
            }
            
            ctx.clearRect(0, 0, width, height);
            
            for (var i = 0; i < bars; i++) {
                var heightRand = Math.random() * height * 0.8;
                var x = i * barWidth;
                var y = height - heightRand;
                
                var gradient = ctx.createLinearGradient(x, y, x, height);
                gradient.addColorStop(0, '#1db954');
                gradient.addColorStop(1, '#1ed760');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(x, y, barWidth - 1, heightRand);
                
                ctx.shadowBlur = 5;
                ctx.shadowColor = '#1db954';
            }
            
            requestAnimationFrame(drawVisualizer);
        }
        
        drawVisualizer();
    };
    
    // ========================================
    // GO TO PAGE
    // ========================================
    
    UIManager.prototype.go = function(p) {
        this.page = p;
        storage.set('current_page', p);
        this.renderSidebar();
        this.bindSidebar();
        
        var c = document.getElementById('content');
        if (!c) return Promise.resolve();
        
        c.style.opacity = '0';
        c.style.transform = 'translateY(20px)';
        
        setTimeout(function() {
            c.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><span>Loading...</span></div>';
            c.style.opacity = '1';
            c.style.transform = 'translateY(0)';
        }, 200);
        
        var s = this;
        var pr;
        
        switch(p) {
            case 'home': pr = this.homePage(); break;
            case 'library': pr = this.libPage(); break;
            case 'search': pr = this.searchPage(); break;
            case 'upload': pr = this.uploadPage(); break;
            case 'import': pr = this.importPage(); break;
            case 'playlists': pr = this.plPage(); break;
            case 'settings': pr = this.setPage(); break;
            default: pr = Promise.resolve(); break;
        }
        
        return pr.catch(function(e) {
            console.error('Page error:', e);
            c.innerHTML = '<div class="empty-state"><p>Error</p><span>' + (e.message || 'Unknown error') + '</span></div>';
        });
    };
    
    // ========================================
    // HOME PAGE
    // ========================================
    
    UIManager.prototype.homePage = function() {
        var s = this;
        var c = document.getElementById('content');
        
        c.innerHTML = '<div class="page"><div class="page-header"><h1 class="page-title">Welcome back!</h1><p class="page-subtitle">Your personal music hub</p></div><div class="quick-actions">' + 
            ['upload','import','library','search'].map(function(a) {
                var icons = {
                    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
                    import: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
                    library: '<path d="M4 6h16v12H4z"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/>',
                    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>'
                };
                var labels = { upload: 'Upload', import: 'Import', library: 'Library', search: 'Search' };
                return '<div class="action-card" data-action="' + a + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">' + icons[a] + '</svg><span>' + labels[a] + '</span></div>';
            }).join('') + 
            '</div><div class="section"><div class="section-header"><h2 class="section-title">🎵 Recently Added</h2></div><div id="recentTracksContainer"></div></div><div class="section"><div class="section-header"><h2 class="section-title">📁 Your Playlists</h2></div><div id="homePlaylistsContainer"></div></div><div class="section"><div class="section-header"><h2 class="section-title">📻 Recommended Radio</h2></div><div id="radioContainer"></div></div></div>';
        
        c.querySelectorAll('.action-card').forEach(function(card) {
            card.addEventListener('click', function() { s.go(card.getAttribute('data-action')); });
        });
        
        var rd = document.getElementById('recentTracksContainer');
        if (rd && window.library) {
            s.showSkeleton(rd, 'tracks');
            library.getRecentTracks(8).then(function(t) {
                if (!t || t.length === 0) {
                    rd.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg><p>No tracks yet</p><span>Upload some music to get started</span><button class="btn btn-primary mt-4" onclick="ui.go(\'upload\')">Upload now</button></div>';
                } else {
                    var h = '<div class="track-list">';
                    for (var i = 0; i < t.length; i++) h += s.trackRow(t[i], i);
                    h += '</div>';
                    rd.innerHTML = h;
                    s.bindRows(rd);
                }
            }).catch(function() { rd.innerHTML = '<div class="empty-state"><p>Error loading tracks</p></div>'; });
        }
        
        var pd = document.getElementById('homePlaylistsContainer');
        if (pd && window.library) {
            library.getPlaylists().then(function(pl) {
                if (!pl || pl.length === 0) {
                    pd.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h20v16H2z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="12" y2="12"/></svg><p>No playlists</p><span>Create your first playlist</span><button class="btn btn-primary mt-4" onclick="ui.showCreatePl()">Create playlist</button></div>';
                } else {
                    var h = '<div class="playlist-grid">';
                    for (var i = 0; i < Math.min(pl.length, 6); i++) h += s.plCard(pl[i]);
                    h += '</div>';
                    pd.innerHTML = h;
                    pd.querySelectorAll('.playlist-card').forEach(function(card) {
                        card.addEventListener('click', function() { s.showPlModal(card.getAttribute('data-playlist-id')); });
                    });
                }
            }).catch(function() { pd.innerHTML = '<div class="empty-state"><p>Error loading playlists</p></div>'; });
        }
        
        var radioDiv = document.getElementById('radioContainer');
        if (radioDiv) {
            radioDiv.innerHTML = '<div class="radio-stations">' + 
                '<div class="radio-card" data-station="rock">🎸 Rock Radio</div>' +
                '<div class="radio-card" data-station="jazz">🎷 Jazz Radio</div>' +
                '<div class="radio-card" data-station="electronic">⚡ Electronic Radio</div>' +
                '<div class="radio-card" data-station="classical">🎻 Classical Radio</div>' +
                '</div>';
            
            radioDiv.querySelectorAll('.radio-card').forEach(function(card) {
                card.addEventListener('click', function() {
                    var station = card.getAttribute('data-station');
                    s.notify('🎵 ' + station.charAt(0).toUpperCase() + station.slice(1) + ' radio started', 'success');
                });
            });
        }
        
        return Promise.resolve();
    };
    
    // ========================================
    // LIBRARY PAGE (сокращён для длины)
    // ========================================
    
    UIManager.prototype.libPage = function() {
        var s = this;
        var c = document.getElementById('content');
        
        c.innerHTML = '<div class="page"><div class="page-header"><h1 class="page-title">Library</h1><p class="page-subtitle">Your music collection</p><div class="library-actions"><button class="btn btn-secondary btn-sm" id="findDupBtn">🔍 Find duplicates</button><button class="btn btn-danger btn-sm" id="remDupBtn">🗑️ Remove duplicates</button></div></div><div class="tabs" id="libTabs"><button class="tab active" data-tab="tracks">🎵 Tracks</button><button class="tab" data-tab="artists">🎤 Artists</button><button class="tab" data-tab="albums">💿 Albums</button><button class="tab" data-tab="favorites">❤️ Favorites</button></div><div class="library-filters"><select id="sourceFilter" class="form-input" style="width:auto;"><option value="all">All sources</option><option value="local">📁 Local</option><option value="spotify">🎧 Spotify</option><option value="youtube">📺 YouTube</option></select><select id="sortFilter" class="form-input" style="width:auto;"><option value="dateAdded">📅 By date</option><option value="title">🔤 By title</option><option value="artist">👤 By artist</option><option value="playCount">🔥 By popularity</option></select></div><div id="libraryContent"></div></div>';
        
        document.getElementById('libTabs').addEventListener('click', function(e) {
            var el = e.target.closest ? e.target.closest('.tab') : null;
            if (!el) return;
            document.querySelectorAll('#libTabs .tab').forEach(function(t) { t.classList.remove('active'); });
            el.classList.add('active');
            s.tab = el.getAttribute('data-tab');
            s.loadLib();
        });
        
        var sourceFilter = document.getElementById('sourceFilter');
        var sortFilter = document.getElementById('sortFilter');
        if (sourceFilter) sourceFilter.addEventListener('change', function() { s.loadLib(); });
        if (sortFilter) sortFilter.addEventListener('change', function() { s.loadLib(); });
        
        var findBtn = document.getElementById('findDupBtn');
        var remBtn = document.getElementById('remDupBtn');
        if (findBtn && window.library) {
            findBtn.addEventListener('click', function() {
                library.getDuplicates().then(function(d) { s.notify(d.length ? '🔍 Found ' + d.length + ' duplicates' : '✨ No duplicates found', 'info'); });
            });
        }
        if (remBtn && window.library) {
            remBtn.addEventListener('click', function() {
                s.confirm('Remove duplicates?', 'This will remove duplicate tracks from your library.', function() {
                    library.removeDuplicates().then(function(r) { s.notify('🗑️ Removed ' + r.length + ' duplicates', 'success'); s.loadLib(); s.loadStats(); });
                });
            });
        }
        
        return this.loadLib();
    };
    
    UIManager.prototype.loadLib = function() {
        var s = this;
        var ct = document.getElementById('libraryContent');
        if (!ct) return Promise.resolve();
        
        if (this.tab === 'tracks') s.showSkeleton(ct, 'tracks');
        else if (this.tab === 'artists') s.showSkeleton(ct, 'artists');
        else if (this.tab === 'albums') s.showSkeleton(ct, 'albums');
        else ct.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><span>Loading...</span></div>';
        
        var src = document.getElementById('sourceFilter') ? document.getElementById('sourceFilter').value : 'all';
        var srt = document.getElementById('sortFilter') ? document.getElementById('sortFilter').value : 'dateAdded';
        var pr;
        
        if (this.tab === 'tracks') {
            if (!window.library) return Promise.resolve();
            pr = library.getTracks({source: src, sort: srt}).then(function(t) {
                if (!t || t.length === 0) {
                    ct.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg><p>No tracks found</p><span>Upload or import music to get started</span><button class="btn btn-primary mt-4" onclick="ui.go(\'upload\')">Upload now</button></div>';
                    return;
                }
                var h = '<div class="track-list">';
                for (var i = 0; i < t.length; i++) h += s.trackRow(t[i], i);
                h += '</div>';
                ct.innerHTML = h;
                s.bindRows(ct);
            });
        } else if (this.tab === 'artists') {
            if (!window.library) return Promise.resolve();
            pr = library.getArtists().then(function(a) {
                if (!a || a.length === 0) {
                    ct.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><p>No artists yet</p></div>';
                    return;
                }
                var h = '<div class="artist-grid">';
                for (var i = 0; i < a.length; i++) {
                    h += '<div class="artist-card" data-artist="' + s.esc(a[i].name) + '"><div class="artist-card-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="36"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div><div class="artist-card-name">' + s.esc(a[i].name) + '</div><div class="artist-card-info">' + a[i].trackCount + ' tracks</div></div>';
                }
                h += '</div>';
                ct.innerHTML = h;
                ct.querySelectorAll('.artist-card').forEach(function(card) {
                    card.addEventListener('click', function() {
                        var artist = card.getAttribute('data-artist');
                        s.go('search');
                        var searchInput = document.getElementById('globalSearch');
                        if (searchInput) {
                            searchInput.value = artist;
                            s.doSearch(artist);
                        }
                    });
                });
            });
        } else if (this.tab === 'albums') {
            if (!window.library) return Promise.resolve();
            pr = library.getAlbums().then(function(a) {
                if (!a || a.length === 0) {
                    ct.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg><p>No albums yet</p></div>';
                    return;
                }
                var h = '<div class="album-grid">';
                for (var i = 0; i < a.length; i++) {
                    h += '<div class="album-card" data-album="' + s.esc(a[i].name) + '"><div class="album-card-cover"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="36"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg></div><div class="album-card-name">' + s.esc(a[i].name) + '</div><div class="album-card-artist">' + s.esc(a[i].artist) + '</div></div>';
                }
                h += '</div>';
                ct.innerHTML = h;
            });
        } else if (this.tab === 'favorites') {
            if (window.favorites) {
                pr = window.favorites.getTracks().then(function(t) {
                    if (!t || t.length === 0) {
                        ct.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg><p>No favorites yet</p><span>❤️ Like tracks to see them here</span></div>';
                        return;
                    }
                    var h = '<div class="track-list">';
                    for (var i = 0; i < t.length; i++) h += s.trackRow(t[i], i);
                    h += '</div>';
                    ct.innerHTML = h;
                    s.bindRows(ct);
                });
            } else {
                pr = Promise.resolve();
            }
        }
        
        return pr ? pr.catch(function() { ct.innerHTML = '<div class="empty-state"><p>Error loading content</p></div>'; }) : Promise.resolve();
    };
    
    // ========================================
    // SEARCH PAGE
    // ========================================
    
    UIManager.prototype.searchPage = function() {
        document.getElementById('content').innerHTML = '<div class="page"><div class="page-header"><h1 class="page-title">🔍 Search</h1><p class="page-subtitle">Find music in your library</p></div><div id="searchResults"><div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><p>Start typing to search</p><span>Press Ctrl+K to focus search bar</span></div></div></div>';
        return Promise.resolve();
    };
    
    UIManager.prototype.doSearch = function(q) {
        var s = this;
        if (this.page !== 'search') {
            this.go('search').then(function() { s.doSearch(q); });
            return;
        }
        
        var c = document.getElementById('searchResults');
        if (!c) return;
        c.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><span>Searching for "' + s.esc(q) + '"...</span></div>';
        
        if (!window.library) return;
        library.search(q).then(function(r) {
            if (!r || r.length === 0) {
                c.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><p>No results found</p><span>Try a different search term</span></div>';
                return;
            }
            var h = '<div class="track-list"><div class="search-stats" style="padding:10px;color:var(--text-secondary);">Found ' + r.length + ' tracks</div>';
            for (var i = 0; i < r.length; i++) h += s.trackRow(r[i], i);
            h += '</div>';
            c.innerHTML = h;
            s.bindRows(c);
        }).catch(function() { c.innerHTML = '<div class="empty-state"><p>Search error</p></div>'; });
    };
    
    // ========================================
    // UPLOAD PAGE
    // ========================================
    
    UIManager.prototype.uploadPage = function() {
        var s = this;
        var c = document.getElementById('content');
        
        c.innerHTML = '<div class="page"><div class="page-header"><h1 class="page-title">📤 Upload Music</h1><p class="page-subtitle">Support: MP3, WAV, FLAC, OGG, AAC, M4A</p></div><div class="upload-area" id="uploadArea"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><p>Drag & drop files here</p><span>or</span><button class="btn btn-primary" id="selectFilesBtn">📁 Select files</button></div><input type="file" id="fileInput" multiple accept=".mp3,.wav,.flac,.ogg,.aac,.m4a" hidden><div id="uploadProgress" class="hidden mt-4"></div><div class="upload-tips mt-4"><small class="text-muted">💡 Tip: You can select multiple files at once</small></div></div>';
        
        var a = document.getElementById('uploadArea');
        var inp = document.getElementById('fileInput');
        var pr = document.getElementById('uploadProgress');
        
        var selectBtn = document.getElementById('selectFilesBtn');
        if (selectBtn) selectBtn.addEventListener('click', function() { inp.click(); });
        
        if (a) {
            a.addEventListener('dragover', function(e) { e.preventDefault(); a.classList.add('dragover'); });
            a.addEventListener('dragleave', function() { a.classList.remove('dragover'); });
            a.addEventListener('drop', function(e) {
                e.preventDefault();
                a.classList.remove('dragover');
                if (e.dataTransfer.files.length && window.uploadManager) s.doUp(e.dataTransfer.files, a, pr);
            });
        }
        
        if (inp) {
            inp.addEventListener('change', function() { if (inp.files.length && window.uploadManager) s.doUp(inp.files, a, pr); });
        }
        
        return Promise.resolve();
    };
    
    UIManager.prototype.doUp = function(f, a, pr) {
        var s = this;
        if (a) a.classList.add('hidden');
        if (pr) {
            pr.classList.remove('hidden');
            pr.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><span>Uploading ' + f.length + ' files...</span></div>';
        }
        
        if (!window.uploadManager) return;
        uploadManager.uploadFiles(f).then(function(r) {
            if (pr) {
                pr.innerHTML = '<div class="empty-state"><p>✅ Uploaded: ' + r.uploaded.length + '</p>' + (r.failed.length ? '<span>⚠️ Failed: ' + r.failed.length + '</span>' : '') + '</div>';
            }
            s.notify('✅ ' + r.uploaded.length + ' files uploaded successfully', 'success');
            s.loadStats();
            setTimeout(function() { 
                if (a) a.classList.remove('hidden'); 
                if (pr) pr.classList.add('hidden'); 
                s.go('library');
            }, 2000);
        }).catch(function(e) { 
            if (pr) pr.innerHTML = '<div class="empty-state"><p>❌ Upload error</p><span>' + e.message + '</span></div>'; 
            s.notify('Upload failed', 'error'); 
        });
    };
    
    // ========================================
    // IMPORT PAGE
    // ========================================
    
    UIManager.prototype.importPage = function() {
        var s = this;
        var c = document.getElementById('content');
        
        c.innerHTML = '<div class="page"><div class="page-header"><h1 class="page-title">📥 Import Music</h1><p class="page-subtitle">Import from other services</p></div><div class="settings-section"><h2 class="settings-section-title">🔌 Connected Services</h2><div class="services-grid" id="importServicesGrid" style="display:grid;gap:16px;"></div></div><div class="settings-section"><h2 class="settings-section-title">📄 File Import</h2><div class="import-options" style="display:flex;gap:12px;flex-wrap:wrap;"><div class="import-option-card" id="importJSON" style="background:var(--bg-card);padding:20px;border-radius:12px;cursor:pointer;text-align:center;">📋 JSON Format</div><div class="import-option-card" id="importCSV" style="background:var(--bg-card);padding:20px;border-radius:12px;cursor:pointer;text-align:center;">📊 CSV Format</div></div><input type="file" id="importFileInput" accept=".json,.csv" hidden></div></div>';
        
        var servicesGrid = document.getElementById('importServicesGrid');
        if (servicesGrid && window.services) {
            var svcs = services.getAll();
            var html = '';
            for (var i = 0; i < svcs.length; i++) {
                html += '<div class="service-card" style="background:var(--bg-card);padding:16px;border-radius:12px;display:flex;justify-content:space-between;align-items:center;"><div><div class="service-card-name" style="font-weight:500;">' + svcs[i].name + '</div></div><button class="btn btn-primary btn-sm connect-service" data-service="' + svcs[i].id + '">Connect</button></div>';
            }
            servicesGrid.innerHTML = html;
            
            servicesGrid.querySelectorAll('.connect-service').forEach(function(btn) {
                btn.addEventListener('click', function() { s.showConn(btn.getAttribute('data-service')); });
            });
        }
        
        var inp = document.getElementById('importFileInput');
        document.getElementById('importJSON').addEventListener('click', function() {
            inp.accept = '.json';
            inp.onchange = function(e) {
                if (e.target.files[0] && window.importer) {
                    importer.importFromJSON(e.target.files[0]).then(function(r) { s.notify('Imported ' + r.importedCount + ' tracks', 'success'); s.loadStats(); s.go('library'); }).catch(function() { s.notify('Import failed', 'error'); });
                }
            };
            inp.click();
        });
        
        document.getElementById('importCSV').addEventListener('click', function() {
            inp.accept = '.csv';
            inp.onchange = function(e) {
                if (e.target.files[0] && window.importer) {
                    importer.importFromCSV(e.target.files[0]).then(function(r) { s.notify('Imported ' + r.importedCount + ' tracks', 'success'); s.loadStats(); s.go('library'); }).catch(function() { s.notify('Import failed', 'error'); });
                }
            };
            inp.click();
        });
        
        return Promise.resolve();
    };
    
    // ========================================
    // PLAYLISTS PAGE
    // ========================================
    
    UIManager.prototype.plPage = function() {
        var s = this;
        var c = document.getElementById('content');
        
        if (!window.library) return Promise.resolve();
        
        return library.getPlaylists().then(function(pl) {
            var h = '<div class="page"><div class="page-header"><h1 class="page-title">📋 Playlists</h1><p class="page-subtitle">Organize your music</p><button class="btn btn-primary" id="createPlBtn">+ Create New Playlist</button></div>';
            
            if (!pl || pl.length === 0) {
                h += '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h20v16H2z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="12" y2="12"/></svg><p>No playlists yet</p><span>Create your first playlist to organize your music</span><button class="btn btn-primary mt-4" onclick="ui.showCreatePl()">Create playlist</button></div>';
            } else {
                h += '<div class="playlist-grid">';
                for (var i = 0; i < pl.length; i++) h += s.plCard(pl[i]);
                h += '</div>';
            }
            h += '</div>';
            c.innerHTML = h;
            
            var createBtn = document.getElementById('createPlBtn');
            if (createBtn) createBtn.addEventListener('click', function() { s.showCreatePl(); });
            
            c.querySelectorAll('.playlist-card').forEach(function(card) {
                card.addEventListener('click', function() { s.showPlModal(card.getAttribute('data-playlist-id')); });
            });
        });
    };
    
    // ========================================
    // SETTINGS PAGE
    // ========================================
    
    UIManager.prototype.setPage = function() {
        var s = this;
        var c = document.getElementById('content');
        
        var h = '<div class="page"><div class="page-header"><h1 class="page-title">⚙️ Settings</h1><p class="page-subtitle">Customize your experience</p></div><div class="settings-section"><h2 class="settings-section-title">🎨 Appearance</h2><div class="data-actions"><button class="btn btn-secondary" id="themeToggleBtn">🌓 Switch Theme</button></div></div><div class="settings-section"><h2 class="settings-section-title">💾 Data Management</h2><div class="data-actions"><button class="btn btn-secondary" id="exportDataBtn">📤 Export Library (JSON)</button><button class="btn btn-danger" id="clearDataBtn">🗑️ Clear All Data</button></div></div><div class="settings-section"><h2 class="settings-section-title">ℹ️ About</h2><div class="data-actions"><p class="text-muted">MusicHub v2.0.0 - Your personal music platform</p><p class="text-muted">© 2026 MusicHub. All rights reserved.</p></div></div></div>';
        
        c.innerHTML = h;
        
        var themeBtn = document.getElementById('themeToggleBtn');
        if (themeBtn) {
            themeBtn.addEventListener('click', function() {
                document.body.classList.toggle('light-theme');
                localStorage.setItem('musichub_theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
                s.notify('Theme changed', 'success');
            });
        }
        
        var exportBtn = document.getElementById('exportDataBtn');
        if (exportBtn) exportBtn.addEventListener('click', function() { s.exportLib(); });
        
        var clearBtn = document.getElementById('clearDataBtn');
        if (clearBtn && window.db) {
            clearBtn.addEventListener('click', function() {
                s.confirm('Clear all data?', '⚠️ This will delete ALL tracks, playlists and settings. This action cannot be undone!', function() {
                    db.clearAll().then(function() {
                        storage.remove('play_history');
                        storage.remove('queue');
                        localStorage.clear();
                        s.notify('All data cleared', 'success');
                        s.loadStats();
                        s.go('home');
                    });
                });
            });
        }
        
        return Promise.resolve();
    };
    
    // ========================================
    // TRACK ROW & PLAYLIST CARD
    // ========================================
    
    UIManager.prototype.trackRow = function(t, i) {
        if (!t) return '';
        var d = (window.player && t.duration) ? player.fmt(t.duration / 1000) : '--:--';
        var src = t.source === 'local' ? '📁' : (t.source === 'spotify' ? '🎧' : (t.source === 'youtube' ? '📺' : '🎵'));
        var isFav = (window.favorites && window.favorites.isFavorite(t.id)) ? true : false;
        var favIcon = isFav ? '❤️' : '🤍';
        
        return '<div class="track-row" data-track=\'' + this.esc(JSON.stringify(t)) + '\'><span class="track-row-index">' + (i + 1) + '</span><div class="track-row-info"><div class="track-row-cover-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div><div class="track-row-text"><div class="track-row-title">' + this.esc(t.title) + '</div><div class="track-row-artist">' + this.esc(t.artist) + '</div></div></div><span class="track-row-source">' + src + '</span><span class="track-row-duration">' + d + '</span><span class="track-row-fav" style="cursor:pointer;text-align:center;">' + favIcon + '</span></div>';
    };
    
    UIManager.prototype.plCard = function(p) {
        if (!p) return '';
        var c = p.tracks ? p.tracks.length : 0;
        return '<div class="playlist-card" data-playlist-id="' + p.id + '"><div class="playlist-card-cover"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="36"><path d="M2 4h20v16H2z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="12" y2="12"/></svg></div><div class="playlist-card-name">' + this.esc(p.name) + '</div><div class="playlist-card-count">' + c + ' tracks</div></div>';
    };
    
    // ========================================
    // BIND ROWS
    // ========================================
    
    UIManager.prototype.bindRows = function(c) {
        if (!c) return;
        var s = this;
        var rows = c.querySelectorAll('.track-row');
        
        for (var i = 0; i < rows.length; i++) {
            (function(row) {
                row.addEventListener('click', function(e) {
                    if (e.target.classList && e.target.classList.contains('track-row-fav')) return;
                    try {
                        var t = JSON.parse(row.getAttribute('data-track'));
                        if (window.player) player.play(t);
                        if (window.queueManager) queueManager.add(t);
                        s.animateNowPlaying();
                        var equalizer = document.getElementById('equalizer');
                        if (equalizer) equalizer.style.display = 'flex';
                    } catch(e) {}
                });
                
                var favSpan = row.querySelector('.track-row-fav');
                if (favSpan) {
                    favSpan.addEventListener('click', function(e) {
                        e.stopPropagation();
                        try {
                            var t = JSON.parse(row.getAttribute('data-track'));
                            if (window.favorites) {
                                window.favorites.toggle(t);
                                var isFav = window.favorites.isFavorite(t.id);
                                favSpan.textContent = isFav ? '❤️' : '🤍';
                                s.notify(isFav ? '❤️ Added to favorites' : '🤍 Removed from favorites', 'success');
                                if (s.page === 'library' && s.tab === 'favorites') s.loadLib();
                            }
                        } catch(e) {}
                    });
                }
                
                row.addEventListener('contextmenu', function(e) {
                    e.preventDefault();
                    var trackData = row.getAttribute('data-track');
                    if (!trackData) return;
                    
                    try {
                        var track = JSON.parse(trackData);
                        var isFav = window.favorites ? window.favorites.isFavorite(track.id) : false;
                        var items = [
                            { label: '▶ Play now', action: function() { if (window.player) player.play(track); s.animateNowPlaying(); } },
                            { label: '📋 Add to queue', action: function() { if (window.queueManager) queueManager.add(track); s.notify('Added to queue', 'success'); } },
                            { label: isFav ? '❤️ Remove from favorites' : '🤍 Add to favorites', action: function() {
                                if (window.favorites) {
                                    window.favorites.toggle(track);
                                    var newIsFav = window.favorites.isFavorite(track.id);
                                    if (favSpan) favSpan.textContent = newIsFav ? '❤️' : '🤍';
                                    s.notify(newIsFav ? 'Added to favorites' : 'Removed from favorites', 'success');
                                    if (s.page === 'library' && s.tab === 'favorites') s.loadLib();
                                }
                            } },
                            { label: '📁 Add to playlist', action: function() { s.showAddPl(track.id); } },
                            { label: '🎵 Go to artist', action: function() {
                                s.go('search');
                                var searchInput = document.getElementById('globalSearch');
                                if (searchInput) {
                                    searchInput.value = track.artist;
                                    s.doSearch(track.artist);
                                }
                            } },
                            { label: '🗑️ Delete', action: function() {
                                s.confirm('Delete track', 'Delete "' + track.title + '"?', function() {
                                    if (window.db) {
                                        db.deleteTrack(track.id).then(function() {
                                            if (window.favorites) window.favorites.remove(track.id);
                                            s.loadLib();
                                            s.notify('Deleted', 'success');
                                        });
                                    }
                                });
                            } }
                        ];
                        
                        if (window.contextMenu) window.contextMenu.show(e.clientX, e.clientY, items);
                    } catch(e) {}
                });
            })(rows[i]);
        }
    };
    
    // ========================================
    // MODALS
    // ========================================
    
    UIManager.prototype.showConn = function(id) {
        var s = this;
        var o = document.getElementById('modal-overlay');
        var ct = document.getElementById('modal-content');
        var h = '';
        
        if (id === 'spotify') {
            h = '<div class="modal-header"><h3 class="modal-title">🎧 Connect Spotify</h3><span class="modal-close">×</span></div><div class="form-group"><label class="form-label">Client ID</label><input type="text" class="form-input" id="modalInp" placeholder="Enter your Spotify Client ID"></div><button class="btn btn-primary" id="modalSub" style="width:100%;">Connect</button>';
        } else if (id === 'youtube') {
            h = '<div class="modal-header"><h3 class="modal-title">📺 Connect YouTube</h3><span class="modal-close">×</span></div><div class="form-group"><label class="form-label">API Key</label><input type="text" class="form-input" id="modalInp" placeholder="Enter your YouTube API Key"></div><button class="btn btn-primary" id="modalSub" style="width:100%;">Connect</button>';
        } else {
            h = '<div class="modal-header"><h3 class="modal-title">🔌 Connect ' + id + '</h3><span class="modal-close">×</span></div><div class="form-group"><label class="form-label">API Key</label><input type="text" class="form-input" id="modalInp" placeholder="Enter API Key"></div><button class="btn btn-primary" id="modalSub" style="width:100%;">Connect</button>';
        }
        
        ct.innerHTML = h;
        o.classList.remove('hidden');
        
        var close = function() { o.classList.add('hidden'); };
        ct.querySelector('.modal-close').addEventListener('click', close);
        o.addEventListener('click', function(e) { if (e.target === o) close(); });
        
        document.getElementById('modalSub').addEventListener('click', function() {
            var v = document.getElementById('modalInp').value.trim();
            if (!v) return;
            if (id === 'spotify' && window.services) services.connectSpotify(v);
            else if (id === 'youtube' && window.services) { services.connectYouTube(v); close(); s.notify('Connected', 'success'); s.go('settings'); }
            else if (window.services) { services.connect(id, v); close(); s.notify('Connected', 'success'); s.go('settings'); }
        });
    };
    
    UIManager.prototype.showCreatePl = function() {
        var s = this;
        var o = document.getElementById('modal-overlay');
        var ct = document.getElementById('modal-content');
        
        ct.innerHTML = '<div class="modal-header"><h3 class="modal-title">📝 Create New Playlist</h3><span class="modal-close">×</span></div><div class="form-group"><label class="form-label">Playlist Name</label><input type="text" class="form-input" id="plName" placeholder="My Awesome Playlist" autofocus></div><div class="form-group"><label class="form-label">Description (optional)</label><textarea class="form-input" id="plDesc" rows="3" placeholder="Add a description..."></textarea></div><button class="btn btn-primary" id="savePl" style="width:100%;">✨ Create Playlist</button>';
        o.classList.remove('hidden');
        
        var close = function() { o.classList.add('hidden'); };
        ct.querySelector('.modal-close').addEventListener('click', close);
        o.addEventListener('click', function(e) { if (e.target === o) close(); });
        
        document.getElementById('savePl').addEventListener('click', function() {
            var n = document.getElementById('plName').value.trim() || 'New Playlist';
            var d = document.getElementById('plDesc').value.trim();
            if (window.library) {
                library.createPlaylist(n, d).then(function() {
                    s.notify('✅ Playlist "' + n + '" created', 'success');
                    close();
                    s.go('playlists');
                });
            }
        });
        
        document.getElementById('plName').focus();
    };
    
    UIManager.prototype.showPlModal = function(id) {
        var s = this;
        var o = document.getElementById('modal-overlay');
        var ct = document.getElementById('modal-content');
        
        if (!window.library) return;
        library.getPlaylist(id).then(function(pl) {
            if (!pl) return;
            library.getPlaylistTracks(id).then(function(t) {
                var h = '<div class="modal-header"><h3 class="modal-title">📁 ' + s.esc(pl.name) + '</h3><span class="modal-close">×</span></div>';
                if (pl.description) h += '<p class="text-muted text-sm mb-4">' + s.esc(pl.description) + '</p>';
                h += '<p class="text-muted text-sm mb-4">' + (t ? t.length : 0) + ' tracks</p><div class="track-list" style="max-height:400px;overflow-y:auto;">';
                if (t) {
                    for (var i = 0; i < t.length; i++) h += s.trackRow(t[i], i);
                }
                h += '</div><div class="mt-4" style="display:flex;gap:8px;flex-wrap:wrap;"><button class="btn btn-primary btn-sm" id="playAllBtn">▶ Play all</button><button class="btn btn-danger btn-sm" id="delPlBtn">🗑️ Delete Playlist</button></div>';
                ct.innerHTML = h;
                o.classList.remove('hidden');
                
                var close = function() { o.classList.add('hidden'); };
                ct.querySelector('.modal-close').addEventListener('click', close);
                o.addEventListener('click', function(e) { if (e.target === o) close(); });
                if (t) s.bindRows(ct);
                
                var playBtn = document.getElementById('playAllBtn');
                if (playBtn && t && t.length) {
                    playBtn.addEventListener('click', function() {
                        if (window.queueManager && window.player) {
                            queueManager.clear();
                            for (var i = 0; i < t.length; i++) queueManager.add(t[i]);
                            player.play(t[0]);
                            close();
                            s.notify('Playing playlist: ' + pl.name, 'success');
                        }
                    });
                }
                
                var delBtn = document.getElementById('delPlBtn');
                if (delBtn) {
                    delBtn.addEventListener('click', function() {
                        s.confirm('Delete playlist', 'Delete "' + pl.name + '"?', function() {
                            library.deletePlaylist(id).then(function() {
                                s.notify('Playlist deleted', 'success');
                                close();
                                s.go('playlists');
                            });
                        });
                    });
                }
            });
        });
    };
    
    UIManager.prototype.showAddPl = function(tid) {
        var s = this;
        var o = document.getElementById('modal-overlay');
        var ct = document.getElementById('modal-content');
        
        if (!window.library) return;
        library.getPlaylists().then(function(pl) {
            var h = '<div class="modal-header"><h3 class="modal-title">📁 Add to playlist</h3><span class="modal-close">×</span></div>';
            if (!pl || pl.length === 0) {
                h += '<p class="text-muted">No playlists yet. Create one first.</p>';
            } else {
                for (var i = 0; i < pl.length; i++) {
                    h += '<div class="playlist-option" data-id="' + pl[i].id + '">📁 ' + s.esc(pl[i].name) + ' (' + (pl[i].tracks ? pl[i].tracks.length : 0) + ' tracks)</div>';
                }
            }
            h += '<button class="btn btn-secondary btn-sm mt-4" id="newPlBtn">+ Create new playlist</button>';
            ct.innerHTML = h;
            o.classList.remove('hidden');
            
            var close = function() { o.classList.add('hidden'); };
            ct.querySelector('.modal-close').addEventListener('click', close);
            o.addEventListener('click', function(e) { if (e.target === o) close(); });
            
            ct.querySelectorAll('.playlist-option').forEach(function(opt) {
                opt.addEventListener('click', function() {
                    library.addToPlaylist(opt.getAttribute('data-id'), tid).then(function() {
                        s.notify('Added to playlist', 'success');
                        close();
                    });
                });
            });
            
            var newBtn = document.getElementById('newPlBtn');
            if (newBtn) newBtn.addEventListener('click', function() { close(); s.showCreatePl(); });
        });
    };
    
    UIManager.prototype.confirm = function(title, message, callback) {
        var o = document.getElementById('modal-overlay');
        var ct = document.getElementById('modal-content');
        
        ct.innerHTML = '<div class="modal-header"><h3 class="modal-title">⚠️ ' + title + '</h3><span class="modal-close">×</span></div><p class="mb-4" style="color:var(--text-secondary);">' + message + '</p><div style="display:flex;gap:8px;"><button class="btn btn-secondary" id="cancelBtn">Cancel</button><button class="btn btn-danger" id="confirmBtn">Confirm</button></div>';
        o.classList.remove('hidden');
        
        var close = function() { o.classList.add('hidden'); };
        ct.querySelector('.modal-close').addEventListener('click', close);
        o.addEventListener('click', function(e) { if (e.target === o) close(); });
        document.getElementById('cancelBtn').addEventListener('click', close);
        document.getElementById('confirmBtn').addEventListener('click', function() { close(); if (callback) callback(); });
    };
    
    // ========================================
    // PLAYER UI
    // ========================================
    
    UIManager.prototype.bindPlayer = function() {
        var s = this;
        
        var playBtn = document.getElementById('playBtn');
        var prevBtn = document.getElementById('prevBtn');
        var nextBtn = document.getElementById('nextBtn');
        var shuffleBtn = document.getElementById('shuffleBtn');
        var repeatBtn = document.getElementById('repeatBtn');
        var volumeSlider = document.getElementById('volumeSlider');
        var volumeBtn = document.getElementById('volumeBtn');
        var progressBar = document.getElementById('progressBar');
        var addToPlaylistBtn = document.getElementById('playerAddToPlaylistBtn');
        
        if (playBtn && window.player) playBtn.addEventListener('click', function() { 
            player.toggle();
            var equalizer = document.getElementById('equalizer');
            if (equalizer && player.playing) equalizer.style.display = 'flex';
            else if (equalizer && !player.playing) equalizer.style.display = 'none';
        });
        if (prevBtn && window.queueManager) prevBtn.addEventListener('click', function() { var p = queueManager.prev(); if (p && window.player) player.play(p); s.animateNowPlaying(); });
        if (nextBtn && window.queueManager) nextBtn.addEventListener('click', function() { var n = queueManager.next(); if (n && window.player) player.play(n); s.animateNowPlaying(); });
        if (shuffleBtn && window.queueManager) shuffleBtn.addEventListener('click', function() { queueManager.toggleShuffle(); });
        if (repeatBtn && window.queueManager) repeatBtn.addEventListener('click', function() { queueManager.toggleRepeat(); });
        
        if (volumeSlider && window.player) {
            volumeSlider.addEventListener('input', function(e) { 
                player.setVolume(e.target.value / 100);
                s.volumeBeforeMute = e.target.value;
                var volumeWave = document.getElementById('volumeWave');
                if (volumeWave) volumeWave.style.display = 'flex';
                setTimeout(function() { if (volumeWave) volumeWave.style.display = 'none'; }, 1000);
            });
        }
        
        if (volumeBtn && window.player) {
            volumeBtn.addEventListener('click', function() {
                var currentVol = volumeSlider.value;
                if (currentVol > 0) {
                    s.volumeBeforeMute = currentVol;
                    volumeSlider.value = 0;
                    player.setVolume(0);
                    s.showVolumeToast(0);
                } else {
                    volumeSlider.value = s.volumeBeforeMute;
                    player.setVolume(s.volumeBeforeMute / 100);
                    s.showVolumeToast(s.volumeBeforeMute);
                }
            });
        }
        
        if (progressBar && window.player) {
            progressBar.addEventListener('click', function(e) {
                var rect = this.getBoundingClientRect();
                var percent = (e.clientX - rect.left) / rect.width;
                var dur = player.getDuration();
                if (dur) player.seek(percent * dur);
            });
        }
        
        if (addToPlaylistBtn) {
            addToPlaylistBtn.addEventListener('click', function() {
                var t = window.player ? player.track : null;
                if (t) s.showAddPl(t.id);
                else s.notify('No track playing', 'info');
            });
        }
    };
    
    UIManager.prototype.updatePlayerUI = function() {
        var t = window.player ? player.track : null;
        var titleEl = document.getElementById('playerTitle');
        var artistEl = document.getElementById('playerArtist');
        var coverEl = document.getElementById('playerCover');
        
        if (titleEl) titleEl.textContent = t ? t.title : 'Nothing playing';
        if (artistEl) artistEl.textContent = t ? t.artist : 'Select a track';
        
        if (coverEl && t) {
            coverEl.style.animation = 'none';
            coverEl.offsetHeight;
            coverEl.style.animation = 'pulse 0.5s ease';
        }
        
        var icon = document.getElementById('playIcon');
        var isPlaying = window.player ? player.playing : false;
        if (icon) {
            icon.innerHTML = isPlaying ? 
                '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>' : 
                '<polygon points="5 3 19 12 5 21 5 3"/>';
        }
        
        var equalizer = document.getElementById('equalizer');
        if (equalizer) {
            if (isPlaying && t) equalizer.style.display = 'flex';
            else equalizer.style.display = 'none';
        }
        
        var shuffleBtn = document.getElementById('shuffleBtn');
        var repeatBtn = document.getElementById('repeatBtn');
        if (shuffleBtn && window.queueManager) {
            if (queueManager.shuffle) shuffleBtn.classList.add('active');
            else shuffleBtn.classList.remove('active');
        }
        if (repeatBtn && window.queueManager) {
            if (queueManager.repeat !== 'none') repeatBtn.classList.add('active');
            else repeatBtn.classList.remove('active');
        }
    };
    
    UIManager.prototype.updateProgress = function(d) {
        if (!d) return;
        var ct = document.getElementById('currentTime');
        var tt = document.getElementById('totalTime');
        var pf = document.getElementById('progressFill');
        
        if (ct && window.player) ct.textContent = player.fmt(d.currentTime);
        if (tt && window.player) tt.textContent = player.fmt(d.duration);
        if (pf) pf.style.width = (d.progress * 100) + '%';
    };
    
    // ========================================
    // STATS & UTILITIES
    // ========================================
    
    UIManager.prototype.loadStats = function() {
        var s = this;
        if (!window.library) return;
        library.getStats().then(function(st) {
            var e = document.getElementById('sidebarStats');
            if (e && st) {
                e.innerHTML = '<div class="sidebar-stat"><span class="stat-value">' + st.totalTracks + '</span><span class="stat-label">tracks</span></div><div class="sidebar-stat"><span class="stat-value">' + st.totalPlaylists + '</span><span class="stat-label">playlists</span></div><div class="sidebar-stat"><span class="stat-value">' + s.fmtSize(st.storageUsage) + '</span><span class="stat-label">used</span></div>';
                
                var favCount = window.favorites ? window.favorites.getAll().length : 0;
                e.innerHTML += '<div class="sidebar-stat"><span class="stat-value">' + favCount + '</span><span class="stat-label">favorites</span></div>';
            }
        }).catch(function() {});
    };
    
    UIManager.prototype.fmtSize = function(b) {
        if (!b) return '0 B';
        var u = ['B', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(b) / Math.log(1024));
        if (i >= u.length) i = u.length - 1;
        return (b / Math.pow(1024, i)).toFixed(1) + ' ' + u[i];
    };
    
    UIManager.prototype.checkSpotify = function() {
        if (window.services && services.checkSpotifyCallback) {
            if (services.checkSpotifyCallback()) {
                this.notify('🎧 Spotify connected', 'success');
                this.loadStats();
            }
        }
    };
    
    UIManager.prototype.exportLib = function() {
        var s = this;
        if (!window.library) return;
        library.exportLibrary().then(function(d) {
            var b = new Blob([d], {type: 'application/json'});
            var u = URL.createObjectURL(b);
            var a = document.createElement('a');
            a.href = u;
            a.download = 'musichub-backup-' + new Date().toISOString().split('T')[0] + '.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(u);
            s.notify('📤 Library exported', 'success');
        }).catch(function() { s.notify('Export failed', 'error'); });
    };
    
    UIManager.prototype.notify = function(msg, type) {
        var c = document.getElementById('notificationContainer');
        if (!c) return;
        
        var e = document.createElement('div');
        e.className = 'notification ' + (type || 'info');
        e.innerHTML = '<span>' + msg + '</span>';
        c.appendChild(e);
        
        setTimeout(function() {
            e.style.opacity = '0';
            e.style.transform = 'translateX(100%)';
            e.style.transition = 'all 0.3s ease';
            setTimeout(function() { if (e.parentNode) e.parentNode.removeChild(e); }, 300);
        }, 3000);
    };
    
    UIManager.prototype.esc = function(str) {
        if (!str) return '';
        var div = document.createElement('div');
        if (div.textContent !== undefined) div.textContent = str;
        else div.innerText = str;
        return div.innerHTML;
    };
    
    window.ui = new UIManager();
})();
