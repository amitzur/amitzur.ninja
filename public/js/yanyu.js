var canvas = document.getElementsByTagName("canvas")[0],
    c = canvas.getContext("2d"), s, S, w = innerWidth, h = innerHeight;

// var audio = new Audio("/public/Gary Jules - Mad World.mp3");
// audio.onprogress = function(e) { console.log(e.timeStamp); }

function play() {
  audio.play();
  canvas.style.transition = "opacity 1s";
  canvas.style.opacity = 0;
  document.body.style.animation = "panorama 60s";
}

function positionCanvas() {
  // s = Math.min(innerHeight, innerWidth);
  // s = s - (s % 100);
  // s = 800;
  canvas.style.height = h + "px";
  canvas.style.width = w + "px";
  // s = s * devicePixelRatio;
  w = w * devicePixelRatio;
  h = h * devicePixelRatio;
  canvas.setAttribute("width", w);
  canvas.setAttribute("height", h);
}

function drawFunc(func) {
  return function(o) {
    c.strokeStyle = o.color || "black";
    c.lineWidth = o.lineWidth || 1;
    c.globalAlpha = o.opacity !== undefined ? o.opacity : 1.0;
    func(o);
  }
}

function draw() {
  c.clearRect(0,0,s,s);
  state.forEach(function(shape) {
    Shapes[shape.type](shape);
  });
  requestAnimationFrame(draw);
}

function doDrawTimeline() {
  c.clearRect(0,0,w,h);
  var times = Object.keys(timeline), currTime = Date.now()+3000 - start;
  for (var i=times.length-1,ii=0;i>=ii;i--) {
    if (currTime >= times[i]) break;
  }

  var time = times[i], objects = timeline[time];

  objects.forEach(function(obj) {
    if (obj.animation) {
      Object.keys(obj.animation).forEach(function(prop) {
        obj[prop] = interpolate(prop, currTime, obj.animation[prop].from, obj.animation[prop].until, obj.animation[prop].toValue, obj.animation[prop].fromValue);
      });
    }
    Shapes[obj.type](obj);
  });
  requestAnimationFrame(doDrawTimeline);
}

function drawTimeline() {
  start = Date.now();
  doDrawTimeline();
}

function compileAnimation(timeline) {
  var objects = {};
  Object.keys(timeline).forEach(function(time, i) {
    timeline[time].forEach(function(obj) {
      var existingAnimation = objects[obj.id] && objects[obj.id].animation;
      objects[obj.id] = extend(obj, objects[obj.id]);
      if (existingAnimation) {
        Object.keys(existingAnimation).forEach(function(prop) {
          if (existingAnimation[prop].until >= time) {
            obj[prop] = interpolate(prop, time, existingAnimation[prop].from, existingAnimation[prop].until, existingAnimation[prop].toValue, existingAnimation[prop].fromValue);
          }
        });
      }

      animatedProps.forEach(function(prop) {
        var next = findNext(obj, i, prop);
        if (next) {
          obj.animation = obj.animation || {};
          obj.animation[prop] = { toValue: next[0], fromValue: obj[prop], until: next[1], from: time };
        }
      });
    })
  });
}

function findNext(obj, index, prop) {
  var candidate, nextTimes = Object.keys(timeline).slice(index+1);
  for (var i=0,ii=nextTimes.length;i<ii;i++) {
    candidate = timeline[nextTimes[i]].find(function(x) { return x.id === obj.id; });
    if (candidate && candidate[prop] !== undefined) {
      if (candidate[prop] !== obj[prop]) return [candidate[prop], nextTimes[i]];
      else return;
    }
  }
}

function interpolate(prop, point, start, end, toValue, fromValue) {
  var rel = (point - start) / (end - start);

  if (prop === "color") {
    return chroma.mix(fromValue, toValue, rel).hex();
  }

  return fromValue + (toValue - fromValue) * rel;
}

function extend(target, source) {
  if (typeof source !== "object") return target;
  Object.keys(source).forEach(function(prop) {
    if (prop !== "animation" && !target.hasOwnProperty(prop)) {
      target[prop] = source[prop];
    }
  });
  return target;
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
    c.globalAlpha = o.opacity !== undefined ? o.opacity : 1.0;
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
    c.globalAlpha = o.opacity !== undefined ? o.opacity : 1.0;
    c.fill();
  },

  circle: function(o) {
    c.beginPath();
    // c.moveTo(o.center[0], o.center[1]);
    c.arc(o.center[0], o.center[1], o.radius, 0, 2*Math.PI);
    c.fillStyle = o.color;
    c.globalAlpha = o.opacity !== undefined ? o.opacity : 1.0;
    c.fill();
  },

  arc: function(o) {
    c.beginPath();
    c.arc(o.center[0], o.center[1], o.radius, o.a1, o.a2, o.antiClockwise);
    c.closePath();
    c.globalAlpha = o.opacity !== undefined ? o.opacity : 1.0;
    c.fillStyle = o.color;
    c.fill();
  },

  text: function(o) {
    c.fillStyle = o.color;
    c.globalAlpha = o.opacity !== undefined ? o.opacity : 1.0;
    c.font = o.font;
    c.fillText(o.text, o.x, o.y);
  }

}

Object.keys(Shapes).forEach(function(shape) {
  Shapes[shape].add = function(obj, first) {
    state[first ? "unshift" : "push"](Object.assign({ type: shape }, obj));
  }
});

