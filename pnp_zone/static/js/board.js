import socket from "./socket.js";
import tags from "./tagFactory.js";
import { Tile, Coord, Line } from "./grid.js";
import Character from "./character.js";
import * as Mouse from "./mouse.js";
import { EventGroup, EventListener } from "./eventHandler.js";
import { startDrag } from "./mouse.js";

const SCALE_SPEED = 1.1;

let userId = null;
const characters = {};

// Setup socket
document.addEventListener("DOMContentLoaded", () => {
    socket.open();
});
socket.registerEvent("move", (event) => {
    characters[event.id].moveTo(event.x, event.y);
});
socket.registerEvent("new", (event) => {
    characters[event.id] = new Character({id: event.id, x: event.x, y: event.y, color: event.color});
});
socket.registerEvent("error", (event) => {
    console.error(event.message);
});
socket.registerEvent("delete", (event) => {
    characters[event.id].obj.remove();
});
socket.registerEvent("colorTile", (event) => {
    const tile = Tile.getOrCreate(event.x, event.y);
    tile.backgroundColor = event.background;
    tile.borderColor = event.border;
});
socket.registerEvent("cursor", (event) => {
    if (userId !== event.id) {
        const cursor = Cursor.getOrCreate(event.id, event.name);
        cursor.x = event.x;
        cursor.y = event.y;
    }
});
socket.registerEvent("welcome", (event) => {
    userId = event.yourId;
});
socket.registerEvent("session", (event) => {
    board.x = event.x;
    board.y = event.y;
    board.scale = event.scale;
    board.generateVisible();
});

// Add delete functionality
const deleteCharacter = document.getElementById("deleteCharacter");
if (deleteCharacter) {
    Character.registerDeleteTarget(deleteCharacter);
}

// Add submit action to new character form
const newCharacter = document.forms["newCharacter"];
if (newCharacter) {
    newCharacter.onsubmit = () => {
        const form = document.forms["newCharacter"];
        socket.send({type: "new",
            id: form["id"].value,
            x: form["x"].value,
            y: form["y"].value,
            color:form["color"].value,
        });
        return false;
    }
}

class Cursor {
    static DIV = document.getElementById("cursors");
    static TIMEOUT = 100;
    static activeTimeout = null;
    static cursors = {};

    constructor(id, name) {
        this.obj = tags.div({
            class: "cursor board-element",
            children: [
                tags.span({}),
                tags.p({
                    innerText: name,
                })
            ],
        });
        Cursor.DIV.appendChild(this.obj);
        Cursor.cursors[id] = this;
    }

    static getOrCreate(id, name) {
        let obj = Cursor.cursors[id];
        if (!obj) {
            obj = new Cursor(id, name)
        }
        return obj;
    }

    set x(value) {
        this.obj.style.left = "" + value + "px";
    }

    set y(value) {
        this.obj.style.top = "" + value + "px";
    }
}

document.addEventListener("mousemove", (event) => {
    if (!Cursor.activeTimeout) {
        Cursor.activeTimeout = setTimeout(() => {
            socket.send({type: "cursor", x: event.boardX, y: event.boardY});
            Cursor.activeTimeout = null;
        }, Cursor.TIMEOUT);
    }
});

class Board {
    _mouseStart;
    _boardStart;  // values shared across event listeners
    _generateTimeout;

    constructor() {
        this.obj = document.getElementById("board");
        document.addEventListener("DOMContentLoaded", () => {
            this.generateVisible();
            window.addEventListener("resize", () => {
                this.generateVisible();
            });
        });
        window.addEventListener("beforeunload", (event) => {
            socket.send({
                type: "session",
                x: this.x,
                y: this.y,
                scale: this.scale
            });
        });

        this.grid = document.getElementById("grid");

        this.x = 0;
        this.y = 0;
        this.scale = 1

        // dragStart
        this.dragging = new EventListener(this.grid, "mousedown", (event) => {
            startDrag(this);
            this._mouseStart = {x: event.pageX, y: event.pageY};
            this._boardStart = {x: this.x, y: this.y};
        });
        this.dragging.enable();

        // scaling
        this.obj.addEventListener("wheel", (event) => {
            // down
            if (event.deltaY > 0) {
                this.scale /= SCALE_SPEED;
            }

            // up
            else {
                this.scale *= SCALE_SPEED;
            }

            if (this._generateTimeout) {
                clearTimeout(this._generateTimeout);
            }
            this._generateTimeout = setTimeout(this.generateVisible.bind(this), 100);
        });

        const MARGIN = 50;
        const SPEED = 20;
        const TIMEOUT = 100;
        let vx = 0
        let vy = 0
        let interval;
        this.sliding = new EventGroup(
            new EventListener(window, "mousemove", (event) => {
                const { left, right, top, bottom } = this.obj.parentElement.getBoundingClientRect();
                const x = event.clientX;
                const y = event.clientY;

                if (left < x && x < right && top < y && y < bottom) {
                    if (x < left + MARGIN) {
                        vx = +SPEED;
                    } else if (right - MARGIN < x) {
                        vx = -SPEED;
                    } else {
                        vx = 0;
                    }

                    if (y < top + MARGIN) {
                        vy = +SPEED;
                    } else if (bottom - MARGIN < y) {
                        vy = -SPEED;
                    } else {
                        vy = 0;
                    }
                } else {
                    vx = 0;
                    vy = 0;
                }
            }),
            {
                enable: () => {
                    interval = setInterval(() => {
                        if (vx !== 0 || vy !== 0) {
                            this.x += vx;
                            this.y += vy;
                            if (this._generateTimeout) {
                                clearTimeout(this._generateTimeout);
                            }
                            this._generateTimeout = setTimeout(this.generateVisible.bind(this), TIMEOUT);
                        }
                    }, 100);
                    this.obj.style.transition = "left "+TIMEOUT+"ms linear, top "+TIMEOUT+"ms linear"
                },
                disable: () => {
                    clearInterval(interval);
                    this.obj.style.transition = "";
                }
            }
        );
    }

