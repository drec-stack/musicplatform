// js/app.js
class MusicHubApp {
    constructor() {
        this.version = '1.0.0';
        this.initialized = false;
    }
    
    async init() {
        if (this.initialized) return;
        
        console.log(`🎵 MusicHub v${this.version} запускается...`);
        
        try {
            // Инициализируем UI
            ui.init();
            
            // Проверяем callback от OAuth
            if (window.location.hash) {
                const result = services.handleAuthCallback();
                if (result.success) {
                    ui.showNotification(`${result.service} успешно подключён!`, 'success');
                    ui.renderSidebar(); // Обновляем боковую панель
                }
            }
            
            // Восстанавливаем последнюю страницу
            const lastPage = storage.get('current_page') || 'home';
            ui.navigateTo(lastPage);
            
            this.initialized = true;
            console.log('✅ MusicHub готов к работе');
            
            // Приветственное сообщение
            const connectedCount = services.getAllServices()
                .filter(s => s.connected).length;
                
            if (connectedCount === 0) {
                setTimeout(() => {
                    ui.showNotification(
                        '👋 Подключите музыкальные сервисы в настройках для начала работы',
                        'info'
                    );
                }, 1000);
            }
            
        } catch (error) {
            console.error('❌ Ошибка инициализации:', error);
            ui.showNotification('Ошибка запуска приложения', 'error');
        }
    }
}

// Создаём и запускаем приложение
const app = new MusicHubApp();

// Ждём загрузку DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

// Экспортируем для отладки
window.musicHubApp = app;
