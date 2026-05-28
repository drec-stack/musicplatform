(function() {
    'use strict';
    function StorageManager() {
        this.prefix = 'musichub_';
        this.cache = {};
        this.ok = false;
        try { var t='__t__'; localStorage.setItem(t,t); localStorage.removeItem(t); this.ok=true; } catch(e) {}
        if (this.ok) this.loadAll();
    }
    StorageManager.prototype.loadAll = function() {
        var keys = ['settings','connected_services','play_history','favorites','queue','spotify_auth','spotify_auth_state','youtube_config','soundcloud_config','current_page'];
        var self = this;
        for (var i=0;i<keys.length;i++) {
            (function(k){ try { var r=localStorage.getItem(self.prefix+k); if(r) self.cache[k]=JSON.parse(r); } catch(e){} })(keys[i]);
        }
    };
    StorageManager.prototype.get = function(k,d) {
        if (this.cache.hasOwnProperty(k)) { var v=this.cache[k]; return (v!==null&&v!==undefined)?v:(d!==undefined?d:null); }
        if (this.ok) { try { var r=localStorage.getItem(this.prefix+k); if(r){ var p=JSON.parse(r); this.cache[k]=p; return p; } } catch(e){} }
        return d!==undefined?d:null;
    };
    StorageManager.prototype.set = function(k,v) { this.cache[k]=v; if(this.ok){ try{localStorage.setItem(this.prefix+k,JSON.stringify(v));}catch(e){} } };
    StorageManager.prototype.remove = function(k) { delete this.cache[k]; if(this.ok) localStorage.removeItem(this.prefix+k); };
    StorageManager.prototype.addToHistory = function(t) {
        var h=this.get('play_history',[]);
        h.unshift({id:t.id,title:t.title,artist:t.artist,album:t.album||'',cover:t.cover||null,duration:t.duration||0,source:t.source,isLocal:t.isLocal||false,timestamp:Date.now()});
        if(h.length>500)h.length=500;
        this.set('play_history',h);
    };
    StorageManager.prototype.isFavorite = function(id,src) { var f=this.get('favorites',[]); for(var i=0;i<f.length;i++){if(f[i].id===id&&f[i].source===src)return true;} return false; };
    StorageManager.prototype.addToFavorites = function(t) {
        var f=this.get('favorites',[]);
        for(var i=0;i<f.length;i++){if(f[i].id===t.id&&f[i].source===t.source)return false;}
        f.unshift({id:t.id,title:t.title,artist:t.artist,cover:t.cover||null,duration:t.duration||0,source:t.source,addedAt:Date.now()});
        this.set('favorites',f); return true;
    };
    StorageManager.prototype.removeFromFavorites = function(id,src) {
        var f=this.get('favorites',[]), n=[];
        for(var i=0;i<f.length;i++){if(!(f[i].id===id&&f[i].source===src))n.push(f[i]);}
        this.set('favorites',n);
    };
    window.storage = new StorageManager();
})();
