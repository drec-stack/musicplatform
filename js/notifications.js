// Этот файл уже есть в ui.js, но создадим отдельный для полноты
(function() {
    'use strict';
    
    function NotificationsManager() {
        this.container = null;
        this.init();
    }
    
    NotificationsManager.prototype.init = function() {
        this.container = document.getElementById('notificationContainer');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'notification-container';
            document.body.appendChild(this.container);
        }
    };
    
    NotificationsManager.prototype.show = function(message, type) {
        if (!this.container) this.init();
        
        var notification = document.createElement('div');
        notification.className = 'notification ' + (type || 'info');
        var icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️');
        notification.innerHTML = icon + ' ' + message;
        this.container.appendChild(notification);
        
        setTimeout(function() {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(function() {
                if (notification.parentNode) notification.parentNode.removeChild(notification);
            }, 300);
        }, 3000);
    };
    
    window.notifications = new NotificationsManager();
})();
