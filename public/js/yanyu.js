var canvas = document.getElementsByTagName("canvas")[0],
    c = canvas.getContext("2d"), s, S;

var audio = new Audio("/public/Gary Jules - Mad World.mp3");
// audio.onprogress = function(e) { console.log(e.timeStamp); }

function play() {
  audio.play();
  canvas.style.transition = "opacity 1s";
  canvas.style.opacity = 0;
  document.body.style.animation = "panorama 60s";
}

function positionCanvas() {
  s = Math.min(innerHeight, innerWidth);
  // s = s - (s % 100);
  // s = 800;
  canvas.style.height = canvas.style.width = s + "px";
  s = s * devicePixelRatio;
  canvas.setAttribute("width", s);
  canvas.setAttribute("height", s);
}

function drawFunc(func) {
  return function(o) {
    c.strokeStyle = o.color || "black";
    c.lineWidth = o.lineWidth || 1;
    func(o);
  }
}

Shapes = {
  line: drawFunc(function(o) {
    var x1 = o.x1, x2 = o.x2, y1 = o.y1, y2 = o.y2;
    if (o.squares) {
      x1 = x1*S;
      y1 = y1*S;
      x2 = x2*S;
      y2 = y2*S;
    }
    c.beginPath();
    c.moveTo(x1,y1);
    c.lineTo(x2,y2);
    c.stroke();
  }),

  plus: drawFunc(function(o) {
    var left = o.left, width = o.width, top = o.top, height = o.height;
    Shapes.line({ x1: left + width/2, x2: left + width/2, y1: top, y2: top + height, color: o.color });
    Shapes.line({ x1: left, x2: left + width, y1: top + height/2, y2: top + height/2, color: o.color });
  }),

  deepPlus: drawFunc(function(o) {
    var left = o.left, width = o.width, top = o.top, height = o.height, minSize = o.minSize || 50;
    if (width/2 < minSize || height/2 < minSize) {
      S = width;
      return;
    }

    Shapes.plus({ top: top, left: left, height: height, width: width, color: o.color });
    Shapes.deepPlus({ top: top, left: left, height: height/2, width: width/2, minSize: minSize, color: o.color });
    Shapes.deepPlus({ top: top, left: left + width/2, height: height/2, width: width/2, minSize: minSize, color: o.color });
    Shapes.deepPlus({ top: top + height/2, left: left, height: height/2, width: width/2, minSize: minSize, color: o.color });
    Shapes.deepPlus({ top: top + height/2, left: left + width/2, height: height/2, width: width/2, minSize: minSize, color: o.color });
  }),

  rectangle: drawFunc(function(o) {
    var left = o.left, width = o.width, top = o.top, height = o.height;
    Shapes.line({ x1: left, y1: top, x2: left + width, y2: top });
    Shapes.line({ x1: left + width, y1: top, x2: left + width, y2: top + height });
    Shapes.line({ x1: left + width, y1: top + height, x2: left, y2: top + height });
    Shapes.line({ x1: left, y1: top + height, x2: left, y2: top });
  }),

  fill: function(o) {
    var left = o.left, width = o.width, top = o.top, height = o.height, color = o.color;
    c.beginPath();
    c.moveTo(left, top);
    c.lineTo(left + width, top);
    c.lineTo(left + width, top + height);
    c.lineTo(left, top + height);
    c.closePath();
    c.fillStyle = color;
    c.fill();
  },

  path: function(o) {
    c.beginPath();
    c.moveTo(o.points[0][0], o.points[0][1]);
    for (var i=1, ii = o.points.length; i<ii; i++) {
      c.lineTo(o.points[i][0], o.points[i][1]);
    }
    c.closePath();
    c.fillStyle = o.color;
    c.fill();
  },

  circle: function(o) {
    c.beginPath();
    // c.moveTo(o.center[0], o.center[1]);
    c.arc(o.center[0], o.center[1], o.radius, 0, 2*Math.PI);
    c.fillStyle = o.color;
    c.fill();
  },

  arc: function(o) {
    c.beginPath();
    c.arc(o.center[0], o.center[1], o.radius, o.a1, o.a2, o.antiClockwise);
    c.closePath();
    c.fillStyle = o.color;
    c.fill();
  },

  text: function(o) {
    c.fillStyle = o.color;
    c.font = o.font;
    c.fillText(o.text, o.x, o.y);
  }

}

function draw() {
  c.clearRect(0,0,s,s);
  state.forEach(function(shape) {
    Shapes[shape.type](shape);
  });
  requestAnimationFrame(draw);
}

