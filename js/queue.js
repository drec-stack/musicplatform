(function() {
    'use strict';
    
    function QueueManager() {
        this.queue = [];
        this.currentIndex = -1;
        this.shuffle = false;
        this.repeat = 'none';
        this.listeners = {
            queue_change: [],
            shuffle_change: [],
            repeat_change: []
        };
    }
    
    QueueManager.prototype.add = function(track) {
        this.queue.push(track);
        this.emit('queue_change', this.queue);
        return this.queue.length;
    };
    
    QueueManager.prototype.remove = function(index) {
        if (index >= 0 && index < this.queue.length) {
            this.queue.splice(index, 1);
            this.emit('queue_change', this.queue);
        }
    };
    
    QueueManager.prototype.clear = function() {
        this.queue = [];
        this.currentIndex = -1;
        this.emit('queue_change', this.queue);
    };
    
    QueueManager.prototype.next = function() {
        if (this.queue.length === 0) return null;
        
        if (this.repeat === 'one' && this.currentIndex >= 0) {
            return this.queue[this.currentIndex];
        }
        
        if (this.shuffle) {
            var randomIndex = Math.floor(Math.random() * this.queue.length);
            this.currentIndex = randomIndex;
            return this.queue[randomIndex];
        }
        
        if (this.currentIndex < this.queue.length - 1) {
            this.currentIndex++;
            return this.queue[this.currentIndex];
        } else if (this.repeat === 'all') {
            this.currentIndex = 0;
            return this.queue[0];
        }
        
        return null;
    };
    
    QueueManager.prototype.prev = function() {
        if (this.queue.length === 0) return null;
        
        if (this.currentIndex > 0) {
            this.currentIndex--;
            return this.queue[this.currentIndex];
        }
        
        return this.queue[0];
    };
    
    QueueManager.prototype.toggleShuffle = function() {
        this.shuffle = !this.shuffle;
        this.emit('shuffle_change', this.shuffle);
    };
    
    QueueManager.prototype.toggleRepeat = function() {
        if (this.repeat === 'none') this.repeat = 'all';
        else if (this.repeat === 'all') this.repeat = 'one';
        else this.repeat = 'none';
        this.emit('repeat_change', this.repeat);
    };
    
    QueueManager.prototype.getAll = function() {
        return this.queue;
    };
    
    QueueManager.prototype.on = function(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    };
    
    QueueManager.prototype.emit = function(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(function(callback) {
                callback(data);
            });
        }
    };
    
    window.queueManager = new QueueManager();
})();
