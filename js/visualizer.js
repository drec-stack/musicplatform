(function() {
    'use strict';
    
    function Visualizer() {
        this.canvas = null;
        this.ctx = null;
        this.animationId = null;
        this.isActive = false;
        this.bars = 64;
        this.init();
    }
    
    Visualizer.prototype.init = function() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'visualizerCanvas';
        this.canvas.style.cssText = 'position:fixed;bottom:90px;left:0;right:0;height:80px;width:100%;pointer-events:none;z-index:199;opacity:0.4;';
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        
        window.addEventListener('resize', function() { this.resize(); }.bind(this));
        this.resize();
    };
    
    Visualizer.prototype.resize = function() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = 80;
    };
    
    Visualizer.prototype.start = function() {
        if (this.isActive) return;
        this.isActive = true;
        this.animate();
    };
    
    Visualizer.prototype.stop = function() {
        this.isActive = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.clear();
    };
    
    Visualizer.prototype.clear = function() {
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    };
    
    Visualizer.prototype.animate = function() {
        var self = this;
        if (!self.isActive) return;
        
        self.draw();
        self.animationId = requestAnimationFrame(function() { self.animate(); });
    };
    
    Visualizer.prototype.draw = function() {
        if (!this.ctx) return;
        
        var width = this.canvas.width;
        var height = this.canvas.height;
        var barWidth = width / this.bars;
        
        this.ctx.clearRect(0, 0, width, height);
        
        // Проверяем, играет ли музыка
        var isPlaying = window.player ? window.player.playing : false;
        
        for (var i = 0; i < this.bars; i++) {
            var barHeight;
            
            if (isPlaying) {
                // Генерируем случайные высоты для эффекта визуализации
                barHeight = 20 + Math.random() * (height - 40);
            } else {
                barHeight = 5;
            }
            
            var x = i * barWidth;
            var y = height - barHeight;
            
            // Создаём градиент
            var gradient = this.ctx.createLinearGradient(x, y, x, height);
            gradient.addColorStop(0, '#1db954');
            gradient.addColorStop(0.5, '#1ed760');
            gradient.addColorStop(1, '#1aa34a');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(x, y, barWidth - 1, barHeight);
            
            // Добавляем свечение
            this.ctx.shadowBlur = 5;
            this.ctx.shadowColor = '#1db954';
        }
        
        this.ctx.shadowBlur = 0;
    };
    
    // Метод для обновления с реальными аудиоданными (если есть доступ к Web Audio API)
    Visualizer.prototype.connectToAudio = function(audioElement) {
        if (!window.AudioContext && !window.webkitAudioContext) {
            console.warn('Web Audio API not supported');
            return;
        }
        
        try {
            var AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            this.analyser = this.audioContext.createAnalyser();
            this.source = this.audioContext.createMediaElementSource(audioElement);
            
            this.source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            this.analyser.fftSize = 256;
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            
            // Переопределяем draw для использования реальных данных
            this.drawReal = function() {
                if (!this.ctx || !this.isActive) return;
                
                this.analyser.getByteFrequencyData(this.dataArray);
                var width = this.canvas.width;
                var height = this.canvas.height;
                var barWidth = width / this.bars;
                
                this.ctx.clearRect(0, 0, width, height);
                
                for (var i = 0; i < this.bars; i++) {
                    var value = this.dataArray[i] || 0;
                    var barHeight = (value / 255) * height;
                    var x = i * barWidth;
                    var y = height - barHeight;
                    
                    var gradient = this.ctx.createLinearGradient(x, y, x, height);
                    gradient.addColorStop(0, '#1db954');
                    gradient.addColorStop(1, '#1ed760');
                    
                    this.ctx.fillStyle = gradient;
                    this.ctx.fillRect(x, y, barWidth - 1, barHeight);
                }
            }.bind(this);
            
            this.draw = this.drawReal;
            this.start();
        } catch(e) {
            console.warn('Could not connect visualizer:', e);
        }
    };
    
    window.visualizer = new Visualizer();
})();