Object.keys(Shapes).forEach(function(shape) {
  Shapes[shape].add = function(obj) {
    state.push(Object.assign({ type: shape }, obj));
  }
});

var blue = "#008ED6",
    red = "#E2062C",
    yellow = "#FFE135",
    pink = "#F6ABCC",
    turquise = "#419873",
    darkGreen = "#182C25",
    lightGreen = "#306844",
    white = "#fff";



positionCanvas();
var x = 20;
var state = [
  { type: "circle", center: [0,0], radius: 3, color: "red" },
  { type: "text", text: "amit", x: 930, y: 30, font: "36px 'PT Sans'", color: "black" },
  { type: "deepPlus", top: 0, left: 0, width: s, height: s, minSize: x, color: "#cccccc" }
];

draw();
document.addEventListener("mousemove", function(e) {
  var x = e.pageX*devicePixelRatio,
      y = e.pageY*devicePixelRatio;

  x = x - (x % S);
  y = y - (y % S);

  state.splice(0, 2, { type: "circle", center: [x,y], radius: 3, color: "red" }, { type: "text", text: x/S + "x" + y/S, x: 930, y: 30, color: "black", font: "36px 'PT Sans'" });
});
console.log("S=" + S);
var numOfSquares = s / S;
console.log("num of squares=" + numOfSquares);
var fWidth = 32, fHeight = 55,
    fLeft = 0, //(numOfSquares-fWidth)/2,
    fTop =  0; //(numOfSquares-fHeight)/2;

var Frame = {
  fill: function(r) {
    Shapes.fill.add({ top: (fTop + r.top)*S + 1, left: (fLeft + r.left)*S + 1, width: r.width*S - 2, height: r.height*S - 2, color: r.color });
  },

  path: function(o) {
    var points = o.sides.reduce(function(a,b) { return a.concat(b); }, []);
    Shapes.path.add({ color: o.color, points: points });
  },

  arc: function(o) {
    var right = o.right ? (fLeft + o.right)*S - 1: null,
        left = o.left ? (fLeft + o.left)*S + 1: null,
        top = (fTop + o.top)*S,
        height = o.height*S;

    var h = height,
        x1 = right || left,
        y1 = top,
        w = S - 2,
        r = Math.pow(h,2)/(8*w) + w/2,
        x0 = left ? x1 - (r-w) : x1 + (r-w),
        y0 = y1 + h/2,
        alpha = Math.asin(h/(2*r)),
        a1 = left ? -alpha : Math.PI + alpha,
        a2 = left ? alpha : Math.PI - alpha,
        antiClockwise = !!o.right;

    // Shapes.circle.add({ color: "blue", center: [x0, y0], radius: 3 });
    // Shapes.circle.add({ color: "purple", center: [x1, y1], radius: 3 });
    // Shapes.circle.add({ color: "magenta", center: [x1, y1 + h], radius: 3 });

    Shapes.arc.add({ color: o.color, center: [x0,y0], radius: r, a1: a1, a2: a2, antiClockwise: antiClockwise });
  }
}

function hline(p1, p2, vOffset) {
  vOffset = vOffset || 0;
  if (p1[0] < p2[0]) {
    return [ [(fLeft + p1[0])*S + 1, (fTop + p1[1])*S + vOffset], [(fLeft + p2[0])*S - 1, (fTop + p2[1])*S + vOffset] ];
  } else {
    return [ [(fLeft + p1[0])*S - 1, (fTop + p1[1])*S + vOffset], [(fLeft + p2[0])*S + 1, (fTop + p2[1])*S + vOffset] ];
  }
}

function vline(p1, p2, hOffset) {
  hOffset = hOffset || 0;
  if (p1[1] < p2[1]) {
    return [ [(fLeft + p1[0])*S + hOffset, (fTop + p1[1])*S + 1], [(fLeft + p2[0])*S + hOffset, (fTop + p2[1])*S - 1] ];
  } else {
    return [ [(fLeft + p1[0])*S + hOffset, (fTop + p1[1])*S - 1], [(fLeft + p2[0])*S + hOffset, (fTop + p2[1])*S + 1] ];
  }
}

Shapes.rectangle.add({ top: fTop*S, left: fLeft*S, width: fWidth*S, height: fHeight*S }); // 16x30

for (var i=fLeft+1,ii=fLeft + fWidth;i < ii; i++) {
  Shapes.line.add({ y1: fTop*S, x1: i*S, y2: (fTop + fHeight)*S, x2: i*S, color: "brown", lineWidth: 2 });
}

