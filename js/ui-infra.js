
//! Source: src/aQuery.js

window.$ = document.querySelector.bind(document);
window.$$ = function() {
    return [].slice.call(document.querySelectorAll.apply(document, arguments), 0);
};
window.$c = function(html) {
    var div = document.createElement("div");
    div.innerHTML = html;
    return div.firstElementChild;
};

window.$f = function(onload) {
    if (/^(interactive|complete)$/.test(document.readyState)) {
        onload();
    } else {
        document.addEventListener("DOMContentLoaded", onload);
    }
};

Node.prototype.on = Node.prototype.addEventListener;
Node.prototype.off = Node.prototype.removeEventListener;
window.on = window.addEventListener;
window.off = window.removeEventListener;

//! Source: src/delta.js

(function() {
    var startEvent, moveEvent, endEvent, pageX, pageY;
    if ("ontouchstart" in window) {
        startEvent = "touchstart";
        moveEvent = "touchmove";
        endEvent = "touchend";
        pageX = function(e) { return e.touches[0].pageX; };
        pageY = function(e) { return e.touches[0].pageY; };
    } else {
        startEvent = "mousedown";
        moveEvent = "mousemove";
        endEvent = "mouseup";
        pageX = function(e) { return e.pageX; };
        pageY = function(e) { return e.pageY; };
    }

    function startHandler(eStart) {
        function moveHandler(eMove) {
            var deltaX = pageX(eMove) - startX, deltaY = pageY(eMove) - startY;
            document.dispatchEvent(new CustomEvent("delta", { detail: { x: deltaX, y: deltaY, e: eMove }}));
        }

        var startX = pageX(eStart), startY = pageY(eStart);
        document.dispatchEvent(new CustomEvent("deltaStart", { detail: { x: startX, y: startY, e: eStart }}));
        document.addEventListener(moveEvent, moveHandler);

        document.addEventListener(endEvent, function(eEnd) {
            document.dispatchEvent(new CustomEvent("deltaEnd", { detail: { e: eEnd }}));
            document.removeEventListener(moveEvent, moveHandler);
            document.removeEventListener(endEvent, arguments.callee);
        });
    }

    function start() {
        document.addEventListener(startEvent, startHandler);
    }

    function stop() {
        document.removeEventListener(startEvent, startHandler);
    }

    window.Delta = {
        start: start,
        stop: stop
    };
})();

//! Source: src/log.js

if (/[\?&]log=/.test(location.search)) {
    $("body").appendChild($c("<div id='log' style='position: absolute;right: 10px;top: 10px;background: white;border: 1px solid black;width: 100px;height: 100px;overflow: auto;'>"));
    var $log = $("#log");
    log = function(msg) {
        console.log(msg);
        $log.innerHTML = msg + "<br>" + $log.innerHTML;
    }
} else {
    log = console.log.bind(console);
}
