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
        const saved = storage.get('queue', []);
        if (saved.length > 0) {
            this.queue = saved;
            this.originalQueue = [...saved];
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

    addNext(track) {
        const insertIndex = this.currentIndex + 1;
        this.queue.splice(insertIndex, 0, track);
        if (this.shuffleMode) {
            const originalIndex = this.originalQueue.indexOf(this.queue[this.currentIndex]);
            this.originalQueue.splice(originalIndex + 1, 0, track);
        }
        this.saveQueue();
        this.notifyListeners('add_next', track);
    }

    remove(index) {
        if (index >= 0 && index < this.queue.length) {
            const removed = this.queue[index];
            this.queue.splice(index, 1);
            if (this.shuffleMode) {
                const originalIndex = this.originalQueue.indexOf(removed);
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

        let nextIndex = this.currentIndex + 1;

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
            this.originalQueue = [...this.queue];
            this.shuffleArray(this.queue);
            this.currentIndex = this.queue.indexOf(this.getCurrent());
        } else {
            const current = this.getCurrent();
            this.queue = [...this.originalQueue];
            this.currentIndex = this.queue.indexOf(current);
        }
        this.notifyListeners('shuffle_change', this.shuffleMode);
    }

    toggleRepeat() {
        const modes = ['none', 'all', 'one'];
        const currentModeIndex = modes.indexOf(this.repeatMode);
        this.repeatMode = modes[(currentModeIndex + 1) % modes.length];
        this.notifyListeners('repeat_change', this.repeatMode);
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    getAll() {
        return this.queue;
    }

    getUpcoming() {
        return this.queue.slice(this.currentIndex + 1);
    }

    on(event, callback) {
        this.listeners.push({ event, callback });
    }

    notifyListeners(event, data) {
        this.listeners
            .filter(l => l.event === event)
            .forEach(l => l.callback(data));
    }
}

window.queueManager = new QueueManager();
