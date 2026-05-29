(function() {
    'use strict';
    
    function UploadManager() {
        this.queue = [];
    }
    
    UploadManager.prototype.uploadFiles = function(files) {
        var filesArray = Array.from(files);
        var uploaded = [];
        var failed = [];
        
        return new Promise(function(resolve) {
            var pending = filesArray.length;
            if (pending === 0) {
                resolve({ uploaded: [], failed: [] });
                return;
            }
            
            filesArray.forEach(function(file) {
                if (!file.type.startsWith('audio/')) {
                    failed.push(file.name);
                    pending--;
                    if (pending === 0) resolve({ uploaded: uploaded, failed: failed });
                    return;
                }
                
                var reader = new FileReader();
                reader.onload = function(e) {
                    var track = {
                        id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                        title: file.name.replace(/\.[^/.]+$/, ''),
                        artist: 'Unknown Artist',
                        duration: 180,
                        source: 'local',
                        favorite: false,
                        dateAdded: Date.now(),
                        size: file.size,
                        file: e.target.result
                    };
                    
                    db.saveTrack(track).then(function() {
                        uploaded.push(track);
                        pending--;
                        if (pending === 0) resolve({ uploaded: uploaded, failed: failed });
                    }).catch(function() {
                        failed.push(file.name);
                        pending--;
                        if (pending === 0) resolve({ uploaded: uploaded, failed: failed });
                    });
                };
                
                reader.onerror = function() {
                    failed.push(file.name);
                    pending--;
                    if (pending === 0) resolve({ uploaded: uploaded, failed: failed });
                };
                
                reader.readAsDataURL(file);
            });
        });
    };
    
    window.uploadManager = new UploadManager();
})();
