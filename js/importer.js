(function() {
    'use strict';
    function MusicImporter() {}
    MusicImporter.prototype.importFromSpotify = function(token,opts) {
        var r={tracks:[],playlists:[],errors:[]},o=opts||{},s=this;
        function futch(u){return fetch(u,{headers:{'Authorization':'Bearer '+token}}).then(function(r){if(!r.ok)throw new Error('Spotify: '+r.status);return r.json();});}
        var ch=Promise.resolve();
        if(o.importLiked!==false){ch=ch.then(function(){return futch('https://api.spotify.com/v1/me/tracks?limit=50').then(function(d){(d.items||[]).forEach(function(i){var t=i.track;if(!t)return;r.tracks.push({title:t.name,artist:(t.artists||[]).map(function(a){return a.name;}).join(', '),album:t.album?t.album.name:'',duration:t.duration_ms||0,source:'spotify',sourceId:t.id,sourceUrl:t.external_urls?t.external_urls.spotify:null,cover:t.album&&t.album.images&&t.album.images.length?t.album.images[0].url:null});});}).catch(function(e){r.errors.push(e.message);});});}
        return ch.then(function(){return r;});
    };
    MusicImporter.prototype.importFromYouTube = function(key,opts) {
        var r={tracks:[],playlists:[],errors:[]};
        function ea(t){var m=t.match(/^(.+?)\s*[-–—]\s*.+$/);return m?m[1].trim():'Unknown';}
        function et(t){var m=t.match(/^.+?\s*[-–—]\s*(.+)$/);if(m)return m[1].replace(/\s*\(.*?\)\s*$/g,'').replace(/\s*\[.*?\]\s*$/g,'').trim();return t;}
        return fetch('https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&maxResults=50&key='+key).then(function(resp){if(!resp.ok)throw new Error('YouTube: '+resp.status);return resp.json();}).then(function(d){
            var pls=d.items||[],ch=Promise.resolve();
            for(var i=0;i<pls.length;i++){(function(pl){ch=ch.then(function(){return fetch('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId='+pl.id+'&maxResults=50&key='+key).then(function(r2){return r2.json();}).then(function(td){var its=td.items||[],tids=[],tch=Promise.resolve();for(var j=0;j<its.length;j++){(function(it){var title=it.snippet.title;tch=tch.then(function(){return db.addTrack({title:et(title),artist:ea(title),duration:0,source:'youtube',sourceId:it.snippet.resourceId.videoId,sourceUrl:'https://youtube.com/watch?v='+it.snippet.resourceId.videoId}).then(function(t){if(t)tids.push(t.id);});});})(its[j]);}return tch.then(function(){if(tids.length>0){return db.createPlaylist('[YouTube] '+pl.snippet.title,'').then(function(np){var ach=Promise.resolve();for(var k=0;k<tids.length;k++){(function(tid){ach=ach.then(function(){return db.addTrackToPlaylist(np.id,tid);});})(tids[k]);}return ach.then(function(){np.tracks=tids;r.playlists.push(np);});});}});}).catch(function(e){r.errors.push(e.message);});});})(pls[i]);}
            return ch.then(function(){return r;});
        }).catch(function(e){r.errors.push(e.message);return r;});
    };
    MusicImporter.prototype.importFromJSON = function(f) {
        return new Promise(function(res,rej){var r=new FileReader();r.onload=function(e){db.importLibrary(e.target.result).then(function(c){res({importedCount:c});}).catch(rej);};r.onerror=function(){rej(new Error('Read error'));};r.readAsText(f);});
    };
    MusicImporter.prototype.importFromCSV = function(f) {
        return new Promise(function(res,rej){var r=new FileReader();r.onload=function(e){var t=e.target.result,ls=t.split('\n').filter(function(l){return l.trim();}),c=0,ch=Promise.resolve();for(var i=1;i<ls.length;i++){(function(l){var p=l.split(',');if(p.length>=1){ch=ch.then(function(){return db.addTrack({title:(p[0]||'').replace(/"/g,'').trim(),artist:p.length>=2?p[1].replace(/"/g,'').trim():'Unknown',source:'import'}).then(function(){c++;});});}})(ls[i]);}ch.then(function(){res({importedCount:c});}).catch(rej);};r.onerror=function(){rej(new Error('Read error'));};r.readAsText(f);});
    };
    window.importer = new MusicImporter();
})();
