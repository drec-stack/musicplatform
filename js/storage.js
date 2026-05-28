// js/storage.js
class StorageManager {
    constructor() {
        this.prefix = 'musichub_';
        this.cache = new Map();
        this.init();
    }
    
    init() {
        // Проверяем доступность localStorage
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            this.available = true;
        } catch(e) {
            this.available = false;
            console.warn('localStorage недоступен, используем память');
        }
        
        // Загружаем кэш в память для быстрого доступа
        this.loadCache();
    }
    
    loadCache() {
        if (!this.available) return;
        
        const keys = [
            'settings',
            'connected_services',
            'play_history',
            'favorites',
            'queue'
        ];
        
        keys.forEach(key => {
            const data = localStorage.getItem(this.prefix + key);
            if (data) {
                try {
                    this.cache.set(key, JSON.parse(data));
                } catch(e) {
                    this.cache.set(key, null);
                }
            }
        });
    }
    
    get(key) {
        // Сначала проверяем кэш в памяти
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }
        
        // Затем localStorage
        if (this.available) {
            const data = localStorage.getItem(this.prefix + key);
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    this.cache.set(key, parsed);
                    return parsed;
                } catch(e) {
                    return null;
                }
            }
        }
        
        return null;
    }
    
    set(key, value) {
        // Сохраняем в кэш памяти
        this.cache.set(key, value);
        
        // Сохраняем в localStorage
        if (this.available) {
            try {
                localStorage.setItem(this.prefix + key, JSON.stringify(value));
            } catch(e) {
                console.error('Ошибка сохранения:', e);
                // Очищаем старые данные если место закончилось
                this.clearOldData();
            }
        }
    }
    
    remove(key) {
        this.cache.delete(key);
        if (this.available) {
            localStorage.removeItem(this.prefix + key);
        }
    }
    
    clearOldData() {
        // Удаляем историю прослушиваний старше 30 дней
        const history = this.get('play_history') || [];
        const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const fresh = history.filter(item => item.timestamp > monthAgo);
        this.set('play_history', fresh);
    }
}

// Глобальный экземпляр
window.storage = new StorageManager();
