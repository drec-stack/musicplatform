(function() {
    'use strict';
    
    function HotkeysManager() {
        this.keys = {};
        this.init();
    }
    
    HotkeysManager.prototype.init = function() {
        var self = this;
        document.addEventListener('keydown', function(e) {
            var key = e.key.toLowerCase();
            var ctrl = e.ctrlKey || e.metaKey;
            
            if (ctrl && key === 'k') {
                e.preventDefault();
                var searchInput = document.getElementById('globalSearch');
                if (searchInput) searchInput.focus();
            }
            
            if (key === ' ' && document.activeElement === document.body) {
                e.preventDefault();
                if (window.player) player.toggle();
            }
            
            if (key === 'arrowright' && ctrl) {
                e.preventDefault();
                if (window.player) {
                    var time = player.getDuration() * 0.1;
                    player.seek(player.audio?.currentTime + 10);
                }
            }
            
            if (key === 'arrowleft' && ctrl) {
                e.preventDefault();
                if (window.player) {
                    player.seek(player.audio?.currentTime - 10);
                }
            }
        });
    };
    
    window.hotkeys = new HotkeysManager();
})();
