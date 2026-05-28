(function() {
    'use strict';

    function QueueManager() {
        this.queue = [];
        this.currentIndex = -1;
        this.shuffleMode = false;
        this.repeatMode = 'none';
        this.originalQueue = [];
        this.listeners = [];
        this.loadQueue();
    }

    QueueManager.prototype.loadQueue = function() {
        var saved = storage.get('queue', []);
        if (saved.length > 0) {
            this.queue = saved;
            this.originalQueue = saved.slice();
        }
    };

    QueueManager.prototype.saveQueue = function() {
        storage.set('queue', this.queue.slice(0, 100));
    };

    QueueManager.prototype.add = function(track) {
        this.queue.push(track);
        if (this.shuffleMode) {
            this.originalQueue.push(track);
        }
        this.saveQueue();
        this.notifyListeners('add', track);
    };

    QueueManager.prototype.remove = function(index) {
        if (index >= 0 && index < this.queue.length) {
            var removed = this.queue.splice(index, 1)[0];
            if (this.shuffleMode) {
                var originalIndex = this.originalQueue.indexOf(removed);
                if (originalIndex !== -1) {
                    this.originalQueue.splice(originalIndex, 1);
                }
            }
            if (index < this.currentIndex) {
                this.currentIndex--;
            }
            this.saveQueue();
            this.notifyListeners('remove', removed);
        }
    };

    QueueManager.prototype.clear = function() {
        this.queue = [];
        this.originalQueue = [];
        this.currentIndex = -1;
        this.saveQueue();
        this.notifyListeners('clear');
    };

    QueueManager.prototype.getCurrent = function() {
        if (this.currentIndex >= 0 && this.currentIndex < this.queue.length) {
            return this.queue[this.currentIndex];
        }
        return null;
    };

    QueueManager.prototype.getNext = function() {
        if (this.repeatMode === 'one') {
            return this.getCurrent();
        }
        var nextIndex = this.currentIndex + 1;
        if (nextIndex >= this.queue.length) {
            if (this.repeatMode === 'all') {
                nextIndex = 0;
            } else {
                return null;
            }
        }
        this.currentIndex = nextIndex;
        return this.queue[nextIndex];
    };

    QueueManager.prototype.getPrevious = function() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            return this.queue[this.currentIndex];
        }
        if (this.repeatMode === 'all' && this.queue.length > 0) {
            this.currentIndex = this.queue.length - 1;
            return this.queue[this.currentIndex];
        }
        return null;
    };

    QueueManager.prototype.toggleShuffle = function() {
        this.shuffleMode = !this.shuffleMode;
        if (this.shuffleMode) {
            this.originalQueue = this.queue.slice();
            this.shuffleArray(this.queue);
            var current = this.getCurrent();
            this.currentIndex = this.queue.indexOf(current);
        } else {
            var current = this.getCurrent();
            this.queue = this.originalQueue.slice();
            this.currentIndex = this.queue.indexOf(current);
        }
        this.notifyListeners('shuffle_change', this.shuffleMode);
    };

    QueueManager.prototype.toggleRepeat = function() {
        var modes = ['none', 'all', 'one'];
        var currentModeIndex = -1;
        for (var i = 0; i < modes.length; i++) {
            if (modes[i] === this.repeatMode) {
                currentModeIndex = i;
                break;
            }
        }
        this.repeatMode = modes[(currentModeIndex + 1) % modes.length];
        this.notifyListeners('repeat_change', this.repeatMode);
    };

    QueueManager.prototype.shuffleArray = function(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    };

    QueueManager.prototype.getAll = function() {
        return this.queue;
    };

    QueueManager.prototype.on = function(event, callback) {
        this.listeners.push({ event: event, callback: callback });
    };

    QueueManager.prototype.notifyListeners = function(event, data) {
        for (var i = 0; i < this.listeners.length; i++) {
            if (this.listeners[i].event === event) {
                this.listeners[i].callback(data);
            }
        }
    };

    window.queueManager = new QueueManager();
})();
