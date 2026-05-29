(function() {
    'use strict';
    
    function NowPlayingManager() {
        this.init();
    }
    
    NowPlayingManager.prototype.init = function() {
        this.createButton();
        this.createPage();
        
        // Обновляем при смене трека
        player.on('track_change', function() { this.updatePage(); }.bind(this));
        player.on('play', function() { this.updateProgress(); }.bind(this));
        player.on('progress', function() { this.updateProgress(); }.bind(this));
    };
    
    NowPlayingManager.prototype.createButton = function() {
        // Кнопка в плеере
        var playerCenter = document.querySelector('.player-center');
        if (playerCenter && !document.getElementById('nowPlayingBtn')) {
            var npBtn = document.createElement('button');
            npBtn.id = 'nowPlayingBtn';
            npBtn.className = 'btn-icon';
            npBtn.title = 'Now Playing';
            npBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/></svg>';
            npBtn.addEventListener('click', function() {
                window.ui.go('nowplaying');
            });
            playerCenter.appendChild(npBtn);
        }
        
        // Добавляем страницу в роутер
        var originalGo = window.ui.go;
        window.ui.go = function(page) {
            if (page === 'nowplaying') {
                return this.nowPlayingPage();
            }
            return originalGo.call(this, page);
        }.bind(this);
    };
    
    NowPlayingManager.prototype.createPage = function() {
        // Добавляем стили
        var style = document.createElement('style');
        style.textContent = `
            .nowplaying-page {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 70vh;
                text-align: center;
            }
            .nowplaying-cover {
                width: 280px;
                height: 280px;
                border-radius: 24px;
                background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 32px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                animation: float 3s ease-in-out infinite;
            }
            @keyframes float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-8px); }
            }
            .nowplaying-cover svg {
                width: 80px;
                height: 80px;
                opacity: 0.6;
            }
            .nowplaying-title {
                font-size: 32px;
                font-weight: 700;
                margin-bottom: 8px;
            }
            .nowplaying-artist {
                font-size: 18px;
                color: var(--text-secondary);
                margin-bottom: 32px;
            }
            .nowplaying-progress {
                width: 100%;
                max-width: 500px;
                margin-bottom: 24px;
            }
            .nowplaying-time {
                display: flex;
                justify-content: space-between;
                font-size: 12px;
                color: var(--text-tertiary);
                margin-top: 8px;
            }
            .nowplaying-controls {
                display: flex;
                gap: 24px;
                margin-bottom: 32px;
            }
            .nowplaying-btn {
                width: 56px;
                height: 56px;
                border-radius: 50%;
                background: var(--bg-elevated);
                border: 1px solid var(--glass-border);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all var(--transition-base);
            }
            .nowplaying-btn:hover {
                transform: scale(1.05);
                background: var(--accent-primary);
            }
            .nowplaying-btn-play {
                width: 64px;
                height: 64px;
                background: var(--accent-gradient);
                box-shadow: var(--accent-glow);
            }
            @media (max-width: 640px) {
                .nowplaying-cover { width: 200px; height: 200px; }
                .nowplaying-title { font-size: 24px; }
                .nowplaying-artist { font-size: 16px; }
            }
        `;
        document.head.appendChild(style);
    };
    
    NowPlayingManager.prototype.nowPlayingPage = function() {
        var c = document.getElementById('content');
        c.innerHTML = `
            <div class="page nowplaying-page" id="nowplaying-content">
                <div class="nowplaying-cover" id="nowplaying-cover">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M9 18V5l12-2v13"/>
                        <circle cx="6" cy="18" r="3"/>
                        <circle cx="18" cy="16" r="3"/>
                    </svg>
                </div>
                <div class="nowplaying-title" id="nowplaying-title">Nothing playing</div>
                <div class="nowplaying-artist" id="nowplaying-artist">Select a track</div>
                <div class="nowplaying-progress">
                    <div class="player-progress-bar" id="np-progressBar">
                        <div class="player-progress-fill" id="np-progressFill"></div>
                    </div>
                    <div class="nowplaying-time">
                        <span id="np-currentTime">0:00</span>
                        <span id="np-totalTime">0:00</span>
                    </div>
                </div>
                <div class="nowplaying-controls">
                    <button class="nowplaying-btn" id="np-shuffle">🎲</button>
                    <button class="nowplaying-btn" id="np-prev">⏮</button>
                    <button class="nowplaying-btn nowplaying-btn-play" id="np-play">▶</button>
                    <button class="nowplaying-btn" id="np-next">⏭</button>
                    <button class="nowplaying-btn" id="np-repeat">🔄</button>
                </div>
                <div class="nowplaying-actions">
                    <button class="btn btn-secondary" id="np-fav">❤️ Favorite</button>
                    <button class="btn btn-secondary" id="np-addToPlaylist">📁 Add to playlist</button>
                </div>
            </div>
        `;
        
        this.updatePage();
        this.bindControls();
        
        return Promise.resolve();
    };
    
    NowPlayingManager.prototype.updatePage = function() {
        var track = player.track;
        var titleEl = document.getElementById('nowplaying-title');
        var artistEl = document.getElementById('nowplaying-artist');
        
        if (titleEl) titleEl.textContent = track ? track.title : 'Nothing playing';
        if (artistEl) artistEl.textContent = track ? track.artist : 'Select a track';
        
        this.updateProgress();
    };
    
    NowPlayingManager.prototype.updateProgress = function() {
        var currentTime = document.getElementById('np-currentTime');
        var totalTime = document.getElementById('np-totalTime');
        var fill = document.getElementById('np-progressFill');
        
        if (currentTime) currentTime.textContent = player.fmt(player.getTime());
        if (totalTime) totalTime.textContent = player.fmt(player.getDuration());
        if (fill) fill.style.width = (player.getProgress() * 100) + '%';
    };
    
    NowPlayingManager.prototype.bindControls = function() {
        document.getElementById('np-play')?.addEventListener('click', function() { player.toggle(); });
        document.getElementById('np-prev')?.addEventListener('click', function() { var p = queueManager.prev(); if(p) player.play(p); });
        document.getElementById('np-next')?.addEventListener('click', function() { var n = queueManager.next(); if(n) player.play(n); });
        document.getElementById('np-shuffle')?.addEventListener('click', function() { queueManager.toggleShuffle(); });
        document.getElementById('np-repeat')?.addEventListener('click', function() { queueManager.toggleRepeat(); });
        document.getElementById('np-fav')?.addEventListener('click', function() {
            var track = player.track;
            if (track && window.favorites) {
                window.favorites.toggle(track);
                var isFav = window.favorites.isFavorite(track.id);
                if (window.ui) ui.notify(isFav ? 'Added to favorites' : 'Removed from favorites', 'success');
            }
        });
        document.getElementById('np-addToPlaylist')?.addEventListener('click', function() {
            var track = player.track;
            if (track && window.ui) ui.showAddPl(track.id);
        });
        
        var progressBar = document.getElementById('np-progressBar');
        if (progressBar) {
            progressBar.addEventListener('click', function(e) {
                var rect = this.getBoundingClientRect();
                var percent = (e.clientX - rect.left) / rect.width;
                player.seek(percent * player.getDuration());
            });
        }
        
        // Обновляем иконку play/pause
        var updatePlayIcon = function() {
            var playBtn = document.getElementById('np-play');
            if (playBtn) playBtn.textContent = player.playing ? '⏸' : '▶';
        };
        player.on('play', updatePlayIcon);
        player.on('pause', updatePlayIcon);
        updatePlayIcon();
    };
    
    window.nowPlaying = new NowPlayingManager();
})();
