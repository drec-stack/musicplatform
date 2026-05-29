(function() {
    'use strict';
    
    function DragQueue() {
        this.dragSource = null;
        this.init();
    }
    
    DragQueue.prototype.init = function() {
        var self = this;
        
        document.addEventListener('dragstart', function(e) {
            var trackEl = e.target.closest('.track-row');
            if (trackEl && trackEl.dataset.track) {
                try {
                    self.dragSource = JSON.parse(trackEl.dataset.track);
                    e.dataTransfer.setData('text/plain', trackEl.dataset.track);
                    e.dataTransfer.effectAllowed = 'copy';
                } catch(e) {}
            }
        });
        
        document.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });
        
        document.addEventListener('drop', function(e) {
            e.preventDefault();
            var target = e.target.closest('#queueContainer, .queue-list, .playlist-card');
            
            if (target && self.dragSource) {
                if (target.id === 'queueContainer' || target.classList.contains('queue-list')) {
                    if (window.queueManager) {
                        queueManager.add(self.dragSource);
                        if (window.ui) ui.notify('Added to queue', 'success');
                    }
                } else if (target.classList.contains('playlist-card')) {
                    var playlistId = target.dataset.playlistId;
                    if (playlistId && window.library) {
                        library.addToPlaylist(playlistId, self.dragSource.id);
                        if (window.ui) ui.notify('Added to playlist', 'success');
                    }
                }
            }
            self.dragSource = null;
        });
    };
    
    window.dragQueue = new DragQueue();
})();