var Frame = {
  fill: function(r) {
    Shapes.fill.add({ top: (fTop + r.top)*S + 1, left: (fLeft + r.left)*S + 1, width: (r.width || 1)*S - 2, height: r.height*S - 2, color: r.color });
  },

  quad: function(q) {
    var points = [
      [(fLeft + q.topLeft[0])*S + 1, (fTop + q.topLeft[1])*S],
      [(fLeft + q.topRight[0])*S - 1, (fTop + q.topRight[1])*S],
      [(fLeft + q.bottomRight[0])*S - 1, (fTop + q.bottomRight[1])*S],
      [(fLeft + q.bottomLeft[0])*S + 1, (fTop + q.bottomLeft[1])*S]
    ];
    Shapes.path.add({ color: q.color, points: points });
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
        w = (o.width || 1)*S - 2,
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
  },

  parallelogram: function(o) {
    var topRight = o.desc ? o.top + 0.5 : o.top - 0.5;
    Frame.quad({ topLeft: [o.left, o.top], topRight: [o.left+1, topRight], bottomRight: [o.left+1, topRight + o.height], bottomLeft: [o.left, o.top + o.height], color: o.color });
  }
}

var idCounter = 0;
var Timeline = {

  getPropAt: function(id, prop, time) {
    var times = Object.keys(timeline), objects;
    for (var i=times.length-1,ii=0;i>=ii;i--) {
      if (times[i] <= time) {
        var existing = timeline[times[i]].find(function(x) { return x.id === id; });
        if (existing && existing[prop] !== undefined) return existing[prop];
      }
    }
  },

  getObjAt: function(obj, time) {
    var startProps = {};
    Object.keys(obj).forEach(function(prop) {
      startProps[prop] = Timeline.getPropAt(obj.id, prop, time);
    });
    return Object.assign({ id: obj.id }, startProps);
  },

  setObjAt: function(obj, at) {
    var timeObj = timeline[at] || Timeline.newTime(at);
    var existing = timeObj.find(function(x) { return x.id === obj.id; });
    if (!existing) {
      timeObj.push(obj);
    } else {
      extend(existing, obj);
    }
  },

  newTime: function(time) {
    var times = Object.keys(timeline), objects;
    for (var i=times.length-1,ii=0;i>=ii;i--) {
      if (times[i] < time) {
        objects = timeline[times[i]].map(function(objInTime) { return { id: objInTime.id }; });
        break;
      }
    }
    return timeline[time] = (objects || []);
  },

  add: function(time, obj, animation) {
    obj = Object.assign({ id: idCounter }, obj);
    if (timeline[time]) {
      timeline[time].push(obj);
    } else {
      Timeline.newTime(time).push(obj);
    }

    Object.keys(timeline).forEach(function(t) {
      if (t > time) timeline[t].push({ id: obj.id });
    });

    if (animation) {
      Timeline.animate(Object.assign({ id: idCounter, at: time }, animation));
    }

    return idCounter++;
  },

  animate: function(obj) {
    var at = obj.at, duration = obj.duration;
    delete obj.at;
    delete obj.duration;

    Timeline.setObjAt(Timeline.getObjAt(obj, at), at);
    Timeline.setObjAt(obj, at+duration);
  },

  remove: function(id, time) {
    Object.keys(timeline).forEach(function(t) {
      if (t >= time) {
        var index = timeline[t].findIndex(function(obj) { return obj.id === id; });
        if (index > -1) timeline[t].splice(index, 1)
      }
    });
  }
};
var blue = "#008ED6",
    red = "#E2062C",
    yellow = "#FFE135",
    pink = "#F6ABCC",
    turquise = "#419873",
    darkGreen = "#182C25",
    lightGreen = "#306844",
    white = "#fff",
    black = "#000";

var minSize = 20, state = [];

positionCanvas();




// var timeline = {
//   0: [
//     { id: 0, type: "fill", top: 0, left: 0, width: w, height: h, color: black, opacity: 1 },
//     { id: 1, type: "text", text: "In memory of my grandpa, \"Saba Yanyu\"", color: white, x: w/2-200, y: h/2, font: "36px 'PT Sans'" }
//   ],
//
//   2000: [
//     { id: 0, color: black },
//     { id: 1 }
//   ],
//
//   3000: [
//     { id: 0, color: white },
//     { id: 2, type: "line", x1: w/2, y1: 0, x2: w/2, y2: 0, color: black }
//   ],
//
//   4000: [
//     { id: 2, y2: h },
//     { id: 3, type: "line", x1: 0, y1: h/2, x2: 0, y2: h/2, color: black }
//   ],
//
//   5000: [
//     { id: 2 },
//     { id: 3, x2: w }
//   ]
// };

function addGridLine(options) {
  if (options.vertical) {
    Timeline.add(options.at, { type: "line", x1: options.x, y1: frameTop, x2: options.x, y2: frameTop, color: options.color }, { duration: options.duration, y2: frameBottom });
  } else {
    Timeline.add(options.at, { type: "line", x1: frameLeft, y1: options.y, x2: frameLeft, y2: options.y, color: options.color }, { duration: options.duration, x2: frameRight });
  }
}

function addPlus(x,y,w,h,color,time,duration) {
  Timeline.add(time, { type: "line", x1: x, y1: y-h/2, x2: x, y2: y-h/2, color: color }, { duration: duration, y2: y+h/2 });
  Timeline.add(time+duration, { type: "line", x1: x-w/2, y1: y, x2: x-w/2, y2: y, color: color }, { duration: duration, x2: x+w/2 });
}

var timeline = {};
var start, animatedProps = ["left", "top", "width", "height", "color", "opacity", "x1", "x2", "y1", "y2"];

var rectId = Timeline.add(0, { type: "fill", top: 0, left: 0, width: w, height: h, color: black, opacity: 1 });
Timeline.animate({ id: rectId, at: 2000, duration: 1000, color: white });
var textId = Timeline.add(0, { type: "text", text: "In memory of my grandpa, \"Saba Yanyu\"", color: white, x: w/2-200, y: h/2, font: "36px 'PT Sans'" });

var gridStart = 3000,
    gridDuration = 1600,
    squareSize = 25,
    squareCount = 60,
    tot = squareSize*squareCount,
    frameTop = (h - tot)/2,
    frameBottom = frameTop + tot,
    frameLeft = (w - tot)/2,
    frameRight = frameLeft + tot;

