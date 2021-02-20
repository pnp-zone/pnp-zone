import socket from "./socket.js";
import tags from "./tagFactory.js";
import { Tile, Coord } from "./grid.js";
import Character from "./character.js";
import * as Mouse from "./mouse.js";
import { EventListener, EventGroup } from "./eventHandler.js";

const SCALE_SPEED = 1.1;

let userId = null;
// const room = window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1);
const characters = {};

// Setup socket
document.addEventListener("DOMContentLoaded", socket.open.bind(socket));
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
    socket.send({type: "cursor", x: event.boardX, y: event.boardY});
});

class Board {
    constructor() {
        this.obj = document.getElementById("board");
        document.addEventListener("DOMContentLoaded", () => {
            this.generateVisible();
            window.addEventListener("resize", () => {
                this.generateVisible();
            });
        });

        this.grid = document.getElementById("grid");
        this.selected = false;

        this.x = 0;
        this.y = 0;
        this.scale = 1

        let mouseStart;
        let boardStart;  // values shared across event listeners
        let generateTimeout;

        this.movement = new EventGroup(
            new EventListener(this.grid, "mousedown", (event) => {
                this.selected = true;
                mouseStart = {x: event.pageX, y: event.pageY};
                boardStart = {x: this.x, y: this.y};
            }),
            new EventListener(document, "mouseup", () => {
                this.selected = false;
            }),
            new EventListener(document, "mousemove", (event) => {
                if (this.selected) {
                    this.x = event.pageX - mouseStart.x + boardStart.x;
                    this.y = event.pageY - mouseStart.y + boardStart.y;
                    if (generateTimeout) {
                        clearTimeout(generateTimeout);
                    }
                    generateTimeout = setTimeout(this.generateVisible.bind(this), 100);
                }
            })
        );
        this.movement.enable();

        this.scaling = new EventListener(this.obj, "wheel", (event) => {
            // down
            if (event.deltaY > 0) {
                this.scale /= SCALE_SPEED;
            }

            // up
            else {
                this.scale *= SCALE_SPEED;
            }

            if (generateTimeout) {
                clearTimeout(generateTimeout);
            }
            generateTimeout = setTimeout(this.generateVisible.bind(this), 100);
        });
        this.scaling.enable();
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
}

export const board = new Board();
Mouse.init(board);

const colorTile = document.forms["colorTile"];
if (colorTile) {
    const eventHandler = new EventListener(board.grid, "click", (event) => {
        let background = colorTile["colorBg"].value;
        if (background === "") {
            background = "none";
        }
        let border = colorTile["colorBr"].value;
        if (border === "") {
            border = "none";
        }
        const coord = Coord.fromPixel(event.boardX, event.boardY);
        socket.send({type: "colorTile", x: coord.xIndex, y: coord.yIndex, background, border});
    });
    colorTile["active"].onchange = () => {
        eventHandler.active = colorTile["active"].checked;
    };
}
