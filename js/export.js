(function() {
    'use strict';
    
    function ExportManager() {}
    
    ExportManager.prototype.exportLibrary = function() {
        if (window.library) {
            library.exportLibrary().then(function(data) {
                var blob = new Blob([data], { type: 'application/json' });
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = 'musichub-library-' + new Date().toISOString().split('T')[0] + '.json';
                a.click();
                URL.revokeObjectURL(url);
                if (window.ui) ui.notify('Библиотека экспортирована', 'success');
            });
        }
    };
    
    ExportManager.prototype.exportAsM3U = function(tracks, filename) {
        if (!tracks || tracks.length === 0) return;
        
        var m3uContent = '#EXTM3U\n';
        tracks.forEach(function(track) {
            m3uContent += '#EXTINF:' + (track.duration || 0) + ',' + (track.artist || 'Unknown') + ' - ' + (track.title || 'Untitled') + '\n';
            m3uContent += track.file || track.url || track.title + '.mp3\n';
        });
        
        var blob = new Blob([m3uContent], { type: 'audio/x-mpegurl' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename || 'playlist.m3u';
        a.click();
        URL.revokeObjectURL(url);
        
        if (window.ui) ui.notify('Плейлист экспортирован', 'success');
    };
    
    window.exportManager = new ExportManager();
})();