addGridLine({ x: frameLeft, color: black, duration : 1, at: 0, vertical: true });
addGridLine({ x: frameLeft + tot, color: black, duration : 1, at: 0, vertical: true });
addGridLine({ y: frameTop, color: black, duration : 1, at: 0 });
addGridLine({ y: frameTop + tot, color: black, duration : 1, at: 0 });

console.time("grid");
for (var q=1,qq=5;q<=qq;q++) {
  var q2 = Math.pow(2,q), q21 = Math.pow(2,q-1), duration = gridDuration/q21;
  for (var e=0,ee=q21;e<ee;e++) {
    var time = gridStart + gridDuration*2*(q-1) + e*duration;
    addGridLine({ x: frameLeft + tot/q2+e*tot/q21, color: black, duration: duration, at: time, vertical: true });
    addGridLine({ y: frameTop + tot/q2+e*tot/q21, color: black, duration: duration, at: time + duration*q21 });
  }
}
console.timeEnd("grid");
// addGridLine({ x: w/2, color: black, duration: 1000, at: gridStart, vertical: true });
// addGridLine({ y: h/2, color: black, duration: 1000, at: gridStart + 1000 });
// addGridLine({ x: w/2-15*squareSize, color: black, duration: 500, at: gridStart+2000, vertical: true });
// addGridLine({ x: w/2+15*squareSize, color: black, duration: 500, at: gridStart+2500, vertical: true });
// addGridLine({ y: h/2-15*squareSize, color: black, duration: 500, at: gridStart+3000 });
// addGridLine({ y: h/2+15*squareSize, color: black, duration: 500, at: gridStart+3500 });
// addGridLine({ y: h/2+15*squareSize, color: black, duration: 500, at: gridStart+3500, vertical: true });

// addPlus(w/2,h/2,w,h,black,3000,1000);
// addPlus(w/4,h/4,w/2,h/2,black,5000,500);
// addPlus(3*w/4,h/4,w/2,h/2,black,5000,500);
// Timeline.add(3000, { type: "line", x1: w/2, y1: 0, x2: w/2, y2: 0, color: black }, { duration: 1000, y2: h });
// Timeline.add(4000, { type: "line", x1: 0, y1: h/2, x2: 0, y2: h/2, color: black }, { duration: 1000, x2: w });
// Timeline.add(5000, { type: "line", x1: w/2 - 100, y1: 0, x2: w/2 - 100, y2: 0, color: black }, { duration: 500, y2: h });



Timeline.remove(textId, 3000);
Timeline.remove(rectId, 3001);

compileAnimation(timeline);
// drawTimeline();


// Shapes.deepPlus.add({ top: 0, left: 0, width: s, height: s, minSize: minSize, color: "#ccc" });
// draw();

console.log("S=" + S);
var numOfSquares = s / S;
console.log("num of squares=" + numOfSquares);

var fWidth = 32, fHeight = 58,
    fLeft = 0, //(numOfSquares-fWidth)/2,
    fTop =  0; //(numOfSquares-fHeight)/2;


// frame
Shapes.rectangle.add({ top: fTop*S, left: fLeft*S, width: fWidth*S, height: fHeight*S }); // 16x30

// vertical rules
for (var i=fLeft+1,ii=fLeft + fWidth;i < ii; i++) {
  Shapes.line.add({ y1: fTop*S, x1: i*S, y2: (fTop + fHeight)*S, x2: i*S, color: "brown", lineWidth: 2 });
}

// horizontal rules
Shapes.line.add({ x1: fLeft*S, x2: (fLeft + fWidth)*S, y1: (fTop + 22)*S, y2: (fTop + 22)*S, color: "brown", lineWidth: 2 });
Shapes.line.add({ x1: fLeft*S, x2: (fLeft + fWidth)*S, y1: (fTop + 41)*S, y2: (fTop + 41)*S, color: "brown", lineWidth: 2 });

// upper part
var strip1top = 2,
    stripHeight = 4,
    strip1bottom = strip1top + stripHeight,
    strip2top = strip1bottom + 1,
    strip2bottom = strip2top + stripHeight,
    strip3top = strip2bottom + 1,
    strip3bottom = strip3top + stripHeight;

