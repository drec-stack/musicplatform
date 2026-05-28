(function() {
    'use strict';
    function QueueManager() {
        this.list=[]; this.idx=-1; this.shuffle=false; this.repeat='none'; this.orig=[]; this.events=[];
        var s=storage.get('queue',[]); if(s.length){this.list=s;this.orig=s.slice();}
    }
    QueueManager.prototype.save = function() { storage.set('queue',this.list.slice(0,100)); };
    QueueManager.prototype.add = function(t) { this.list.push(t); if(this.shuffle)this.orig.push(t); this.save(); this.emit('add',t); };
    QueueManager.prototype.clear = function() { this.list=[]; this.orig=[]; this.idx=-1; this.save(); this.emit('clear'); };
    QueueManager.prototype.current = function() { return(this.idx>=0&&this.idx<this.list.length)?this.list[this.idx]:null; };
    QueueManager.prototype.next = function() {
        if(this.repeat==='one')return this.current();
        var ni=this.idx+1;
        if(ni>=this.list.length){if(this.repeat==='all')ni=0;else return null;}
        this.idx=ni; return this.list[ni];
    };
    QueueManager.prototype.prev = function() {
        if(this.idx>0){this.idx--;return this.list[this.idx];}
        if(this.repeat==='all'&&this.list.length>0){this.idx=this.list.length-1;return this.list[this.idx];}
        return null;
    };
    QueueManager.prototype.toggleShuffle = function() {
        this.shuffle=!this.shuffle;
        if(this.shuffle){this.orig=this.list.slice();var c=this.current();this.shuffleArr(this.list);this.idx=this.list.indexOf(c);}
        else{var c=this.current();this.list=this.orig.slice();this.idx=this.list.indexOf(c);}
        this.emit('shuffle_change',this.shuffle);
    };
    QueueManager.prototype.toggleRepeat = function() {
        var m=['none','all','one'],ci=0; for(var i=0;i<m.length;i++){if(m[i]===this.repeat){ci=i;break;}}
        this.repeat=m[(ci+1)%m.length]; this.emit('repeat_change',this.repeat);
    };
    QueueManager.prototype.shuffleArr = function(a) { for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;} };
    QueueManager.prototype.getAll = function() { return this.list; };
    QueueManager.prototype.on = function(e,c) { this.events.push({e:e,cb:c}); };
    QueueManager.prototype.emit = function(e,d) { for(var i=0;i<this.events.length;i++){if(this.events[i].e===e)this.events[i].cb(d);} };
    window.queueManager = new QueueManager();
})();
