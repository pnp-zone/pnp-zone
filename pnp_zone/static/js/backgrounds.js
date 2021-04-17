import tags from "./tagFactory.js";
import { Drag, LEFT_BUTTON } from "./mouse.js";

const is_moderator = document.getElementById("moderator") !== null;

function getNumericStyle(node, property, unit="px") {
    return parseFloat(node.style[property].replace(unit, ""));
}

function setNumericStyle(node, property, value, unit="px") {
    node.style[property] = "" + value + unit;
}

const DELTA = 20;

const CONTAINER = document.getElementById("backgrounds");
const HITBOXES = document.getElementById("backgroundHitboxes");

const backgrounds = {};

export function handleBackgrounds(event) {
    console.log(event);
    const { id, url, x, y, width, height } = event;

    let background = backgrounds[id];
    if (!background) {
        background = new Background(id, url);
        backgrounds[id] = background;
    }

    background.url = url;
    background.x = x;
    background.y = y;
    background.width = width;
    background.height = height;
}

class Hitbox {
    constructor(parent) {
        this.parent = parent;

        this.left = tags.div({
            class: "board-element",
            style: {
                cursor: "ew-resize",
                width: ""+DELTA+"px",
                height: "100%",
            }
        });
        new Drag(this.wrapDragMove((function(dx, dy) {
            parent.x += dx;
            parent.width -= dx;
        }).bind(this)), this.left, LEFT_BUTTON).enable();

        this.right = tags.div({
            class: "board-element",
            style: {
                cursor: "ew-resize",
                width: ""+DELTA+"px",
                height: "100%",
                left: "auto",
                right: 0,
            }
        });
        new Drag(this.wrapDragMove((function(dx, dy) {
            parent.width += dx;
        }).bind(this)), this.right, LEFT_BUTTON).enable();

        this.top = tags.div({
            class: "board-element",
            style: {
                cursor: "ns-resize",
                width: "100%",
                height: ""+DELTA+"px",
            }
        });
        new Drag(this.wrapDragMove((function(dx, dy) {
            parent.y += dy;
            parent.height -= dy;
        }).bind(this)), this.top, LEFT_BUTTON).enable();

        this.bottom = tags.div({
            class: "board-element",
            style: {
                cursor: "ns-resize",
                width: "100%",
                height: ""+DELTA+"px",
                top: "auto",
                bottom: 0,
            }
        });
        new Drag(this.wrapDragMove((function(dx, dy) {
            parent.height += dy;
        }).bind(this)), this.bottom, LEFT_BUTTON).enable();

        this.main = tags.div({
            class: "board-element",
            style: {
                cursor: "grab",
                left: "0px",
                top: "0px",
                padding: "" + DELTA/2 + "px",
            },
            children: [
                this.left,
                this.right,
                this.top,
                this.bottom,
            ],
        });
        const move = this.wrapDragMove(function(dx, dy) {
            parent.x += dx;
            parent.y += dy;
        }.bind(this));
        const dragStart = move.dragStart;
        move.dragStart = function(event) {
            dragStart(event);
            this.main.style.cursor = "grabbing";
        }.bind(this);
        const dragEnd = move.dragEnd;
        move.dragEnd = function() {
            dragEnd();
            this.main.style.cursor = "grab";
        }.bind(this);
        new Drag(move, this.main, LEFT_BUTTON).enable();

        HITBOXES.appendChild(this.main);
    }

    wrapDragMove(callback) {
        let prevX;
        let prevY;

        return {
            dragStart(event) {
                prevX = event.boardX;
                prevY = event.boardY;
            },
            dragMove(event) {
                const dx = event.boardX - prevX;
                const dy = event.boardY - prevY;
                callback(dx, dy);
                prevX = event.boardX;
                prevY = event.boardY;
            },
            dragEnd: function() {
                socket.send({type: "background", id: this.parent.id, url: this.parent.url,
                    x: this.parent.x, y: this.parent.y, width: this.parent.width, height: this.parent.height});
            }.bind(this)
        };
    }

    get x() { return getNumericStyle(this.main, "left"); }
    get y() { return getNumericStyle(this.main, "top"); }
    set x(value) { setNumericStyle(this.main, "left", value); }
    set y(value) { setNumericStyle(this.main, "top", value); }
    get width() { return getNumericStyle(this.main, "width"); }
    get height() { return getNumericStyle(this.main, "height"); }
    set width(value) { setNumericStyle(this.main, "width", value); }
    set height(value) { setNumericStyle(this.main, "height", value); }
}

class Background {

    constructor(id, url) {
        this.id = id;

        if (is_moderator) {
            this.hitbox = new Hitbox(this);
        }

        this.inner = tags.img({src: url});
        this.outer = tags.div({
            class: "board-element",
            style: {
                left: "0px",
                top: "0px",
                padding: "" + DELTA/2 + "px",
            },
            children: [
                this.inner,
            ]
        });
        CONTAINER.appendChild(this.outer);

        // Get size for outer from inner after rendering it
        setTimeout(() => {
            if (this.width == NaN) {
                this.width = this.inner.offsetWidth;
            }
            if (this.height == NaN) {
                this.height = this.inner.offsetHeight;
            }
            this.inner.style.width = "100%";
            this.inner.style.height = "100%";
        }, 1000);
    }

    get url() { return this.inner.src; }
    set url(value) { this.inner.src = value; }
    get x() { return getNumericStyle(this.outer, "left"); }
    get y() { return getNumericStyle(this.outer, "top"); }
    set x(value) {
        setNumericStyle(this.outer, "left", value);
        if (is_moderator) {
            this.hitbox.x = value;
        }
    }
    set y(value) {
        setNumericStyle(this.outer, "top", value);
        if (is_moderator) {
            this.hitbox.y = value;
        }
    }
    get width() { return getNumericStyle(this.outer, "width"); }
    get height() { return getNumericStyle(this.outer, "height"); }
    set width(value) {
        setNumericStyle(this.outer, "width", value);
        if (is_moderator) {
            this.hitbox.width = value;
        }
    }
    set height(value) {
        setNumericStyle(this.outer, "height", value);
        if (is_moderator) {
            this.hitbox.height = value;
        }
    }
}