Frame.fill({ top: 0, left: 0, height: 22, color: blue });
Frame.fill({ top: 0, left: 4, height: 14.5, color: blue });
Frame.fill({ top: 15.5, left: 4, height: 6.5, color: blue });
Frame.fill({ top: 0, left: 8, height: 22, color: blue });
Frame.fill({ top: 0, left: 12, height: 22, color: blue });
Frame.fill({ top: 0, left: 16, height: 22, color: blue });
Frame.fill({ top: 0, left: 20, height: 22, color: blue });
Frame.fill({ top: 0, left: 24, height: 22, color: blue });
Frame.fill({ top: 0, left: 28, height: 22, color: blue });
Frame.quad({ topLeft: [1,0], topRight: [2,0], bottomRight: [2,0.5], bottomLeft: [1, 0.2], color: red });
Frame.quad({ topLeft: [5,0], topRight: [6,0], bottomRight: [6,1], bottomLeft: [5,0.5], color: red });
Frame.quad({ topLeft: [9,0], topRight: [10,0], bottomRight: [10,1.5], bottomLeft: [9,1], color: red });
Frame.quad({ topLeft: [13,0], topRight: [14,0], bottomRight: [14,2], bottomLeft: [13,1.5], color: red });
Frame.quad({ topLeft: [17,0], topRight: [18,0], bottomRight: [18,2.5], bottomLeft: [17,2], color: red });
Frame.quad({ topLeft: [21,0], topRight: [22,0], bottomRight: [22,3], bottomLeft: [21,2.5], color: red });
Frame.quad({ topLeft: [25,0], topRight: [26,0], bottomRight: [26,3.5], bottomLeft: [25,3], color: red });
Frame.quad({ topLeft: [29,0], topRight: [30,0], bottomRight: [30,4], bottomLeft: [29,3.5], color: red });
Frame.fill({ top: 19.5, left: 2, height: 2.5, color: red });
Frame.fill({ top: 19.5, left: 6, height: 2.5, color: red });
Frame.fill({ top: 19.5, left: 10, height: 2.5, color: red });
Frame.fill({ top: 19.5, left: 14, height: 2.5, color: red });
Frame.fill({ top: 19.5, left: 18, height: 2.5, color: darkGreen });
Frame.fill({ top: 19.5, left: 22, height: 2.5, color: darkGreen });
Frame.fill({ top: 19.5, left: 26, height: 2.5, color: darkGreen });
Frame.fill({ top: 19.5, left: 30, height: 2.5, color: darkGreen });
Frame.fill({ top: 20, left: 3, height: 2, color: lightGreen });
Frame.fill({ top: 20, left: 7, height: 2, color: lightGreen });
Frame.fill({ top: 20, left: 11, height: 2, color: lightGreen });
Frame.fill({ top: strip1top, left: 1, height: stripHeight, color: red });
Frame.quad({ topLeft: [1,strip3top+2], topRight: [2,strip3top], bottomRight: [2,strip3bottom], bottomLeft: [1,strip3top+2], color: pink });
Frame.fill({ top: strip3top, left: 2, height: stripHeight, color: blue });
Frame.quad({ topLeft: [5,strip2bottom], topRight: [6,strip2bottom-2], bottomRight: [6,19.5], bottomLeft: [5,17.5], color: pink });
Frame.quad({ topLeft: [6,strip3top], topRight: [7,strip3top], bottomRight: [6,strip3bottom], bottomLeft: [6,strip3bottom], color: darkGreen });
Frame.fill({ top: strip3top, left: 9, height: 10, color: pink });
Frame.quad({ topLeft: [9,8.5], topRight: [10,6.7], bottomRight: [10,10], bottomLeft: [9,10], color: pink });
Frame.fill({ top: strip1top, height: stripHeight, left: 10, color: yellow });
Frame.fill({ top: strip2top, height: stripHeight, left: 10, color: darkGreen });
Frame.fill({ top: strip2top, height: stripHeight, left: 11, color: red });
Frame.fill({ top: strip2top+0.5, height: 1.5, left: 13, color: turquise });
Frame.arc({ top: strip1top, right: 3, height: stripHeight, color: red });
Frame.fill({ top: strip2top, left: 2, height: stripHeight, color: red });
Frame.arc({ top: strip2top, right: 3, height: stripHeight, color: white });
Frame.arc({ top: strip1top, left: 6, height: stripHeight, color: red });
Frame.fill({ top: strip2top, left: 6, height: stripHeight, color: red });
Frame.arc({ top: strip2top, left: 6, height: stripHeight, color: white });
Frame.arc({ top: strip1top, right: 12, height: stripHeight, color: red });
// Frame.arc({ top: 6.5, right: 12, height: 3, color: lightGreen });
Frame.arc({ top: strip3top, right: 11, height: stripHeight, color: red });
Frame.arc({ top: strip3top, right: 12, height: stripHeight, color: pink });
Frame.quad({ topLeft: [13,6.5], topRight: [14,5.5], bottomRight: [14,7.5], bottomLeft: [13,7.5], color: pink });
Frame.quad({ topLeft: [13,14], topRight: [14,14], bottomRight: [14,20], bottomLeft: [13,22], color: pink });
Frame.fill({ top: strip1top, left: 14, height: stripHeight, color: red });
Frame.quad({ topLeft: [14,strip2top+2], topRight: [15,strip2top], bottomRight: [15,strip2bottom], bottomLeft: [14,strip2top+2], color: blue });
Frame.quad({ topLeft: [14,strip3top], topRight: [15,strip3top], bottomRight: [15,strip3bottom], bottomLeft: [15, strip3bottom], color: yellow });
Frame.arc({ top: strip1top, left: 15, height: stripHeight, color: red });
Frame.fill({ top: strip2top, left: 15, height: stripHeight, color: red });
Frame.arc({ top: strip2top, left: 15, height: stripHeight, color: lightGreen });
Frame.arc({ top: strip3top, left: 15, height: stripHeight, color: pink });
Frame.fill({ top: 4.5, left: 16, height: 7.5, width: 0.4, color: turquise });
Frame.fill({ top: 4.5, left: 16.4, height: 7.5, width: 0.6, color: red });
Frame.quad({ topLeft: [17,4], topRight: [18,2.5], bottomRight: [18,7.5], bottomLeft: [17,7.5], color: pink });
Frame.fill({ top: 7.5, left: 17, height: 1.5, color: turquise });
Frame.quad({ topLeft: [17,11], topRight: [18,11], bottomRight: [18,17], bottomLeft: [17,19], color: pink });
Frame.quad({ topLeft: [18,strip1top], topRight: [19,strip1top], bottomRight: [19,strip1top], bottomLeft: [18,strip1bottom], color: red });
Frame.fill({ top: strip2top, left: 18, height: stripHeight, color: darkGreen });
Frame.fill({ top: strip3top, left: 18, height: stripHeight, color: red });
Frame.arc({ top: strip1top, right: 20, height: stripHeight, color: yellow });
Frame.fill({ top: strip2top, left: 19, height: stripHeight, color: turquise });
Frame.arc({ top: strip2top, right: 20, height: stripHeight, color: white });
Frame.arc({ top: strip3top, right: 20, height: stripHeight, color: darkGreen });
Frame.quad({ topLeft: [19,22], topRight: [20,21.5], bottomRight: [20,22], bottomLeft: [19,22], color: turquise });
Frame.quad({ topLeft: [20,4], topRight: [21,5], bottomRight: [21,13.5], bottomLeft: [20,14], color: red });
Frame.quad({ topLeft: [21,2.5], topRight: [22,3.5], bottomRight: [22,7.5], bottomLeft: [21,7.5], color: pink });
Frame.fill({ top: 7.5, left: 21, height: 1.5, color: turquise });
Frame.quad({ topLeft: [21,strip3top+2], topRight: [22,strip3top+2], bottomRight: [22,strip3top+2], bottomLeft: [21,strip3bottom], color: pink });
Frame.quad({ topLeft: [22,3], topRight: [23,6], bottomRight: [23,6], bottomLeft: [22,6], color: darkGreen });
Frame.quad({ topLeft: [22,strip2top], topRight: [23,strip2top], bottomRight: [23,strip2top], bottomLeft: [22,strip2top+2], color: red });
Frame.quad({ topLeft: [22,strip2top+2], topRight: [23,strip2bottom], bottomRight: [23,strip2bottom], bottomLeft: [22,strip2bottom], color: red });
Frame.quad({ topLeft: [22,strip3top+2], topRight: [23,strip3top], bottomRight: [23,strip3bottom], bottomLeft: [22,strip3top+2], color: pink });
Frame.arc({ top: strip1top, left: 23, height: stripHeight, color: yellow });
Frame.fill({ top: strip2top, left: 23, height: stripHeight, color: turquise });
Frame.arc({ top: strip2top, left: 23, height: stripHeight, color: white });
Frame.arc({ top: strip3top, left: 23, height: stripHeight, color: darkGreen });
Frame.quad({ topLeft: [23,21.5], topRight: [24,21], bottomRight: [24,22], bottomLeft: [23,22], color: turquise });
Frame.quad({ topLeft: [25,5], topRight: [26,6], bottomRight: [26,strip2bottom], bottomLeft: [25,strip2bottom+2], color: pink });
Frame.arc({ top: strip1top, left: 26, height: stripHeight, color: turquise });
Frame.fill({ top: strip2top, left: 26, height: stripHeight, color: red });
Frame.arc({ top: strip3top, left: 26, height: stripHeight, color: darkGreen });
Frame.arc({ top: strip1top, right: 28, height: stripHeight, color: lightGreen });
Frame.fill({ top: strip2top, left: 27, height: stripHeight, color: darkGreen });
Frame.arc({ top: strip2top, right: 28, height: stripHeight, color: white });
Frame.arc({ top: strip3top, right: 28, height: stripHeight, color: red });
Frame.quad({ topLeft: [27,21], topRight: [28,20.5], bottomRight: [28,22], bottomLeft: [27,22], color: turquise });
Frame.quad({ topLeft: [29,strip2top], topRight: [30,strip2top+2], bottomRight: [30,strip2top+2], bottomLeft: [29,strip2bottom], color: pink });
Frame.arc({ top: strip1top, right: 31, height: stripHeight, color: turquise });
Frame.arc({ top: strip1top, left: 31, height: stripHeight, color: lightGreen });
Frame.fill({ top: strip3top, left: 30, height: stripHeight, color: turquise });
Frame.arc({ top: strip3top, left: 31, height: stripHeight, color: red });
Frame.fill({ top: strip2top, left: 31, height: stripHeight, color: darkGreen });
Frame.arc({ top: strip2top, left: 31, height: stripHeight, color: white });
Frame.arc({ top: 10.5, right: 29, height: 11.5, width: 0.8, color: white });
Frame.arc({ top: strip2top+1, left: 24, height: stripHeight, width: 0.6, color: red });
Frame.arc({ top: strip2top, right: 9, height: 7, width: 0.6, color: turquise });
Frame.quad({ topLeft: [12, strip1bottom], topRight: [13, strip1bottom-0.5], bottomRight: [13, strip3bottom-1], bottomLeft: [12, strip3bottom-1.5], color: turquise });

