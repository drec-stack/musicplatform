(function() {
    'use strict';
    
    function ExportManager() {}
    
    ExportManager.prototype.exportAsM3U = function(tracks, filename) {
        filename = filename || ('playlist_' + new Date().toISOString().slice(0,19) + '.m3u');
        var m3u = '#EXTM3U\n';
        
        for (var i = 0; i < tracks.length; i++) {
            var t = tracks[i];
            var duration = Math.floor((t.duration || 0) / 1000);
            var title = (t.artist || 'Unknown') + ' - ' + (t.title || 'Untitled');
            m3u += '#EXTINF:' + duration + ',' + title + '\n';
            
            if (t.isLocal || t.file_path) {
                m3u += '/api/tracks/' + t.id + '/stream\n';
            } else if (t.sourceUrl) {
                m3u += t.sourceUrl + '\n';
            } else if (t.preview) {
                m3u += t.preview + '\n';
            }
        }
        
        this.download(m3u, filename, 'audio/x-mpegurl');
        return true;
    };
    
    ExportManager.prototype.exportAsJSON = function(tracks, filename) {
        filename = filename || ('playlist_' + new Date().toISOString().slice(0,19) + '.json');
        var data = {
            name: filename.replace('.json', ''),
            version: '1.0',
            exportDate: new Date().toISOString(),
            tracks: tracks.map(function(t) {
                return {
                    id: t.id,
                    title: t.title,
                    artist: t.artist,
                    album: t.album,
                    duration: t.duration,
                    source: t.source,
                    sourceId: t.sourceId,
                    sourceUrl: t.sourceUrl
                };
            })
        };
        
        this.download(JSON.stringify(data, null, 2), filename, 'application/json');
        return true;
    };
    
    ExportManager.prototype.exportCurrentQueue = function() {
        var tracks = queueManager.getAll();
        if (!tracks.length) {
            if (window.ui) ui.notify('Queue is empty', 'error');
            return false;
        }
        return this.exportAsM3U(tracks, 'queue_' + new Date().toISOString().slice(0,19) + '.m3u');
    };
    
    ExportManager.prototype.exportLibrary = function() {
        var self = this;
        library.getTracks({}).then(function(tracks) {
            if (!tracks.length) {
                if (window.ui) ui.notify('Library is empty', 'error');
                return;
            }
            self.exportAsM3U(tracks, 'library_' + new Date().toISOString().slice(0,10) + '.m3u');
        });
    };
    
    ExportManager.prototype.download = function(content, filename, mimeType) {
        var blob = new Blob([content], { type: mimeType });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        if (window.ui) ui.notify('Exported ' + filename, 'success');
    };
    
    window.exportManager = new ExportManager();
})();
