(function() {
    'use strict';

    function UploadManager() {
        this.allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/mp4', 'audio/x-m4a'];
    }

    UploadManager.prototype.uploadFiles = function(files, onProgress) {
        var results = { uploaded: [], failed: [], total: files.length, processed: 0 };
        var self = this;
        var chain = Promise.resolve();

        for (var i = 0; i < files.length; i++) {
            (function(file) {
                chain = chain.then(function() {
                    return self.processFile(file, onProgress).then(function(track) {
                        results.uploaded.push(track);
                        results.processed++;
                    }).catch(function(error) {
                        results.failed.push({ file: file.name, error: error.message });
                        results.processed++;
                    });
                });
            })(files[i]);
        }

        return chain.then(function() { return results; });
    };

    UploadManager.prototype.processFile = function(file, onProgress) {
        var self = this;
        return this.extractMetadata(file).then(function(metadata) {
            var trackData = {
                title: metadata.title || file.name.replace(/\.[^/.]+$/, ''),
                artist: metadata.artist || 'Unknown Artist',
                album: metadata.album || '',
                duration: metadata.duration || 0,
                source: 'local',
                isLocal: true,
                fileType: file.type,
                fileSize: file.size
            };
            return db.addTrack(trackData).then(function(track) {
                var promises = [db.saveAudioFile(track.id, file)];
                if (metadata.picture) {
                    var blob = new Blob([metadata.picture.data], { type: metadata.picture.format });
                    promises.push(db.saveAlbumArt(track.id, blob));
                }
                return Promise.all(promises).then(function() { return track; });
            });
        });
    };

    UploadManager.prototype.extractMetadata = function(file) {
        return new Promise(function(resolve) {
            var metadata = {};
            var audio = new Audio();
            var objectUrl = URL.createObjectURL(file);
            audio.src = objectUrl;

            var resolved = false;
            var finish = function() {
                if (!resolved) {
                    resolved = true;
                    URL.revokeObjectURL(objectUrl);
                    resolve(metadata);
                }
            };

            audio.addEventListener('loadedmetadata', function() {
                metadata.duration = Math.round(audio.duration * 1000);
                finish();
            });

            audio.addEventListener('error', function() {
                finish();
            });

            setTimeout(function() {
                finish();
            }, 3000);
        });
    };

    window.uploadManager = new UploadManager();
})();