// middle part
var s4top = 24,
    s4bottom = 26;

Frame.quad({ topLeft: [0,22], topRight: [1,22], bottomRight: [1,41], bottomLeft: [0,41-0.2], color: blue });
Frame.quad({ topLeft: [1,s4top-0.1], topRight: [2,s4top+0.1], bottomRight: [2,s4bottom], bottomLeft: [1,s4bottom], color: red });
Frame.quad({ topLeft: [2,22], topRight: [3,24], bottomRight: [3,s4bottom], bottomLeft: [2,s4bottom], color: pink });
Frame.fill({ top: s4top, left: 3, height: 2, color: turquise });
Frame.fill({ top: 22, height: 19, left: 4, color: blue });
Frame.quad({ topLeft: [5,s4top-0.1], topRight: [6,s4top+0.2], bottomRight: [6,s4bottom], bottomLeft: [5,s4bottom], color: red });
Frame.quad({ topLeft: [6,s4bottom-0.9], topRight: [7,s4bottom-0.4], bottomRight: [7,s4bottom], bottomLeft: [6,s4bottom], color: pink });
Frame.fill({ top: s4top, left: 7, height: 2, color: lightGreen });
Frame.fill({ top: 22, height: 19, left: 8, color: blue });
Frame.quad({ topLeft: [8,40.5], topRight: [9,38], bottomRight: [9,41], bottomLeft: [8,41], color: pink });
Frame.quad({ topLeft: [9,24], topRight: [10,24.3], bottomRight: [10,s4bottom], bottomLeft: [9,s4bottom], color: red });
Frame.quad({ topLeft: [9.5,24.15], topRight: [10,24.3], bottomRight: [10,25], bottomLeft: [9.5,24.85], color: lightGreen });
Frame.quad({ topLeft: [10,25], topRight: [11,25.5], bottomRight: [11,s4bottom], bottomLeft: [10,s4bottom], color: pink });
Frame.fill({ top: s4top, left: 11, height: 2, color: pink });
Frame.fill({ top: 22, left: 12, height: 19, color: blue });
Frame.arc({ top: 22, left: 12, height: 1.5, width: 0.5, color: white });
Frame.arc({ top: 23.5, left: 12, height: 1.5, width: 0.5, color: white });
Frame.quad({ topLeft: [13,24.5], topRight: [14,25], bottomRight: [14,27], bottomLeft: [13,27], color: lightGreen });
Frame.quad({ topLeft: [13.5,24.75], topRight: [14,25], bottomRight: [14,26], bottomLeft: [13.5, 26], color: red });
Frame.quad({ topLeft: [14,25.5], topRight: [15,25.6], bottomRight: [15,26], bottomLeft: [14,26], color: pink });
Frame.fill({ top: 23, left: 15, height: 3, color: pink });
Frame.quad({ topLeft: [16,24], topRight: [17,22], bottomRight: [17,41], bottomLeft: [16,41], color: blue });
Frame.quad({ topLeft: [17,24.5], topRight: [18,25], bottomRight: [18,26], bottomLeft: [17,26], color: red });
Frame.quad({ topLeft: [18,25.6], topRight: [19,25.5], bottomRight: [19,26], bottomLeft: [18,26], color: pink });
Frame.fill({ top: s4top, left: 19, height: 2, color: red });
Frame.fill({ top: 22, left: 20, height: 19, color: blue });
Frame.fill({ top: 22, left: 20.7, height: 3, width: 0.3, color: white });
Frame.quad({ topLeft: [21,25], topRight: [22,25.3], bottomRight: [22,26], bottomLeft: [21,26], color: red });
Frame.quad({ topLeft: [22,25.5], topRight: [23,25], bottomRight: [23,26], bottomLeft: [22,26], color: pink });
Frame.fill({ top: s4top, left: 23, height: 2, color: red });
Frame.quad({ topLeft: [24,22], topRight: [25,22], bottomRight: [25,41], bottomLeft: [24,37], color: blue });
Frame.quad({ topLeft: [25,25], topRight: [26,25.3], bottomRight: [26,26], bottomLeft: [25,26], color: red });
Frame.quad({ topLeft: [26,25.3], topRight: [27,25], bottomRight: [27,26], bottomLeft: [26,26], color: pink });
Frame.fill({ top: s4top, left: 27, height: 2, color: darkGreen });
Frame.quad({ topLeft: [28,22], topRight: [29,22.5], bottomRight: [29,41], bottomLeft: [28,41], color: blue });
Frame.quad({ topLeft: [29,25.3], topRight: [30,25.6], bottomRight: [30,26], bottomLeft: [29,26], color: red });
Frame.quad({ topLeft: [30,23.5], topRight: [31,22], bottomRight: [31,26.5], bottomLeft: [30,26.5], color: pink });
Frame.fill({ top: s4top, left: 31, height: 2, color: turquise });
Frame.fill({ top: 26.5, left: 2, height: 9.5, color: yellow });
Frame.arc({ top: 27, right: 3, height: 5, color: white });
Frame.fill({ top: 36, left: 2, height: 5, color: blue });
Frame.fill({ top: 32, left: 1, height: 4, color: red });
Frame.fill({ top: 29, left: 3, height: 3, color: turquise });
Frame.fill({ top: 27, left: 1.5, height: 2, width: 0.5, color: red });
Frame.fill({ top: 27, left: 5, height: 2, width: 0.5, color: red });
Frame.fill({ top: 26.5, left: 6, height: 9.5, color: yellow });
Frame.arc({ top: 27, left: 6, height: 5, color: white });
Frame.fill({ top: 36, left: 6, height: 5, color: blue });
Frame.fill({ top: 36, left: 7, height: 1.5, color: turquise });
Frame.fill({ top: 29, left: 7, height: 3, color: turquise });
Frame.fill({ top: 32, left: 5, height: 4, color: red });
Frame.fill({ top: 32, left: 9, height: 4, color: red });
Frame.fill({ top: 26, left: 9, height: 6, color: lightGreen });
Frame.fill({ top: 27, left: 9, height: 2, width: 0.5, color: red });
Frame.fill({ top: 29, left: 9, height: 3, width: 0.5, color: white });
Frame.fill({ top: 26.5, left: 10, height: 9.5, color: yellow });
Frame.fill({ top: 36, left: 10, height: 5, color: blue });
Frame.quad({ topLeft: [10,28.5], topRight: [11,29], bottomRight: [11,31.5], bottomLeft: [10,32], color: white });
Frame.fill({ top: 29, left: 11, height: 3.5, color: lightGreen });
Frame.quad({ topLeft: [12,37], topRight: [13,36.5], bottomRight: [13,41], bottomLeft: [12,41], color: pink });
Frame.fill({ top: 27, left: 13, height: 9, color: red });
Frame.quad({ topLeft: [14,27], topRight: [15,29], bottomRight: [15,34.5], bottomLeft: [14,35], color: yellow });
Frame.fill({ top: 36, left: 14, height: 5, color: blue });
Frame.fill({ top: 26.5, left: 15, height: 2.5, color: pink });
Frame.fill({ top: 29, left: 15, height: 3, color: lightGreen });
Frame.quad({ topLeft: [17,26], topRight: [18,26], bottomRight: [18,31], bottomLeft: [17,31.5], color: lightGreen });
Frame.quad({ topLeft: [17,27], topRight: [17.5,27], bottomRight: [17.5, 30.75], bottomLeft: [17,31], color: red });
Frame.quad({ topLeft: [17,31.5], topRight: [18,31], bottomRight: [18,36], bottomLeft: [17,36], color: red });
Frame.quad({ topLeft: [18,26.5], topRight: [19,26.5], bottomRight: [19,34.5], bottomLeft: [18,35], color: yellow });
Frame.fill({ top: 26.5, left: 19, height: 3, color: pink });
Frame.fill({ top: 32.5, left: 19, height: 3, color: lightGreen });
Frame.fill({ top: 36, left: 18, height: 5, color: red });
Frame.quad({ topLeft: [20,36], topRight: [21,37], bottomRight: [21,41], bottomLeft: [20,41], color: pink });
Frame.quad({ topLeft: [22,37.5], topRight: [23,38.5], bottomRight: [23,41], bottomLeft: [22,41], color: red });
Frame.fill({ top: 26.5, left: 22, height: 1, color: yellow });
Frame.quad({ topLeft: [22,30], topRight: [23,27.5], bottomRight: [23,34], bottomLeft: [22,34.5], color: yellow });
Frame.quad({ topLeft: [21,29.5], topRight: [22,30], bottomRight: [22,36], bottomLeft: [21,36], color: red });
Frame.fill({ top: 32, left: 23, height: 3.5, color: lightGreen });
Frame.fill({ top: 36, left: 23, height: 1.5, color: lightGreen });
Frame.fill({ top: 26, left: 25, height: 6, color: lightGreen });
Frame.quad({ topLeft: [25,33.5], topRight: [26,33], bottomRight: [26,36], bottomLeft: [25,36], color: red });
Frame.quad({ topLeft: [26,33], topRight: [27,32.5], bottomRight: [27,34.5], bottomLeft: [26,34.5], color: yellow });
Frame.quad({ topLeft: [26,26.5], topRight: [27,26.5], bottomRight: [27,29], bottomLeft: [26,28], color: yellow });
Frame.quad({ topLeft: [26,39.5], topRight: [27,37.5], bottomRight: [27,41], bottomLeft: [26,41], color: red });
Frame.fill({ top: 36, left: 27, height: 1.5, color: lightGreen });
Frame.fill({ top: 29, left: 27, height: 3.5, color: pink });
Frame.fill({ top: 26, left: 29, height: 5.5, width: 0.5, color: red });
Frame.quad({ topLeft: [29,32.5], topRight: [30,32], bottomRight: [30,36], bottomLeft: [29,36], color: red });
Frame.quad({ topLeft: [30,26.5], topRight: [31,26.5], bottomRight: [31,31.5], bottomLeft: [30,32], color: yellow });
Frame.fill({ top: 36, left: 30, height: 5, color: red });
Frame.fill({ top: 36, left: 31, height: 1.5, color: lightGreen });
Frame.fill({ top: 29, left: 31, height: 2.5, color: pink });
Frame.parallelogram({ top: 35.25, left: 6, height: 0.5, color: white });
Frame.parallelogram({ top: 34.5, left: 8, height: 0.5, color: white });
Frame.parallelogram({ top: 33, left: 12, height: 0.5, color: white });
Frame.parallelogram({ top: 31.5, left: 16, height: 0.5, color: white });
Frame.parallelogram({ top: 30, left: 20, height: 0.5, color: white });
Frame.parallelogram({ top: 28.5, left: 24, height: 0.5, color: white });
Frame.parallelogram({ top: 27, left: 28, height: 0.5, color: white });
Frame.parallelogram({ top: 32, left: 28, height: 0.5, desc: true, color: white });

