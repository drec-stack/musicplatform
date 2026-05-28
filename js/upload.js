(function() {
    'use strict';
    function UploadManager() { this.types=['audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/ogg','audio/flac','audio/aac','audio/mp4','audio/x-m4a']; }
    UploadManager.prototype.uploadFiles = function(files,cb) {
        var r={uploaded:[],failed:[],total:files.length},s=this,ch=Promise.resolve();
        for(var i=0;i<files.length;i++){(function(f){ch=ch.then(function(){return s.process(f,cb).then(function(t){r.uploaded.push(t);}).catch(function(e){r.failed.push({file:f.name,error:e.message});});});})(files[i]);}
        return ch.then(function(){return r;});
    };
    UploadManager.prototype.process = function(f,cb) {
        var s=this;
        return this.meta(f).then(function(m){
            var d={title:m.title||f.name.replace(/\.[^/.]+$/,''),artist:m.artist||'Unknown Artist',album:m.album||'',duration:m.duration||0,source:'local',isLocal:true,fileType:f.type,fileSize:f.size};
            return db.addTrack(d).then(function(t){var ps=[db.saveAudioFile(t.id,f)];if(m.picture){var b=new Blob([m.picture.data],{type:m.picture.format});ps.push(db.saveAlbumArt(t.id,b));}return Promise.all(ps).then(function(){return t;});});
        });
    };
    UploadManager.prototype.meta = function(f) {
        return new Promise(function(res){
            var m={},a=new Audio(),u=URL.createObjectURL(f);a.src=u;var done=false;
            var fin=function(){if(!done){done=true;URL.revokeObjectURL(u);res(m);}};
            a.addEventListener('loadedmetadata',function(){m.duration=Math.round(a.duration*1000);fin();});
            a.addEventListener('error',fin); setTimeout(fin,3000);
        });
    };
    window.uploadManager = new UploadManager();
})();
