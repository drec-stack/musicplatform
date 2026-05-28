(function() {
    'use strict';
    function LibraryManager() {}
    LibraryManager.prototype.getTracks = function(o) {
        var opts=o||{};
        return db.getAllTracks().then(function(t){
            if(opts.source&&opts.source!=='all')t=t.filter(function(tr){return tr.source===opts.source;});
            if(opts.search){var q=opts.search.toLowerCase();t=t.filter(function(tr){return(tr.title&&tr.title.toLowerCase().indexOf(q)!==-1)||(tr.artist&&tr.artist.toLowerCase().indexOf(q)!==-1);});}
            if(opts.sort==='title')t.sort(function(a,b){return(a.title||'').localeCompare(b.title||'');});
            else if(opts.sort==='artist')t.sort(function(a,b){return(a.artist||'').localeCompare(b.artist||'');});
            else if(opts.sort==='playCount')t.sort(function(a,b){return(b.playCount||0)-(a.playCount||0);});
            else t.sort(function(a,b){return b.dateAdded-a.dateAdded;});
            if(opts.limit)t=t.slice(0,opts.limit);
            return t;
        });
    };
    LibraryManager.prototype.getArtists = function() {
        return db.getAllTracks().then(function(t){
            var m={};
            for(var i=0;i<t.length;i++){var a=t[i].artist||'Unknown';if(!m[a])m[a]={name:a,trackCount:0,albums:{}};m[a].trackCount++;if(t[i].album)m[a].albums[t[i].album]=true;}
            var r=[]; for(var k in m){if(m.hasOwnProperty(k)){var al=[];for(var ak in m[k].albums){if(m[k].albums.hasOwnProperty(ak))al.push(ak);}r.push({name:m[k].name,trackCount:m[k].trackCount,albums:al});}} return r;
        });
    };
    LibraryManager.prototype.getAlbums = function() {
        return db.getAllTracks().then(function(t){
            var m={};
            for(var i=0;i<t.length;i++){var key=(t[i].album||'Unknown')+'|||'+(t[i].artist||'Unknown');if(!m[key])m[key]={name:t[i].album||'Unknown',artist:t[i].artist||'Unknown',trackCount:0};m[key].trackCount++;}
            var r=[]; for(var k in m){if(m.hasOwnProperty(k))r.push(m[k]);} return r;
        });
    };
    LibraryManager.prototype.getPlaylists = function() { return db.getAllPlaylists(); };
    LibraryManager.prototype.createPlaylist = function(n,d) { return db.createPlaylist(n,d); };
    LibraryManager.prototype.deletePlaylist = function(id) { return db.deletePlaylist(id); };
    LibraryManager.prototype.addToPlaylist = function(pid,tid) { return db.addTrackToPlaylist(pid,tid); };
    LibraryManager.prototype.getPlaylist = function(id) { return db.getPlaylist(id); };
    LibraryManager.prototype.getPlaylistTracks = function(pid) {
        return db.getPlaylist(pid).then(function(pl){
            if(!pl)return[];
            var ps=[];
            for(var i=0;i<pl.tracks.length;i++){ps.push(db.getTrack(pl.tracks[i]));}
            return Promise.all(ps).then(function(tr){return tr.filter(function(t){return t!==null&&t!==undefined;});});
        });
    };
    LibraryManager.prototype.deleteTrack = function(id) { return db.deleteTrack(id); };
    LibraryManager.prototype.getStats = function() { return db.getStats(); };
    LibraryManager.prototype.search = function(q) { return db.searchTracks(q); };
    LibraryManager.prototype.getRecentTracks = function(l) { return db.getAllTracks().then(function(t){t.sort(function(a,b){return b.dateAdded-a.dateAdded;});return t.slice(0,l||50);}); };
    LibraryManager.prototype.getMostPlayed = function(l) { return db.getAllTracks().then(function(t){t.sort(function(a,b){return(b.playCount||0)-(a.playCount||0);});return t.slice(0,l||50);}); };
    LibraryManager.prototype.getDuplicates = function() {
        return db.getAllTracks().then(function(t){var d=[],s={};for(var i=0;i<t.length;i++){var k=(t[i].title||'').toLowerCase()+'|||'+(t[i].artist||'').toLowerCase();if(s[k])d.push({original:s[k],duplicate:t[i]});else s[k]=t[i];}return d;});
    };
    LibraryManager.prototype.removeDuplicates = function() {
        var s=this; return this.getDuplicates().then(function(d){var ps=[],r=[];for(var i=0;i<d.length;i++){(function(dp){ps.push(db.deleteTrack(dp.duplicate.id).then(function(){r.push(dp.duplicate);}));})(d[i]);}return Promise.all(ps).then(function(){return r;});});
    };
    LibraryManager.prototype.exportLibrary = function() { return db.exportLibrary(); };
    window.library = new LibraryManager();
})();
