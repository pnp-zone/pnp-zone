import tags from "./lib/tagFactory.js";
import { Drag, LEFT_BUTTON } from "./lib/mouse.js";

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
    createChildBox(pos, cursor = "auto") {
        // parse parameter
        let ns = pos.match(/[NS]/);
        if (ns !== null) {
            ns = ns[0];
        } else {
            ns = "";
        }

        let we = pos.match(/[WE]/);
        if (we !== null) {
            we = we[0];
        } else {
            we = "";
        }

        // base definition for div
        const obj = {
            class: "board-element",
            style: {
                cursor,
                width: "100%",
                height: "100%",
                top: 0,
                left: 0,
            }
        }

        // size
        if (ns !== "") {
            obj.style.height = ""+DELTA+"px";
        }
        if (we !== "") {
            obj.style.width = ""+DELTA+"px";
        }

        // position
        if (ns === "S") {
            obj.style.top = "auto";
            obj.style.bottom = 0;
        }
        if (we === "E") {
            obj.style.left = "auto";
            obj.style.right = 0;
        }

        // drag callback
        const parent = this.parent;
        function callback(dx, dy) {
            switch (ns) {
                case "N":
                    parent.y += dy;
                    parent.height -= dy;
                    break;
                case "S":
                    parent.height += dy;
                    break;
            }
            switch (we) {
                case "W":
                    parent.x += dx;
                    parent.width -= dx;
                    break;
                case "E":
                    parent.width += dx;
                    break;
            }
        }

        const hitbox = tags.div(obj);
        new Drag(this.wrapDragMove(callback), hitbox, LEFT_BUTTON).enable();
        return hitbox
    }

    constructor(parent) {
        this.parent = parent;

        const n = this.createChildBox("N", "ns-resize");
        const s = this.createChildBox("S", "ns-resize");
        const w = this.createChildBox("W", "ew-resize");
        const e = this.createChildBox("E", "ew-resize");

        const nw = this.createChildBox("NW", "nwse-resize");
        const se = this.createChildBox("SE", "nwse-resize");
        const ne = this.createChildBox("NE", "nesw-resize");
        const sw = this.createChildBox("SW", "nesw-resize");

        this.children = {n, s, w, e, nw, se, ne, sw};
        this.main = tags.div({
            class: "board-element",
            style: {
                cursor: "move",
                left: 0,
                top: 0,
                padding: "" + DELTA/2 + "px",
            },
            children: [
                w, e, n, s,
                nw, se, ne, sw
            ],
        });
        new Drag(this.wrapDragMove(function(dx, dy) {
            parent.x += dx;
            parent.y += dy;
        }), this.main, LEFT_BUTTON).enable();

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
