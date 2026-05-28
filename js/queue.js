class QueueManager {
    constructor() {
        this.queue = [];
        this.currentIndex = -1;
        this.shuffleMode = false;
        this.repeatMode = 'none';
        this.originalQueue = [];
        this.listeners = [];
        this.loadQueue();
    }

    loadQueue() {
        var saved = storage.get('queue', []);
        if (saved.length > 0) {
            this.queue = saved;
            this.originalQueue = saved.slice();
        }
    }

    saveQueue() {
        storage.set('queue', this.queue.slice(0, 100));
    }

    add(track) {
        this.queue.push(track);
        if (this.shuffleMode) {
            this.originalQueue.push(track);
        }
        this.saveQueue();
        this.notifyListeners('add', track);
    }

    remove(index) {
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
    }

    clear() {
        this.queue = [];
        this.originalQueue = [];
        this.currentIndex = -1;
        this.saveQueue();
        this.notifyListeners('clear');
    }

    getCurrent() {
        if (this.currentIndex >= 0 && this.currentIndex < this.queue.length) {
            return this.queue[this.currentIndex];
        }
        return null;
    }

    getNext() {
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
    }

    getPrevious() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            return this.queue[this.currentIndex];
        }
        if (this.repeatMode === 'all' && this.queue.length > 0) {
            this.currentIndex = this.queue.length - 1;
            return this.queue[this.currentIndex];
        }
        return null;
    }

    toggleShuffle() {
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
    }

    toggleRepeat() {
        var modes = ['none', 'all', 'one'];
        var currentModeIndex = modes.indexOf(this.repeatMode);
        this.repeatMode = modes[(currentModeIndex + 1) % modes.length];
        this.notifyListeners('repeat_change', this.repeatMode);
    }

    shuffleArray(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    }

    getAll() {
        return this.queue;
    }

    on(event, callback) {
        this.listeners.push({ event: event, callback: callback });
    }

    notifyListeners(event, data) {
        for (var i = 0; i < this.listeners.length; i++) {
            if (this.listeners[i].event === event) {
                this.listeners[i].callback(data);
            }
        }
    }
}

window.queueManager = new QueueManager();
