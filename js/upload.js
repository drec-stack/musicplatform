class UploadManager {
    constructor() {
        this.allowedTypes = [
            'audio/mpeg',
            'audio/mp3',
            'audio/wav',
            'audio/x-wav',
            'audio/ogg',
            'audio/flac',
            'audio/aac',
            'audio/mp4',
            'audio/x-m4a'
        ];
        
        this.allowedExtensions = [
            '.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a'
        ];
    }

    async uploadFiles(files, onProgress) {
        const results = {
            uploaded: [],
            failed: [],
            total: files.length,
            processed: 0
        };

        for (const file of files) {
            try {
                const track = await this.processFile(file, (progress) => {
                    if (onProgress) {
                        onProgress({
                            file: file.name,
                            progress,
                            overall: results.processed / results.total
                        });
                    }
                });
                
                results.uploaded.push(track);
            } catch (error) {
                results.failed.push({
                    file: file.name,
                    error: error.message
                });
            }
            
            results.processed++;
        }

        return results;
    }

    async processFile(file, onProgress) {
        if (onProgress) onProgress(0);

        if (!this.allowedTypes.includes(file.type)) {
            const ext = '.' + file.name.split('.').pop().toLowerCase();
            if (!this.allowedExtensions.includes(ext)) {
                throw new Error(`Unsupported format: ${file.type || ext}`);
            }
        }

        if (onProgress) onProgress(10);

        const metadata = await this.extractMetadata(file);
        
        if (onProgress) onProgress(30);

        const trackData = {
            title: metadata.title || file.name.replace(/\.[^/.]+$/, ''),
            artist: metadata.artist || 'Unknown Artist',
            album: metadata.album || '',
            duration: metadata.duration || 0,
            source: 'local',
            sourceId: `upload-${Date.now()}`,
            isLocal: true,
            fileType: file.type,
            fileSize: file.size
        };

        const track = await db.addTrack(trackData);
        
        if (onProgress) onProgress(50);

        await db.saveAudioFile(track.id, file);
        
        if (onProgress) onProgress(80);

        if (metadata.cover) {
            const coverBlob = await this.fetchImageAsBlob(metadata.cover);
            if (coverBlob) {
                await db.saveAlbumArt(track.id, coverBlob);
            }
        } else if (metadata.picture) {
            const blob = new Blob([metadata.picture.data], { type: metadata.picture.format });
            await db.saveAlbumArt(track.id, blob);
        }

        if (onProgress) onProgress(100);

        return track;
    }

    async extractMetadata(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const buffer = e.target.result;
                const metadata = {};
                
                if (file.type === 'audio/mpeg' || file.name.endsWith('.mp3')) {
                    const tags = this.parseID3Tags(buffer);
                    Object.assign(metadata, tags);
                }

                const audio = new Audio();
                const objectUrl = URL.createObjectURL(file);
                audio.src = objectUrl;
                
                audio.addEventListener('loadedmetadata', () => {
                    metadata.duration = Math.round(audio.duration * 1000);
                    URL.revokeObjectURL(objectUrl);
                    resolve(metadata);
                });
                
                audio.addEventListener('error', () => {
                    URL.revokeObjectURL(objectUrl);
                    resolve(metadata);
                });

                setTimeout(() => {
                    if (!metadata.duration) {
                        URL.revokeObjectURL(objectUrl);
                        resolve(metadata);
                    }
                }, 3000);
            };
            
            reader.readAsArrayBuffer(file.slice(0, 128 * 1024));
        });
    }

    parseID3Tags(buffer) {
        const tags = {};
        const view = new DataView(buffer);
        const textDecoder = new TextDecoder('utf-8');
        
        try {
            if (view.getUint8(0) === 0x49 && view.getUint8(1) === 0x44 && view.getUint8(2) === 0x33) {
                let offset = 10;
                const size = this.syncSafeToInt(view.getUint32(6));
                const end = Math.min(offset + size, buffer.byteLength);
                
                while (offset < end - 10) {
                    const frameId = String.fromCharCode(
                        view.getUint8(offset),
                        view.getUint8(offset + 1),
                        view.getUint8(offset + 2),
                        view.getUint8(offset + 3)
                    );
                    
                    const frameSize = view.getUint32(offset + 4);
                    
                    if (frameSize === 0 || frameSize > 1024 * 1024) break;
                    
                    const frameStart = offset + 10;
                    const frameData = buffer.slice(frameStart, frameStart + frameSize);
                    
                    switch(frameId) {
                        case 'TIT2':
                            tags.title = this.decodeID3Text(frameData);
                            break;
                        case 'TPE1':
                            tags.artist = this.decodeID3Text(frameData);
                            break;
                        case 'TALB':
                            tags.album = this.decodeID3Text(frameData);
                            break;
                        case 'APIC':
                            const picData = this.extractAPIC(frameData);
                            if (picData) tags.picture = picData;
                            break;
                    }
                    
                    offset += 10 + frameSize;
                }
            }
        } catch (e) {
            console.error('ID3 parsing error:', e);
        }
        
        return tags;
    }

    decodeID3Text(data) {
        try {
            const view = new DataView(data);
            const encoding = view.getUint8(0);
            const textData = data.slice(encoding === 1 || encoding === 2 ? 3 : 1);
            
            if (encoding === 1) {
                return new TextDecoder('utf-16').decode(textData).replace(/\0/g, '');
            }
            
            return new TextDecoder('utf-8').decode(textData).replace(/\0/g, '');
        } catch (e) {
            return '';
        }
    }

    extractAPIC(data) {
        try {
            const view = new DataView(data);
            let offset = 1;
            
            const mimeEnd = Array.from(new Uint8Array(data.slice(offset, offset + 20)))
                .indexOf(0);
            
            if (mimeEnd === -1) return null;
            
            const mimeType = new TextDecoder().decode(data.slice(offset, offset + mimeEnd));
            offset += mimeEnd + 1;
            
            offset += 1;
            
            const imageData = data.slice(offset);
            
            return {
                data: imageData,
                format: mimeType
            };
        } catch (e) {
            return null;
        }
    }

    syncSafeToInt(value) {
        return (value & 0x7f) << 21 |
               (value & 0x7f00) << 7 |
               (value & 0x7f0000) >> 7 |
               (value & 0x7f000000) >> 21;
    }

    async fetchImageAsBlob(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) return null;
            return await response.blob();
        } catch {
            return null;
        }
    }

    async uploadFolder(files, onProgress) {
        const audioFiles = Array.from(files).filter(file => {
            const ext = '.' + file.name.split('.').pop().toLowerCase();
            return this.allowedExtensions.includes(ext) || 
                   this.allowedTypes.includes(file.type);
        });

        return this.uploadFiles(audioFiles, onProgress);
    }
}

window.uploadManager = new UploadManager();
