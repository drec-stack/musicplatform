(function() {
    'use strict';
    
    function UIManager() { 
        this.page = 'home'; 
        this.tab = 'tracks'; 
    }
    
    // Простейший renderSidebar
    UIManager.prototype.renderSidebar = function() {
        var n = document.getElementById('sidebarNav');
        if (!n) return;
        n.innerHTML = '<a class="nav-item active" data-page="home">Home</a><a class="nav-item" data-page="library">Library</a>';
    };
    
    UIManager.prototype.bindSidebar = function() {
        var s = this;
        var n = document.getElementById('sidebarNav');
        if (!n) return;
        n.addEventListener('click', function(e) {
            var el = e.target.closest('.nav-item');
            if (el) {
                s.go(el.getAttribute('data-page'));
            }
        });
    };
    
    UIManager.prototype.bindTopbar = function() {
        var si = document.getElementById('globalSearch');
        if (si) {
            si.addEventListener('input', function() {
                console.log('Search:', this.value);
            });
        }
    };
    
    UIManager.prototype.bindKeys = function() {
        // Пусто для теста
    };
    
    UIManager.prototype.bindPlayer = function() {
        var playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.addEventListener('click', function() { player.toggle(); });
        }
    };
    
    UIManager.prototype.go = function(page) {
        this.page = page;
        this.renderSidebar();
        var c = document.getElementById('content');
        if (c) c.innerHTML = '<h1>' + page + '</h1><p>Page loaded successfully!</p>';
        return Promise.resolve();
    };
    
    UIManager.prototype.init = function() {
        console.log('UI init started');
        this.renderSidebar();
        this.bindSidebar();
        this.bindTopbar();
        this.bindPlayer();
        this.bindKeys();
        
        var p = storage.get('current_page', 'home');
        return this.go(p).then(function() {
            console.log('UI init complete');
            document.body.classList.add('loaded');
        });
    };
    
    UIManager.prototype.loadStats = function() {};
    UIManager.prototype.updatePlayerUI = function() {};
    UIManager.prototype.updateProgress = function() {};
    UIManager.prototype.notify = function(msg) { alert(msg); };
    
    window.ui = new UIManager();
})();
