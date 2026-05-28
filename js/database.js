(function() {
    'use strict';
    function MusicDatabase() { this.name='MusicHubDB'; this.ver=1; this.db=null; }
    MusicDatabase.prototype.open = function() {
        var self=this;
        return new Promise(function(res,rej){
            if(!window.indexedDB){rej(new Error('No IndexedDB'));return;}
            var r=indexedDB.open(self.name,self.ver);
            r.onupgradeneeded = function(e) {
                var db=e.target.result;
                if(!db.objectStoreNames.contains('tracks')){ var s=db.createObjectStore('tracks',{keyPath:'id'}); s.createIndex('title','title',{unique:false}); s.createIndex('artist','artist',{unique:false}); s.createIndex('source','source',{unique:false}); }
                if(!db.objectStoreNames.contains('playlists')){ var p=db.createObjectStore('playlists',{keyPath:'id'}); p.createIndex('name','name',{unique:false}); }
                if(!db.objectStoreNames.contains('audioFiles')) db.createObjectStore('audioFiles',{keyPath:'trackId'});
                if(!db.objectStoreNames.contains('albumArt')) db.createObjectStore('albumArt',{keyPath:'trackId'});
            };
            r.onsuccess = function(e) { self.db=e.target.result; res(self.db); };
            r.onerror = function(e) { rej(e.target.error); };
        });
    };
    MusicDatabase.prototype.ready = function() { var s=this; if(this.db)return Promise.resolve(this.db); return this.open(); };
    MusicDatabase.prototype.uid = function() { return Date.now().toString(36)+'-'+Math.random().toString(36).substr(2,9); };
    MusicDatabase.prototype.addTrack = function(d) {
        var self=this;
        return this.ready().then(function(db){
            return new Promise(function(res,rej){
                var t=db.transaction(['tracks'],'readwrite'), s=t.objectStore('tracks');
                var tr={id:d.id||self.uid(),title:d.title||'Unknown',artist:d.artist||'Unknown',album:d.album||'',duration:d.duration||0,source:d.source||'local',sourceId:d.sourceId||null,sourceUrl:d.sourceUrl||null,dateAdded:d.dateAdded||Date.now(),playCount:d.playCount||0,tags:d.tags||[],isLocal:d.isLocal||false,fileType:d.fileType||null,fileSize:d.fileSize||0,cover:d.cover||null,preview:d.preview||null,streamUrl:d.streamUrl||null};
                var rq=s.add(tr); rq.onsuccess=function(){res(tr);}; rq.onerror=function(){rej(rq.error);};
            });
        });
    };
    MusicDatabase.prototype.getTrack = function(id) { return this.ready().then(function(db){ return new Promise(function(res,rej){ var t=db.transaction(['tracks'],'readonly'); var rq=t.objectStore('tracks').get(id); rq.onsuccess=function(){res(rq.result);}; rq.onerror=function(){rej(rq.error);}; }); }); };
    MusicDatabase.prototype.getAllTracks = function() { return this.ready().then(function(db){ return new Promise(function(res,rej){ var t=db.transaction(['tracks'],'readonly'); var rq=t.objectStore('tracks').getAll(); rq.onsuccess=function(){res(rq.result||[]);}; rq.onerror=function(){rej(rq.error);}; }); }); };
    MusicDatabase.prototype.updateTrack = function(id,u) {
        var self=this;
        return this.getTrack(id).then(function(tr){
            if(!tr)return null;
            var up={}; for(var k in tr){if(tr.hasOwnProperty(k))up[k]=tr[k];} for(var k in u){if(u.hasOwnProperty(k))up[k]=u[k];}
            return self.ready().then(function(db){ return new Promise(function(res,rej){ var t=db.transaction(['tracks'],'readwrite'); var rq=t.objectStore('tracks').put(up); rq.onsuccess=function(){res(up);}; rq.onerror=function(){rej(rq.error);}; }); });
        });
    };
    MusicDatabase.prototype.deleteTrack = function(id) { return this.ready().then(function(db){ return new Promise(function(res,rej){ var t=db.transaction(['tracks','audioFiles','albumArt'],'readwrite'); t.objectStore('tracks').delete(id); t.objectStore('audioFiles').delete(id); t.objectStore('albumArt').delete(id); t.oncomplete=function(){res(true);}; t.onerror=function(){rej(t.error);}; }); }); };
    MusicDatabase.prototype.saveAudioFile = function(tid,blob) { return this.ready().then(function(db){ return new Promise(function(res,rej){ var t=db.transaction(['audioFiles'],'readwrite'); t.objectStore('audioFiles').put({trackId:tid,blob:blob,added:Date.now()}); t.oncomplete=function(){res(true);}; t.onerror=function(){rej(t.error);}; }); }); };
    MusicDatabase.prototype.getAudioFile = function(tid) { return this.ready().then(function(db){ return new Promise(function(res,rej){ var t=db.transaction(['audioFiles'],'readonly'); var rq=t.objectStore('audioFiles').get(tid); rq.onsuccess=function(){res(rq.result);}; rq.onerror=function(){rej(rq.error);}; }); }); };
    MusicDatabase.prototype.saveAlbumArt = function(tid,blob) { return this.ready().then(function(db){ return new Promise(function(res,rej){ var t=db.transaction(['albumArt'],'readwrite'); t.objectStore('albumArt').put({trackId:tid,blob:blob,added:Date.now()}); t.oncomplete=function(){res(true);}; t.onerror=function(){rej(t.error);}; }); }); };
    MusicDatabase.prototype.getAlbumArt = function(tid) { return this.ready().then(function(db){ return new Promise(function(res,rej){ var t=db.transaction(['albumArt'],'readonly'); var rq=t.objectStore('albumArt').get(tid); rq.onsuccess=function(){res(rq.result);}; rq.onerror=function(){rej(rq.error);}; }); }); };
    MusicDatabase.prototype.createPlaylist = function(name,desc) {
        var self=this;
        return this.ready().then(function(db){ return new Promise(function(res,rej){ var t=db.transaction(['playlists'],'readwrite'); var pl={id:self.uid(),name:name,description:desc||'',tracks:[],created:Date.now(),modified:Date.now()}; var rq=t.objectStore('playlists').add(pl); rq.onsuccess=function(){res(pl);}; rq.onerror=function(){rej(rq.error);}; }); });
    };
    MusicDatabase.prototype.getAllPlaylists = function() { return this.ready().then(function(db){ return new Promise(function(res,rej){ var t=db.transaction(['playlists'],'readonly'); var rq=t.objectStore('playlists').getAll(); rq.onsuccess=function(){res(rq.result||[]);}; rq.onerror=function(){rej(rq.error);}; }); }); };
    MusicDatabase.prototype.getPlaylist = function(id) { return this.ready().then(function(db){ return new Promise(function(res,rej){ var t=db.transaction(['playlists'],'readonly'); var rq=t.objectStore('playlists').get(id); rq.onsuccess=function(){res(rq.result);}; rq.onerror=function(){rej(rq.error);}; }); }); };
    MusicDatabase.prototype.addTrackToPlaylist = function(pid,tid) {
        var self=this;
        return this.getPlaylist(pid).then(function(pl){ if(!pl)return null; if(pl.tracks.indexOf(tid)===-1){ pl.tracks.push(tid); pl.modified=Date.now(); return self.ready().then(function(db){ return new Promise(function(res,rej){ var t=db.transaction(['playlists'],'readwrite'); var rq=t.objectStore('playlists').put(pl); rq.onsuccess=function(){res(pl);}; rq.onerror=function(){rej(rq.error);}; }); }); } return pl; });
    };
    MusicDatabase.prototype.deletePlaylist = function(id) { return this.ready().then(function(db){ return new Promise(function(res,rej){ var t=db.transaction(['playlists'],'readwrite'); t.objectStore('playlists').delete(id); t.oncomplete=function(){res(true);}; t.onerror=function(){rej(t.error);}; }); }); };
    MusicDatabase.prototype.getTrackCount = function() { return this.ready().then(function(db){ return new Promise(function(res,rej){ var t=db.transaction(['tracks'],'readonly'); var rq=t.objectStore('tracks').count(); rq.onsuccess=function(){res(rq.result);}; rq.onerror=function(){rej(rq.error);}; }); }); };
    MusicDatabase.prototype.getStorageUsage = function() { return this.ready().then(function(db){ return new Promise(function(res){ var t=db.transaction(['audioFiles'],'readonly'); var rq=t.objectStore('audioFiles').getAll(); rq.onsuccess=function(){var s=0,f=rq.result||[]; for(var i=0;i<f.length;i++){if(f[i].blob)s+=f[i].blob.size;} res(s);}; rq.onerror=function(){res(0);}; }); }); };
    MusicDatabase.prototype.getStats = function() { var s=this; return Promise.all([s.getTrackCount(),s.getStorageUsage(),s.getAllPlaylists()]).then(function(r){ return {totalTracks:r[0],storageUsage:r[1],totalPlaylists:r[2].length}; }); };
    MusicDatabase.prototype.exportLibrary = function() { var s=this; return Promise.all([s.getAllTracks(),s.getAllPlaylists()]).then(function(r){ return JSON.stringify({version:'1.0',date:new Date().toISOString(),tracks:r[0],playlists:r[1]},null,2); }); };
    MusicDatabase.prototype.importLibrary = function(json) { var s=this,d=JSON.parse(json); if(!d.tracks)return Promise.resolve(0); var c=0,ch=Promise.resolve(); for(var i=0;i<d.tracks.length;i++){(function(tr){ch=ch.then(function(){return s.getTrack(tr.id).then(function(ex){if(!ex)return s.addTrack(tr).then(function(){c++;});});});})(d.tracks[i]);} return ch.then(function(){return c;}); };
    MusicDatabase.prototype.clearAll = function() { return this.ready().then(function(db){ return new Promise(function(res,rej){ var t=db.transaction(['tracks','playlists','audioFiles','albumArt'],'readwrite'); t.objectStore('tracks').clear(); t.objectStore('playlists').clear(); t.objectStore('audioFiles').clear(); t.objectStore('albumArt').clear(); t.oncomplete=function(){res(true);}; t.onerror=function(){rej(t.error);}; }); }); };
    MusicDatabase.prototype.searchTracks = function(q) { return this.getAllTracks().then(function(tr){ var lq=q.toLowerCase(),r=[]; for(var i=0;i<tr.length;i++){var t=tr[i]; if((t.title&&t.title.toLowerCase().indexOf(lq)!==-1)||(t.artist&&t.artist.toLowerCase().indexOf(lq)!==-1)||(t.album&&t.album.toLowerCase().indexOf(lq)!==-1))r.push(t);} return r; }); };
    window.db = new MusicDatabase();
})();
