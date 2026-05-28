(function() {
    'use strict';
    function PlayerManager() { this.audio=null; this.track=null; this.playing=false; this.volume=0.7; this.timer=null; this.events=[]; }
    PlayerManager.prototype.init = function() {
        this.audio=new Audio(); this.audio.volume=this.volume; var s=this;
        this.audio.addEventListener('play',function(){s.playing=true;s.startTimer();s.emit('play');});
        this.audio.addEventListener('pause',function(){s.playing=false;s.stopTimer();s.emit('pause');});
        this.audio.addEventListener('ended',function(){s.playing=false;s.stopTimer();s.emit('ended');});
        this.audio.addEventListener('error',function(e){s.emit('error',e);});
    };
    PlayerManager.prototype.play = function(t) {
        if(!t)return; if(this.track&&this.track.id===t.id){this.toggle();return;} this.track=t; var s=this;
        var pu=function(u){s.audio.src=u;s.audio.play().catch(function(){});s.afterPlay();};
        if(t.isLocal){db.getAudioFile(t.id).then(function(f){if(f&&f.blob)pu(URL.createObjectURL(f.blob));else s.emit('no_source');}).catch(function(){s.emit('no_source');});}
        else if(t.preview)pu(t.preview);
        else if(t.streamUrl)pu(t.streamUrl+'?client_id='+(services.items.soundcloud.clientId||''));
        else if(t.sourceUrl)pu(t.sourceUrl);
        else this.emit('no_source');
    };
    PlayerManager.prototype.afterPlay = function() {
        if(this.track&&this.track.id){db.getTrack(this.track.id).then(function(tr){if(tr)db.updateTrack(tr.id,{playCount:(tr.playCount||0)+1,lastPlayed:Date.now()});}).catch(function(){});}
        storage.addToHistory(this.track); this.emit('track_change',this.track);
    };
    PlayerManager.prototype.toggle = function() { if(!this.audio)return; if(this.playing)this.audio.pause();else this.audio.play().catch(function(){}); };
    PlayerManager.prototype.seek = function(t) { if(this.audio)this.audio.currentTime=t; };
    PlayerManager.prototype.getTime = function() { return this.audio?this.audio.currentTime:0; };
    PlayerManager.prototype.getDuration = function() { return this.audio?this.audio.duration:0; };
    PlayerManager.prototype.getProgress = function() { return(this.audio&&this.audio.duration)?this.audio.currentTime/this.audio.duration:0; };
    PlayerManager.prototype.setVolume = function(v) { this.volume=Math.max(0,Math.min(1,v)); if(this.audio)this.audio.volume=this.volume; this.emit('volume_change',this.volume); };
    PlayerManager.prototype.startTimer = function() { this.stopTimer(); var s=this; this.timer=setInterval(function(){s.emit('progress',{currentTime:s.getTime(),duration:s.getDuration(),progress:s.getProgress()});},200); };
    PlayerManager.prototype.stopTimer = function() { if(this.timer){clearInterval(this.timer);this.timer=null;} };
    PlayerManager.prototype.on = function(e,c) { this.events.push({e:e,cb:c}); };
    PlayerManager.prototype.emit = function(e,d) { for(var i=0;i<this.events.length;i++){if(this.events[i].e===e)this.events[i].cb(d);} };
    PlayerManager.prototype.fmt = function(s) { if(!s||isNaN(s))return'0:00'; var m=Math.floor(s/60),sec=Math.floor(s%60); return m+':'+(sec<10?'0':'')+sec; };
    window.player = new PlayerManager();
})();
