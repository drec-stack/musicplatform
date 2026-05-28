(function() {
    'use strict';
    
    function ContextMenu() {
        this.menu = null;
        this.init();
    }
    
    ContextMenu.prototype.init = function() {
        var self = this;
        this.menu = document.createElement('div');
        this.menu.className = 'context-menu';
        this.menu.style.cssText = 'position:fixed;background:var(--bg-secondary);border:1px solid var(--border);border-radius:8px;padding:4px 0;min-width:180px;z-index:1000;box-shadow:0 4px 20px rgba(0,0,0,0.3);display:none;';
        document.body.appendChild(this.menu);
        
        document.addEventListener('click', function() { self.hide(); });
    };
    
    ContextMenu.prototype.show = function(x, y, items) {
        this.hide();
        this.menu.innerHTML = '';
        
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var menuItem = document.createElement('div');
            menuItem.className = 'context-menu-item';
            menuItem.style.cssText = 'padding:8px 16px;cursor:pointer;display:flex;align-items:center;gap:10px;transition:background 0.15s;';
            menuItem.innerHTML = (item.icon ? '<span style="width:18px;">' + item.icon + '</span>' : '') + '<span>' + item.label + '</span>';
            
            menuItem.onmouseenter = function(el) { return function() { el.style.background = 'var(--bg-hover)'; }; }(menuItem);
            menuItem.onmouseleave = function(el) { return function() { el.style.background = ''; }; }(menuItem);
            menuItem.onclick = (function(act) {
                return function(e) {
                    e.stopPropagation();
                    act();
                    this.hide();
                }.bind(this);
            }.bind(this))(item.action);
            
            this.menu.appendChild(menuItem);
        }
        
        this.menu.style.display = 'block';
        this.menu.style.left = x + 'px';
        this.menu.style.top = y + 'px';
        
        var rect = this.menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            this.menu.style.left = (window.innerWidth - rect.width - 10) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            this.menu.style.top = (window.innerHeight - rect.height - 10) + 'px';
        }
    };
    
    ContextMenu.prototype.hide = function() {
        if (this.menu) this.menu.style.display = 'none';
    };
    
    window.contextMenu = new ContextMenu();
})();
