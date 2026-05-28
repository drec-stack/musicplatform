(function() {
    'use strict';
    
    function Visualizer() {
        this.canvas = null;
        this.ctx = null;
        this.audioContext = null;
        this.source = null;
        this.analyser = null;
        this.animationId = null;
        this.isActive = false;
        this.bars = 64;
        this.init();
    }
    
    Visualizer.prototype.init = function() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'visualizer-canvas';
        this.canvas.style.cssText = 'position:fixed;bottom:80px;left:0;width:100%;height:80px;z-index:5;pointer-events:none;opacity:0.25;';
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        
        this.resize();
        window.addEventListener('resize', function() { this.resize(); }.bind(this));
    };
    
    Visualizer.prototype.resize = function() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = 80;
    };
    
    Visualizer.prototype.connect = function(audioElement) {
        if (!window.AudioContext && !window.webkitAudioContext) return;
        if (this.audioContext) this.disconnect();
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.source = this.audioContext.createMediaElementSource(audioElement);
            this.source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            this.isActive = true;
            this.animate();
        } catch(e) {}
    };
    
    Visualizer.prototype.disconnect = function() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (this.audioContext) this.audioContext.close();
        this.isActive = false;
        this.clearCanvas();
    };
    
    Visualizer.prototype.clearCanvas = function() {
        if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    };
    
    Visualizer.prototype.animate = function() {
        if (!this.isActive || !this.analyser) return;
        
        var dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        var barWidth = this.canvas.width / this.bars;
        var x = 0;
        
        for (var i = 0; i < this.bars; i++) {
            var value = dataArray[i] || 0;
            var percent = value / 255;
            var height = percent * this.canvas.height;
            var hue = 260 + percent * 100;
            
            this.ctx.fillStyle = 'hsl(' + hue + ', 70%, 60%)';
            this.ctx.fillRect(x, this.canvas.height - height, barWidth - 1, height);
            x += barWidth;
        }
        
        this.animationId = requestAnimationFrame(function() { this.animate(); }.bind(this));
    };
    
    window.visualizer = new Visualizer();
})();
