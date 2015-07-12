(function() {
    
function def(obj, prop, val) {
    obj[prop] = (obj[prop] || val);
}

function Grid(options) {

    options = (options || {});
    def(options, "w", 500);
    def(options, "h", 500);
    def(options, "spacing", 5);
    def(options, "offsetX", 1);
    def(options, "offsetY", 1);
    var w = options.w, h = options.h, spacing = options.spacing;

    var canvas = document.createElement("canvas"),
        ctx = canvas.getContext("2d");

    this.canvas = canvas;
    this.ctx = ctx;
    this.options = options;

    this.cycleX = spacing*2 * 5;
    this.cycleY = spacing*2 * 5;

    document.body.insertBefore(canvas, document.body.firstElementChild);

    this._draw();
    return this;
}

Grid.prototype = {
    _draw: function() {
        var ctx = this.ctx, canvas = this.canvas;
        var w = this.options.w, h = this.options.h, spacing = this.options.spacing,
            offsetX = this.options.offsetX % this.cycleX, offsetY = this.options.offsetY % this.cycleY;

        canvas.width = w*2+2;
        canvas.height= h*2+2;

        canvas.style.width = w + 1 + "px";
        canvas.style.height = h + 1 + "px";

        ctx.strokeStyle = 'rgba(24, 182, 248, 0.3)';

        for (var i=offsetX,ii=w*2+1;i<=ii;i+=spacing*2) {
            ctx.lineWidth = Math.round((i-1)/(spacing*2)) % 5 ? 1 : 2;
            ctx.beginPath();
            ctx.moveTo(i,1);
            ctx.lineTo(i,h*2+1);
            ctx.stroke();
        }

        for (var i=offsetY,ii=h*2+1;i<=ii;i+=spacing*2) {
            ctx.lineWidth = Math.round((i-1)/(spacing*2)) % 5 ? 1 : 2;
            ctx.beginPath();
            ctx.moveTo(1,i);
            ctx.lineTo(w*2+1,i);
            ctx.stroke();
        }
    },
    reset: function() {
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    },
    option: function(prop, value) {
        if (arguments.length === 1) return this.options[prop];
        this.options[prop] = value;
    }
};

log(window.innerWidth + "x" + window.innerHeight);

var grid = new Grid({
    w: window.innerWidth-2,
    h: window.innerHeight-2,
    spacing: 5
});

function refresh() {
    grid.reset();
    grid._draw.apply(grid, arguments);
}

function move() {
    animate(function() {
        grid.options.offsetX++;
    });
}

function animate(action, timeout) {
    function doAnimate() {
        action();
        grid.reset();
        grid._draw();
        cancelId = requestAnimationFrame(doAnimate);
    }
    var cancelId;
    doAnimate();
    if (timeout !== null) {
        setTimeout(function() {
            cancelAnimationFrame(cancelId);
        }, timeout || 5000);
    }
}

window.on("resize", function() {
    grid.option("w", window.innerWidth-2);
    grid.option("h", window.innerHeight-2);
    grid.reset();
    grid._draw();
}, false); 

})();