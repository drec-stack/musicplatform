// ========================================
// ЗАПУСК ПРИЛОЖЕНИЯ
// ========================================

(function() {
    'use strict';
    
    function startApp() {
        if (window.ui && typeof window.ui.init === 'function') {
            window.ui.init();
        } else {
            setTimeout(startApp, 50);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startApp);
    } else {
        startApp();
    }
    
    // Обработка кнопки "Назад"
    window.addEventListener('popstate', function(e) {
        var page = location.hash.slice(1) || 'home';
        if (window.ui) window.ui.go(page);
    });
})();
