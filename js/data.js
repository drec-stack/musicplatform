// ========================================
// ДАННЫЕ И УТИЛИТЫ
// ========================================

(function() {
    // Демо треки
    var demoData = [
        { id: '1', title: 'Midnight Dreams', artist: 'Electronic Beats', duration: 214, favorite: false },
        { id: '2', title: 'Urban Flow', artist: 'City Lights', duration: 183, favorite: false },
        { id: '3', title: 'Chill Session', artist: 'Lofi Study', duration: 245, favorite: false },
        { id: '4', title: 'Rock Anthem', artist: 'The Thunder', duration: 198, favorite: false },
        { id: '5', title: 'Jazz Evening', artist: 'Smooth Trio', duration: 312, favorite: false },
        { id: '6', title: 'Acoustic Sunrise', artist: 'Folk Guitarist', duration: 267, favorite: false },
        { id: '7', title: 'Deep House', artist: 'Club Mixer', duration: 356, favorite: false },
        { id: '8', title: 'Smooth R&B', artist: 'Soul Singer', duration: 234, favorite: false }
    ];
    
    // Демо плейлисты
    var demoPlaylists = [
        { id: 'pl1', name: 'Favorites', tracks: ['1', '3', '5'] },
        { id: 'pl2', name: 'Workout', tracks: ['2', '4', '7'] }
    ];
    
    // Глобальное состояние
    window.AppState = {
        tracks: [],
        playlists: [],
        currentPage: 'home',
        currentTrack: null,
        isPlaying: false,
        progressInterval: null
    };
    
    // Загрузка из localStorage
    window.loadData = function() {
        var savedTracks = localStorage.getItem('musichub_tracks');
        var savedPlaylists = localStorage.getItem('musichub_playlists');
        
        if (savedTracks) {
            window.AppState.tracks = JSON.parse(savedTracks);
        } else {
            window.AppState.tracks = demoData.slice();
            saveData();
        }
        
        if (savedPlaylists) {
            window.AppState.playlists = JSON.parse(savedPlaylists);
        } else {
            window.AppState.playlists = demoPlaylists.slice();
            saveData();
        }
        
        updateStatsDisplay();
    };
    
    // Сохранение
    window.saveData = function() {
        localStorage.setItem('musichub_tracks', JSON.stringify(window.AppState.tracks));
        localStorage.setItem('musichub_playlists', JSON.stringify(window.AppState.playlists));
    };
    
    // Обновление статистики на UI
    function updateStatsDisplay() {
        var trackCount = document.getElementById('trackCount');
        var playlistCount = document.getElementById('playlistCount');
        if (trackCount) trackCount.textContent = window.AppState.tracks.length;
        if (playlistCount) playlistCount.textContent = window.AppState.playlists.length;
    }
    
    window.updateStats = updateStatsDisplay;
    
    // Форматирование времени
    window.formatTime = function(seconds) {
        if (!seconds) return '0:00';
        var mins = Math.floor(seconds / 60);
        var secs = Math.floor(seconds % 60);
        return mins + ':' + (secs < 10 ? '0' : '') + secs;
    };
    
    // Уведомление
    window.showToast = function(msg) {
        var toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(function() {
            toast.remove();
        }, 3000);
    };
    
    // Escape HTML
    window.escapeHtml = function(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    };
})();
