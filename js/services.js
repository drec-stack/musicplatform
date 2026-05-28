(function() {
    'use strict';
    function ServicesManager() {
        this.items = {
            spotify: {id:'spotify',name:'Spotify',color:'#1DB954',connected:false},
            youtube: {id:'youtube',name:'YouTube Music',color:'#FF0000',connected:false},
            soundcloud: {id:'soundcloud',name:'SoundCloud',color:'#FF5500',connected:false},
            deezer: {id:'deezer',name:'Deezer',color:'#00C7F2',connected:true}
        };
        this.load();
    }
    ServicesManager.prototype.load = function() {
        var sa=storage.get('spotify_auth'); if(sa&&sa.accessToken&&sa.expiresAt>Date.now()){this.items.spotify.connected=true;this.items.spotify.accessToken=sa.accessToken;}
        var yt=storage.get('youtube_config'); if(yt&&yt.apiKey){this.items.youtube.connected=true;this.items.youtube.apiKey=yt.apiKey;}
        var sc=storage.get('soundcloud_config'); if(sc&&sc.clientId){this.items.soundcloud.connected=true;this.items.soundcloud.clientId=sc.clientId;}
    };
    ServicesManager.prototype.getAll = function() { var r=[]; for(var k in this.items){if(this.items.hasOwnProperty(k))r.push(this.items[k]);} return r; };
    ServicesManager.prototype.connectSpotify = function(cid) {
        var rd=window.location.origin+'/callback.html', sc='streaming user-read-email user-read-private user-library-read playlist-read-private', st='', ch='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for(var i=0;i<16;i++)st+=ch.charAt(Math.floor(Math.random()*ch.length));
        storage.set('spotify_auth_state',st);
        window.location.href='https://accounts.spotify.com/authorize?client_id='+encodeURIComponent(cid)+'&response_type=token&redirect_uri='+encodeURIComponent(rd)+'&scope='+encodeURIComponent(sc)+'&state='+st;
    };
    ServicesManager.prototype.checkSpotifyCallback = function() { var sa=storage.get('spotify_auth'); if(sa&&sa.accessToken&&sa.expiresAt>Date.now()){this.items.spotify.connected=true;this.items.spotify.accessToken=sa.accessToken;return true;} return false; };
    ServicesManager.prototype.connectYouTube = function(k) { storage.set('youtube_config',{apiKey:k}); this.items.youtube.connected=true; this.items.youtube.apiKey=k; };
    ServicesManager.prototype.connectSoundCloud = function(c) { storage.set('soundcloud_config',{clientId:c}); this.items.soundcloud.connected=true; this.items.soundcloud.clientId=c; };
    ServicesManager.prototype.disconnect = function(id) {
        if(id==='spotify'){storage.remove('spotify_auth');this.items.spotify.connected=false;delete this.items.spotify.accessToken;}
        if(id==='youtube'){storage.remove('youtube_config');this.items.youtube.connected=false;delete this.items.youtube.apiKey;}
        if(id==='soundcloud'){storage.remove('soundcloud_config');this.items.soundcloud.connected=false;delete this.items.soundcloud.clientId;}
    };
    window.services = new ServicesManager();
})();
