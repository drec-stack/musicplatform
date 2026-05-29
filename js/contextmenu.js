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
        this.menu.style.cssText = 'position:fixed;background:var(--bg-secondary);border-radius:8px;padding:8px;box-shadow:0 4px 12px rgba(0,0,0,0.3);z-index:2000;display:none;min-width:180px;';
        document.body.appendChild(this.menu);
        
        document.addEventListener('click', function() {
            self.hide();
        });
    };
    
    ContextMenu.prototype.show = function(x, y, items) {
        this.hide();
        
        var html = '';
        for (var i = 0; i < items.length; i++) {
            html += '<div class="context-menu-item" style="padding:10px 16px;cursor:pointer;transition:background 0.2s;border-radius:4px;" data-action="' + i + '">' + items[i].label + '</div>';
        }
        this.menu.innerHTML = html;
        this.menu.style.display = 'block';
        this.menu.style.left = x + 'px';
        this.menu.style.top = y + 'px';
        
        var self = this;
        this.menu.querySelectorAll('.context-menu-item').forEach(function(item) {
            item.addEventListener('mouseenter', function() {
                item.style.background = 'var(--accent)';
            });
            item.addEventListener('mouseleave', function() {
                item.style.background = 'transparent';
            });
            item.addEventListener('click', function() {
                var index = parseInt(item.dataset.action);
                if (items[index] && items[index].action) {
                    items[index].action();
                }
                self.hide();
            });
        });
        
        // Проверка выхода за границы экрана
        var rect = this.menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            this.menu.style.left = (window.innerWidth - rect.width - 10) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            this.menu.style.top = (window.innerHeight - rect.height - 10) + 'px';
        }
    };
    
    ContextMenu.prototype.hide = function() {
        if (this.menu) {
            this.menu.style.display = 'none';
        }
    };
    
    window.contextMenu = new ContextMenu();
})();
