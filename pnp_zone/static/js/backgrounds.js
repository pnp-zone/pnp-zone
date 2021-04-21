import tags from "./lib/tagFactory.js";
import {Drag, LEFT_BUTTON, registerContextMenu} from "./lib/mouse.js";
import socket from "./socket.js";

const DELTA = 20;

const CONTAINER = document.getElementById("backgrounds");
const HITBOXES = document.getElementById("backgroundHitboxes");

const is_moderator = document.getElementById("moderator") !== null;

const backgrounds = {};

// Add submit action to add background form
const addBackground = document.forms["addBackground"];
if (addBackground) {
    addBackground.onsubmit = () => {
        socket.send({type: "background.new",
            url: addBackground["url"].value,
        });
        return false;
    }
}

function getNumericStyle(node, property, unit="px") {
    return parseFloat(node.style[property].replace(unit, ""));
}

function setNumericStyle(node, property, value, unit="px") {
    node.style[property] = "" + value + unit;
}

export function updateBackground(event) {
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
export function deleteBackground(event) {
    const { id } = event;

    let background = backgrounds[id];
    if (is_moderator) {
        background.hitbox.main.remove();
    }
    background.outer.remove();
    delete backgrounds[id];
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
                top: "50%",
                left: "50%",
                backgroundColor: "#00f",
                margin: "" + DELTA + "px",
                padding: "" + DELTA + "px",
            }
        }

        // position
        if (ns === "N") {
            obj.style.top = "-" + DELTA + "px";
        }
        if (ns === "S") {
            obj.style.top = "auto";
            obj.style.bottom = "-" + DELTA + "px";
        }
        if (we === "W") {
            obj.style.left = "-" + DELTA + "px";
        }
        if (we === "E") {
            obj.style.left = "auto";
            obj.style.right = "-" + DELTA + "px";
        }

        // drag callback
        const parent = this.parent;
        function resize(direction, amount) {
            switch (direction) {
                case "N":
                    parent.y += amount;
                    parent.height -= amount;
                    break;
                case "S":
                    parent.height += amount;
                    break;
                case "W":
                    parent.x += amount;
                    parent.width -= amount;
                    break;
                case "E":
                    parent.width += amount;
                    break;
            }
            return parent;
        }

        let callback;
        if ((ns !== "") && (we !== "")) {
            callback = (function (dx, dy, event) {
                // corner the drag started from
                const cornerX = parent.x + (we === "E" ? parent.width : 0);
                const cornerY = parent.y + (ns === "S" ? parent.height : 0);

                // slope of the diagonal through that corner
                let m;
                if (((ns === "N") && (we === "W")) || ((ns === "S") && (we === "E"))) {
                    m = this.ratio;
                } else {
                    m = -this.ratio;
                }

                // is the cursor above that diagonal
                const above = m * (event.boardX - cornerX) > event.boardY - cornerY;

                let height, width;
                if ((ns === "N" && !above) || (ns === "S" && above)) {
                    width = we === "W" ? parent.width - dx : parent.width + dx;
                    height = width * this.ratio;
                } else {
                    height = ns === "N" ? parent.height - dy : parent.height + dy;
                    width = height / this.ratio;
                }

                resize(ns, ns === "N" ? parent.height - height : height - parent.height);
                resize(we, we === "W" ? parent.width - width : width - parent.width);
            }).bind(this);
        }
        else if (ns !== "") {
            callback = function(dx, dy) { resize(ns, dy); };
        } else {
            callback = function(dx, dy) { resize(we, dx); };
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
            class: "board-element hitbox",
            tabIndex: 0,
            style: {
                cursor: "move",
                left: 0,
                top: 0,
                padding: "" + DELTA + "px",
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
        let startX;
        let startY;
        let startParent;

        return {
            dragStart(event) {
                prevX = event.boardX;
                prevY = event.boardY;
                startX = event.boardX;
                startY = event.boardY;
                startParent = {x: this.x, y: this.y, width: this.width, height: this.height};
            },
            dragMove(event) {
                const dx = event.boardX - prevX;
                const dy = event.boardY - prevY;
                callback(dx, dy, event);
                prevX = event.boardX;
                prevY = event.boardY;
            },
            dragEnd: function() {
                this.main.focus();
                socket.send({type: "background.move", id: this.parent.id, url: this.parent.url,
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
    get ratio() { return this.height / this.width; }
}

class Background {

    constructor(id, url) {
        this.id = id;

        if (is_moderator) {
            this.hitbox = new Hitbox(this);
            registerContextMenu(this.hitbox.main, () => {
                return [
                    tags.button({
                        onclick: (event) => {
                            socket.send({type: "background.delete", id: this.id});
                        },
                        innerText: "Delete background"
                    }),
                ];
            }).enable();

        }

        this.inner = tags.img({src: url});
        this.outer = tags.div({
            class: "board-element",
            style: {
                left: "0px",
                top: "0px",
                padding: "" + DELTA + "px",
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
        if (value < 0) {
            value = this.inner.naturalWidth;
        }
        setNumericStyle(this.outer, "width", value);
        if (is_moderator) {
            this.hitbox.width = value;
        }
    }
    set height(value) {
        if (value < 0) {
            value = this.inner.naturalHeight;
        }
        setNumericStyle(this.outer, "height", value);
        if (is_moderator) {
            this.hitbox.height = value;
        }
    }
}