Shapes.line.add({ x1: fLeft*S, x2: (fLeft + fWidth)*S, y1: (fTop + 21)*S, y2: (fTop + 21)*S, color: "brown", lineWidth: 2 });
Shapes.line.add({ x1: fLeft*S, x2: (fLeft + fWidth)*S, y1: (fTop + 39)*S, y2: (fTop + 39)*S, color: "brown", lineWidth: 2 });

Frame.fill({ top: 0, left: 0, width:1, height: 21, color: blue });
Frame.path({
  color: red,
  sides: [
    hline([1,0], [2,0], 1),
    vline([2,0], [2,0.5], -1),
    hline([2,0.5], [1,0.2], -1)
  ]
});

Frame.fill({ top: 2, left: 1, width: 1, height: 3, color: red });

Frame.path({
  color: pink,
  sides: [
      hline([1,12.5], [2,11]),
      vline([2,11], [2,14], -1),
      hline([2,14], [1,12.5])
  ]
});

Frame.fill({ top: 11, left: 2, width: 1, height: 3, color: blue });
Frame.fill({ top: 18.5, left: 2, width: 1, height: 2.5, color: red });
Frame.fill({ top: 19, left: 3, width: 1, height: 2, color: lightGreen });
Frame.fill({ top: 0, left: 4, height: 13.5, width: 1, color: blue });
Frame.fill({ top: 14.5, left: 4, height: 6.5, width: 1, color: blue });

Frame.path({
  color: red,
  sides: [
      hline([5,0], [6,0], 1),
      vline([6,0], [6,1], -1),
      hline([6,1], [5,0.5], -1)
  ]
});

Frame.path({
  color: pink,
  sides: [
    hline([5,10], [6,8.5]),
    vline([6,8,5], [6,18.5], -1),
    hline([6,18.5], [5,16.5])
  ]
});

Frame.path({
  color: darkGreen,
  sides: [
    hline([6,11], [7,11]),
    vline([7,11], [6,14]),
    hline([6,14], [6,11])
  ]
});

Frame.fill({ top: 18.5, left: 6, width: 1, height: 2.5, color: red });
Frame.fill({ top: 19, left: 7, width: 1, height: 2, color: lightGreen });
Frame.fill({ top: 0, left: 8, width: 1, height: 21, color: blue });

Frame.path({
  color: red,
  sides: [
    hline([9,0], [10,0], 1),
    vline([10,0], [10,1.5], -1),
    hline([10,1.5], [9,1], -1)
  ]
});

Frame.fill({ top: 11, left: 9, width: 1, height: 10, color: pink });
Frame.path({
  color: pink,
  sides: [
      hline([9,7.5], [10, 6]),
      vline([10,6], [10,9], -1),
      hline([10,9], [9,9], -1)
  ]
});

Frame.fill({ top: 2, height: 3, width: 1, left: 10, color: yellow });
Frame.fill({ top: 6.5, height: 3, width: 1, left: 10, color: darkGreen });
Frame.fill({ top: 6.5, height: 3, width: 1, left: 11, color: red });

Frame.fill({ top: 18.5, left: 10, width: 1, height: 2.5, color: red });
Frame.fill({ top: 19, left: 11, width: 1, height: 2, color: lightGreen });
Frame.fill({ top: 0, left: 12, width: 1, height: 21, color: blue });

Frame.path({
  color: red,
  sides: [
    hline([13,0], [14,0], 1),
    vline([14,0], [14,2], -1),
    hline([14,2], [13,1.5], -1)
  ]
});

Frame.fill({ top: 6.5, height: 1, width: 1, left: 13, color: turquise });

Frame.arc({ top: 2, right: 3, height: 3, color: red });
Frame.fill({ top: 6, left: 2, height: 4, width: 1, color: red });
Frame.arc({ top: 6, right: 3, height: 4, color: white });

Frame.arc({ top: 2, left: 6, height: 3, color: red });
Frame.fill({ top: 6, left: 6, height: 4, width: 1, color: red });
Frame.arc({ top: 6, left: 6, height: 4, color: white });
Frame.arc({ top: 2, right: 12, height: 3, color: red });
Frame.arc({ top: 6.5, right: 12, height: 3, color: lightGreen });
Frame.arc({ top: 11, right: 11, height: 3, color: red });
Frame.arc({ top: 11, right: 12, height: 3, color: pink });
