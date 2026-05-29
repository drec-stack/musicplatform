(function() {
    'use strict';
    
    function DragQueueManager() {
        this.draggedItem = null;
        this.draggedIndex = -1;
        this.init();
    }
    
    DragQueueManager.prototype.init = function() {
        var self = this;
        
        // Создаём панель очереди
        this.createQueuePanel();
        
        // Добавляем кнопку для показа очереди
        this.addQueueButton();
    };
    
    DragQueueManager.prototype.createQueuePanel = function() {
        var panel = document.createElement('div');
        panel.id = 'queue-panel';
        panel.className = 'queue-panel';
        panel.innerHTML = `
            <div class="queue-header">
                <h3 class="queue-title">Queue</h3>
                <button class="queue-close btn-icon">✕</button>
            </div>
            <div class="queue-list" id="queue-list"></div>
            <div class="queue-footer">
                <button class="btn btn-secondary btn-sm" id="clearQueueBtn">Clear</button>
                <button class="btn btn-secondary btn-sm" id="saveQueueAsPlaylistBtn">Save as playlist</button>
            </div>
        `;
        document.body.appendChild(panel);
        
        // Закрытие панели
        panel.querySelector('.queue-close').addEventListener('click', function() {
            panel.classList.remove('open');
        });
        
        // Очистка очереди
        document.getElementById('clearQueueBtn').addEventListener('click', function() {
            queueManager.clear();
            self.renderQueue();
            if (window.ui) ui.notify('Queue cleared', 'info');
        });
        
        // Сохранить очередь как плейлист
        document.getElementById('saveQueueAsPlaylistBtn').addEventListener('click', function() {
            var tracks = queueManager.getAll();
            if (tracks.length === 0) {
                if (window.ui) ui.notify('Queue is empty', 'error');
                return;
            }
            
            var playlistName = prompt('Playlist name:', 'Queue ' + new Date().toLocaleString());
            if (playlistName) {
                library.createPlaylist(playlistName, '').then(function(playlist) {
                    var promises = tracks.map(function(track) {
                        return library.addToPlaylist(playlist.id, track.id);
                    });
                    Promise.all(promises).then(function() {
                        if (window.ui) ui.notify('Saved as playlist: ' + playlistName, 'success');
                        panel.classList.remove('open');
                    });
                });
            }
        });
        
        // Слушаем изменения очереди
        queueManager.on('add', function() { self.renderQueue(); });
        queueManager.on('clear', function() { self.renderQueue(); });
        queueManager.on('remove', function() { self.renderQueue(); });
    };
    
    DragQueueManager.prototype.addQueueButton = function() {
        // Добавляем кнопку в плеер
        var playerRight = document.querySelector('.player-right');
        if (playerRight && !document.getElementById('queueToggleBtn')) {
            var queueBtn = document.createElement('button');
            queueBtn.id = 'queueToggleBtn';
            queueBtn.className = 'btn-icon';
            queueBtn.title = 'Queue (Q)';
            queueBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>';
            queueBtn.addEventListener('click', function() {
                var panel = document.getElementById('queue-panel');
                panel.classList.toggle('open');
                self.renderQueue();
            });
            playerRight.insertBefore(queueBtn, playerRight.firstChild);
        }
        
        // Горячая клавиша Q
        document.addEventListener('keydown', function(e) {
            if (e.code === 'KeyQ' && !e.ctrlKey && !e.metaKey) {
                var panel = document.getElementById('queue-panel');
                if (panel) panel.classList.toggle('open');
            }
        });
    };
    
    DragQueueManager.prototype.renderQueue = function() {
        var container = document.getElementById('queue-list');
        if (!container) return;
        
        var tracks = queueManager.getAll();
        var currentIndex = queueManager.getIndex();
        
        if (tracks.length === 0) {
            container.innerHTML = '<div class="empty-state" style="padding:40px;"><p>Queue is empty</p><span>Add tracks to see them here</span></div>';
            return;
        }
        
        var html = '';
        for (var i = 0; i < tracks.length; i++) {
            var track = tracks[i];
            var isActive = (i === currentIndex);
            html += `
                <div class="queue-item ${isActive ? 'active' : ''}" data-index="${i}" draggable="true">
                    <div class="queue-item-grip">⋮⋮</div>
                    <div class="queue-item-cover">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20">
                            <path d="M9 18V5l12-2v13"/>
                            <circle cx="6" cy="18" r="3"/>
                            <circle cx="18" cy="16" r="3"/>
                        </svg>
                    </div>
                    <div class="queue-item-info">
                        <div class="queue-item-title">${this.escapeHtml(track.title || 'Untitled')}</div>
                        <div class="queue-item-artist">${this.escapeHtml(track.artist || 'Unknown')}</div>
                    </div>
                    <button class="queue-item-remove btn-icon" data-index="${i}">✕</button>
                </div>
            `;
        }
        container.innerHTML = html;
        
        // Добавляем обработчики
        var self = this;
        container.querySelectorAll('.queue-item').forEach(function(item) {
            var index = parseInt(item.getAttribute('data-index'));
            
            // Клик для воспроизведения
            item.addEventListener('click', function(e) {
                if (e.target.classList.contains('queue-item-remove')) return;
                var track = tracks[index];
                if (track) player.play(track);
                var panel = document.getElementById('queue-panel');
                if (panel) panel.classList.remove('open');
            });
            
            // Кнопка удаления
            var removeBtn = item.querySelector('.queue-item-remove');
            if (removeBtn) {
                removeBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    queueManager.remove(index);
                    self.renderQueue();
                });
            }
            
            // Drag and drop
            item.addEventListener('dragstart', function(e) {
                self.draggedIndex = index;
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', index);
                item.style.opacity = '0.5';
            });
            
            item.addEventListener('dragend', function(e) {
                item.style.opacity = '';
            });
            
            item.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                item.style.borderTop = '2px solid var(--accent-primary)';
            });
            
            item.addEventListener('dragleave', function(e) {
                item.style.borderTop = '';
            });
            
            item.addEventListener('drop', function(e) {
                e.preventDefault();
                item.style.borderTop = '';
                
                var fromIndex = self.draggedIndex;
                var toIndex = index;
                
                if (fromIndex !== toIndex && fromIndex !== -1) {
                    self.reorderQueue(fromIndex, toIndex);
                }
                self.draggedIndex = -1;
            });
        });
    };
    
    DragQueueManager.prototype.reorderQueue = function(from, to) {
        var tracks = queueManager.getAll();
        var moved = tracks[from];
        tracks.splice(from, 1);
        tracks.splice(to, 0, moved);
        
        // Обновляем очередь
        queueManager.list = tracks;
        queueManager.orig = tracks.slice();
        
        // Корректируем индекс
        if (queueManager.idx === from) {
            queueManager.idx = to;
        } else if (queueManager.idx > from && queueManager.idx <= to) {
            queueManager.idx--;
        } else if (queueManager.idx < from && queueManager.idx >= to) {
            queueManager.idx++;
        }
        
        queueManager.save();
        this.renderQueue();
        if (window.ui) ui.notify('Queue reordered', 'info');
    };
    
    DragQueueManager.prototype.escapeHtml = function(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    };
    
    window.dragQueue = new DragQueueManager();
})();