// bottom part
Frame.quad({ topLeft: [0,41.5], topRight: [1,42], bottomRight: [1,58], bottomLeft: [0,58], color: blue });
Frame.fill({ top: 41, left: 1, height: 17, color: lightGreen });
Frame.arc({ top: 45, right: 2, height: 4, color: white });
Frame.arc({ top: 45, right: 3, height: 4, color: red });
Frame.quad({ topLeft: [2,53.5], topRight: [3,53.5], bottomRight: [3,57], bottomLeft: [2,58], color: pink });
Frame.quad({ topLeft: [4,41], topRight: [5,41], bottomRight: [5,44.5], bottomLeft: [4,45], color: blue });
Frame.fill({ top: 48, left: 4, height: 10, color: blue });
Frame.quad({ topLeft: [5,41], topRight: [6,41], bottomRight: [6,44], bottomLeft: [5,44.5], color: lightGreen });
Frame.quad({ topLeft: [5,51], topRight: [6,51.5], bottomRight: [6,57], bottomLeft: [5,58], color: lightGreen });
Frame.quad({ topLeft: [6,44], topRight: [7,43.5], bottomRight: [7,52.5], bottomLeft: [6,52], color: red });
Frame.quad({ topLeft: [6.5,48], topRight: [7,43.5], bottomRight: [7,52.5], bottomLeft: [6.5,48], color: white });
Frame.quad({ topLeft: [6,53.5], topRight: [7,53.5], bottomRight: [7,55.5], bottomLeft: [6,56.5], color: pink });
Frame.quad({ topLeft: [7,47], topRight: [8,47], bottomRight: [8,51], bottomLeft: [7,49], color: red });
Frame.fill({ top: 41, left: 8, height: 17, color: blue });
Frame.quad({ topLeft: [9,41], topRight: [10,41], bottomRight: [10,42.5], bottomLeft: [9,43], color: lightGreen });
Frame.quad({ topLeft: [9,43.5], topRight: [10,43.5], bottomRight: [10,50.5], bottomLeft: [9,51], color: yellow });
Frame.quad({ topLeft: [9,52], topRight: [10,52.5], bottomRight: [10,57], bottomLeft: [9,58], color: lightGreen });
Frame.quad({ topLeft: [10,42.5], topRight: [11,43], bottomRight: [11,52], bottomLeft: [10,52.5], color: red });
Frame.quad({ topLeft: [10,53.5], topRight: [11,53.5], bottomRight: [11,54.5], bottomLeft: [10,55.5], color: pink });
Frame.fill({ top: 47, left: 11, height: 6, color: red });
Frame.fill({ top: 41, left: 12, height: 17, color: blue });
Frame.arc({ top: 53, left: 12, height: 2, color: white });
Frame.quad({ topLeft: [13,41], topRight: [14,41], bottomRight: [14,42], bottomLeft: [13,42.25], color: lightGreen });
Frame.quad({ topLeft: [13,43.5], topRight: [14,43.5], bottomRight: [14,49], bottomLeft: [13,49.5], color: yellow });
Frame.quad({ topLeft: [13,53], topRight: [14,53], bottomRight: [14,55.5], bottomLeft: [13,56], color: lightGreen });
Frame.arc({ top: 44, left: 14, height: 5.5, color: red });
Frame.quad({ topLeft: [14,53.5], topRight: [15,53.5], bottomRight: [15,54], bottomLeft: [14,54.5], color: pink });
Frame.quad({ topLeft: [15,47], topRight: [16,47], bottomRight: [16,48.5], bottomLeft: [15,52.5], color: red });
Frame.fill({ top: 41, left: 16, height: 17, color: blue });
Frame.fill({ top: 41, left: 17, height: 1, color: lightGreen });
Frame.quad({ topLeft: [17,43.5], topRight: [18,43.5], bottomRight: [18,48], bottomLeft: [17,48.5], color: yellow });
Frame.quad({ topLeft: [17,53], topRight: [18,53], bottomRight: [18,54.5], bottomLeft: [17,55], color: lightGreen });
Frame.arc({ top: 44, right: 19, height: 5.5, color: red });
Frame.quad({ topLeft: [18,53.5], topRight: [19,53.5], bottomRight: [19,54.5], bottomLeft: [18,54], color: pink });
Frame.quad({ topLeft: [19,48], topRight: [20,48.5], bottomRight: [20,54.5], bottomLeft: [19,54.5], color: red });
Frame.fill({ top: 41, left: 20, height: 17, color: blue });
Frame.fill({ top: 53, left: 20.5, height: 5, width: 0.5, color: white });
Frame.quad({ topLeft: [19,43], topRight: [20,43], bottomRight: [20,44], bottomLeft: [19,43], color: darkGreen });
Frame.quad({ topLeft: [21,41], topRight: [22,41], bottomRight: [22,42.25], bottomLeft: [21,42], color: lightGreen });
Frame.quad({ topLeft: [21,43.5], topRight: [22,43.5], bottomRight: [22,46.5], bottomLeft: [21,47], color: yellow });
Frame.quad({ topLeft: [21,53], topRight: [22,53], bottomRight: [22,54.5], bottomLeft: [21,55], color: lightGreen });
Frame.quad({ topLeft: [22,43.5], topRight: [23,49], bottomRight: [23,52.5], bottomLeft: [22,52.5], color: red });
Frame.quad({ topLeft: [22,53.5], topRight: [23,53.5], bottomRight: [23,55], bottomLeft: [22,54.5], color: pink });
Frame.quad({ topLeft: [23,43], topRight: [24,43], bottomRight: [24,49.5], bottomLeft: [23,49], color: darkGreen });
Frame.quad({ topLeft: [23,50.5], topRight: [24,51], bottomRight: [24,54.5], bottomLeft: [23,54.5], color: red });
Frame.fill({ top: 41, left: 24, height: 17, color: blue });
Frame.quad({ topLeft: [25,41], topRight: [26,41], bottomRight: [26,43], bottomLeft: [25,42.5], color: lightGreen });
Frame.quad({ topLeft: [25,43.5], topRight: [26,43.5], bottomRight: [26,44], bottomLeft: [25,44.5], color: yellow });
Frame.quad({ topLeft: [25,51.5], topRight: [26,51], bottomRight: [26,53.5], bottomLeft: [25,54], color: lightGreen });
Frame.quad({ topLeft: [26,53.5], topRight: [27,53.5], bottomRight: [27,55.5], bottomLeft: [26,55], color: pink });
Frame.quad({ topLeft: [27,53.5], topRight: [28,54.5], bottomRight: [28,54.5], bottomLeft: [27,54.5], color: red });
Frame.quad({ topLeft: [26,42.5], topRight: [27,43], bottomRight: [27,51], bottomLeft: [26,51.5], color: red });
Frame.quad({ topLeft: [27,43], topRight: [28,43], bottomRight: [28,54.5], bottomLeft: [27,52.5], color: darkGreen });
Frame.fill({ top: 41, left: 28, height: 17, color: blue });
Frame.quad({ topLeft: [28,55.5], topRight: [29,54.5], bottomRight: [29,56.5], bottomLeft: [28,55.5], color: white });
Frame.quad({ topLeft: [29,41], topRight: [30,41], bottomRight: [30,53.5], bottomLeft: [29,54.5], color: lightGreen });
Frame.quad({ topLeft: [30,53.5], topRight: [31,53.5], bottomRight: [31,57.5], bottomLeft: [30,57], color: pink });
Frame.arc({ top: 44, left: 30, height: 5.5, color: red });
Frame.quad({ topLeft: [29,43.5], topRight: [30,44], bottomRight: [30,49.5], bottomLeft: [29,50], color: white });
Frame.fill({ top: 56, left: 24, height: 1, color: white });
Frame.parallelogram({ top: 42, left: 4, height: 1, desc: true, color: white });
Frame.parallelogram({ top: 43.5, left: 8, height: 1, desc: true, color: white });
Frame.parallelogram({ top: 45, left: 12, height: 1, desc: true, color: white });
Frame.parallelogram({ top: 46.5, left: 16, height: 1, desc: true, color: white });
Frame.parallelogram({ top: 48, left: 20, height: 1, desc: true, color: white });
Frame.parallelogram({ top: 49.5, left: 24, height: 1, desc: true, color: white });