    get scale() {
        //return parseFloat(this.obj.style.transform.match(/scale\(([\d.]+)\)/)[1]);
        return parseFloat(this.obj.style.scale);
    }
    get x() {
        return parseInt(this.obj.style.left.replace("px", ""));
    }
    get y() {
        return parseInt(this.obj.style.top.replace("px", ""));
    }
    set scale(value) {
        //this.obj.style.transform = "scale("+value+")";
        if (value < 0.1) {
            value = 0.1;
        }
        this.obj.style.scale = "" + value;
    }
    set x(value) {
        this.obj.style.left = "" + value + "px";
    }
    set y(value) {
        this.obj.style.top = "" + value + "px";
    }

    /*
     * The boundary rect of what is visible
     * (in pixel; use `Coord.fromPixel` if you need indices)
     */
    get left() { return Math.floor((-this.x)/this.scale); }
    get top() { return Math.floor((-this.y)/this.scale); }
    get right() { return Math.ceil((this.obj.parentElement.offsetWidth-this.x)/this.scale); }
    get bottom() { return Math.ceil((this.obj.parentElement.offsetHeight-this.y)/this.scale); }
    get visibleRect() {
        return { left: this.left, top: this.top, right: this.right, bottom: this.bottom, };
    }

    generateVisible() {
        const rect = this.visibleRect;
        const start = Coord.fromPixel(rect.left, rect.top);
        const end = Coord.fromPixel(rect.right, rect.bottom);
        for (let x = start.xIndex; x <= end.xIndex; x++) {
            for (let y = start.yIndex; y <= end.yIndex; y++) {
                Tile.getOrCreate(x, y);
            }
        }
    }

    dragMove(event) {
        this.x = event.pageX - this._mouseStart.x + this._boardStart.x;
        this.y = event.pageY - this._mouseStart.y + this._boardStart.y;
        if (this._generateTimeout) {
            clearTimeout(this._generateTimeout);
        }
        this._generateTimeout = setTimeout(this.generateVisible.bind(this), 100);
    }

    dragEnd(event) {}
}

export const board = new Board();
Mouse.init(board);

class PaintBrush {
    constructor(form) {
        this.form = form;
        this.visited = {};

        this.previously = null;  //previously colored Tile

        this.dragStarter = new EventListener(board.grid, "mousedown", (event) => {
            this.previously = Coord.fromIndex(event.gridX, event.gridY);
            this.color(event.gridX, event.gridY);

            startDrag(this);
        });

        this.form["active"].onchange = () => {
            this.active = this.form["active"].checked;
        };
        this.active = this.form["active"].checked;
    }

    color(x, y) {
        const key = ""+x+" "+y;
        if (!this.visited.hasOwnProperty(key)) {
            this.visited[key] = null;
            //socket.event_handlers.get("colorTile")({type: "colorTile", x, y, background: this.background, border: this.border});
            socket.send({type: "colorTile", x, y, background: this.background, border: this.border});
        }
    }

    get background() {
        return this.form["colorBg"].value;
    }
    get border() {
        return this.form["colorBr"].value;
    }

    dragMove(event) {
        const points = (new Line(this.previously, Coord.fromIndex(event.gridX, event.gridY))).points;
        for (let i = 0; i < points.length; i++) {
            this.color(points[i].xIndex, points[i].yIndex);
        }
        this.previously = Coord.fromIndex(event.gridX, event.gridY);
    }
    dragEnd() {
        this.visited = {};
    }

    set active(value) {
        if (value) {
            board.obj.parentElement.classList.add("paintbrush");
            board.sliding.enable();
            board.dragging.disable();
            this.dragStarter.enable();
        } else {
            board.obj.parentElement.classList.remove("paintbrush");
            board.sliding.disable();
            board.dragging.enable();
            this.dragStarter.disable();
        }
    }
}

const colorTile = document.forms["colorTile"];
if (colorTile) {
    const brush = new PaintBrush(colorTile);
}
