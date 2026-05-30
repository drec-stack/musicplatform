// ========================================
// ДАННЫЕ ПРИЛОЖЕНИЯ
// ========================================

(function() {
    'use strict';
    
    // База данных
    var db = null;
    var DB_NAME = 'MusicHubDB';
    var DB_VERSION = 1;
    
    // Демо-треки
    var DEMO_TRACKS = [
        { id: '1', title: 'Midnight Dreams', artist: 'Electronic Beats', duration: 214, source: 'demo', favorite: false, dateAdded: Date.now() - 86400000 },
        { id: '2', title: 'Urban Flow', artist: 'City Lights', duration: 183, source: 'demo', favorite: false, dateAdded: Date.now() - 172800000 },
        { id: '3', title: 'Chill Session', artist: 'Lofi Study', duration: 245, source: 'demo', favorite: false, dateAdded: Date.now() - 259200000 },
        { id: '4', title: 'Rock Anthem', artist: 'The Thunder', duration: 198, source: 'demo', favorite: false, dateAdded: Date.now() - 345600000 },
        { id: '5', title: 'Jazz Evening', artist: 'Smooth Trio', duration: 312, source: 'demo', favorite: false, dateAdded: Date.now() - 432000000 },
        { id: '6', title: 'Acoustic Sunrise', artist: 'Folk Guitarist', duration: 267, source: 'demo', favorite: false, dateAdded: Date.now() - 518400000 },
        { id: '7', title: 'Deep House', artist: 'Club Mixer', duration: 356, source: 'demo', favorite: false, dateAdded: Date.now() - 604800000 },
        { id: '8', title: 'Smooth R&B', artist: 'Soul Singer', duration: 234, source: 'demo', favorite: false, dateAdded: Date.now() - 691200000 }
    ];
    
    // Демо-плейлисты
    var DEMO_PLAYLISTS = [
        { id: 'pl1', name: 'Favorites', tracks: ['1', '3', '5'], createdAt: Date.now() },
        { id: 'pl2', name: 'Workout', tracks: ['2', '4', '7'], createdAt: Date.now() }
    ];
    
    // Открытие БД
    function openDB() {
        return new Promise(function(resolve, reject) {
            var request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = function() { reject(request.error); };
            request.onsuccess = function() {
                db = request.result;
                resolve(db);
            };
            request.onupgradeneeded = function(event) {
                var db = event.target.result;
                if (!db.objectStoreNames.contains('tracks')) {
                    db.createObjectStore('tracks', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('playlists')) {
                    db.createObjectStore('playlists', { keyPath: 'id' });
                }
            };
        });
    }
    
    // Получение всех треков
    function getAllTracks() {
        return new Promise(function(resolve, reject) {
            var transaction = db.transaction(['tracks'], 'readonly');
            var store = transaction.objectStore('tracks');
            var request = store.getAll();
            request.onsuccess = function() { resolve(request.result || []); };
            request.onerror = function() { reject(request.error); };
        });
    }
    
    // Сохранение трека
    function saveTrack(track) {
        return new Promise(function(resolve, reject) {
            var transaction = db.transaction(['tracks'], 'readwrite');
            var store = transaction.objectStore('tracks');
            var request = store.put(track);
            request.onsuccess = function() { resolve(track); };
            request.onerror = function() { reject(request.error); };
        });
    }
    
    // Удаление трека
    function deleteTrack(id) {
        return new Promise(function(resolve, reject) {
            var transaction = db.transaction(['tracks'], 'readwrite');
            var store = transaction.objectStore('tracks');
            var request = store.delete(id);
            request.onsuccess = function() { resolve(); };
            request.onerror = function() { reject(request.error); };
        });
    }
    
    // Получение всех плейлистов
    function getAllPlaylists() {
        return new Promise(function(resolve, reject) {
            var transaction = db.transaction(['playlists'], 'readonly');
            var store = transaction.objectStore('playlists');
            var request = store.getAll();
            request.onsuccess = function() { resolve(request.result || []); };
            request.onerror = function() { reject(request.error); };
        });
    }
    
    // Сохранение плейлиста
    function savePlaylist(playlist) {
        return new Promise(function(resolve, reject) {
            var transaction = db.transaction(['playlists'], 'readwrite');
            var store = transaction.objectStore('playlists');
            var request = store.put(playlist);
            request.onsuccess = function() { resolve(playlist); };
            request.onerror = function() { reject(request.error); };
        });
    }
    
    // Удаление плейлиста
    function deletePlaylist(id) {
        return new Promise(function(resolve, reject) {
            var transaction = db.transaction(['playlists'], 'readwrite');
            var store = transaction.objectStore('playlists');
            var request = store.delete(id);
            request.onsuccess = function() { resolve(); };
            request.onerror = function() { reject(request.error); };
        });
    }
    
    // Очистка всех данных
    function clearAll() {
        return Promise.all([
            new Promise(function(resolve, reject) {
                var transaction = db.transaction(['tracks'], 'readwrite');
                var store = transaction.objectStore('tracks');
                var request = store.clear();
                request.onsuccess = resolve;
                request.onerror = reject;
            }),
            new Promise(function(resolve, reject) {
                var transaction = db.transaction(['playlists'], 'readwrite');
                var store = transaction.objectStore('playlists');
                var request = store.clear();
                request.onsuccess = resolve;
                request.onerror = reject;
            })
        ]);
    }
    
    // Инициализация демо-данных
    function initDemoData() {
        return getAllTracks().then(function(tracks) {
            if (tracks.length === 0) {
                var promises = DEMO_TRACKS.map(function(track) {
                    return saveTrack(track);
                });
                return Promise.all(promises);
            }
        }).then(function() {
            return getAllPlaylists().then(function(playlists) {
                if (playlists.length === 0) {
                    var promises = DEMO_PLAYLISTS.map(function(playlist) {
                        return savePlaylist(playlist);
                    });
                    return Promise.all(promises);
                }
            });
        });
    }
    
    // Экспорт API
    window.DB = {
        open: openDB,
        getAllTracks: getAllTracks,
        saveTrack: saveTrack,
        deleteTrack: deleteTrack,
        getAllPlaylists: getAllPlaylists,
        savePlaylist: savePlaylist,
        deletePlaylist: deletePlaylist,
        clearAll: clearAll,
        initDemoData: initDemoData
    };
})();
