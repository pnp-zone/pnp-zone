import socket from "./socket.js";
import { Grid, Coord } from "./grid.js";
import Character from "./character.js";

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
socket.registerEvent("reload", () => {
    window.location.reload(true);
});
socket.registerEvent("error", (event) => {
    console.error(event.message);
});
socket.registerEvent("delete", (event) => {
    characters[event.id].obj.remove();
});
socket.registerEvent("colorField", (event) => {
    const svg = board.grid.getField(event.x, event.y).firstChild;
    svg.firstChild.style.fill = event.background;
    svg.lastChild.style.fill = event.border;
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
const newCharacter = document.getElementById("newCharacter");
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
    const a = board.visibleRect;
    const rect = board.obj.parentElement.getBoundingClientRect();
    socket.send({type: "cursor", x: event.clientX - rect.x + a.left, y: event.clientY - rect.y + a.top});
});

class Board {
    constructor() {
        this.obj = document.getElementById("board");
        this.grid = new Grid();
        document.addEventListener("DOMContentLoaded", () => {
            this.generateVisible();
        });
        this.selected = false;

        this.x = 0;
        this.y = 0;

        /* Make board draggable */
        let mouseStart;
        let boardStart;  // values shared across event handlers
        let generateTimeout;

        this.grid.obj.addEventListener("mousedown", (event) => {
            this.selected = true;
            mouseStart = {x: event.pageX, y: event.pageY};
            boardStart = {x: this.x, y: this.y};
        });
        document.addEventListener("mouseup", () => {
            this.selected = false;
        });
        document.addEventListener("mousemove", (event) => {
            if (this.selected) {
                this.x = event.pageX - mouseStart.x + boardStart.x;
                this.y = event.pageY - mouseStart.y + boardStart.y;
                if (generateTimeout) {
                    clearTimeout(generateTimeout);
                }
                generateTimeout = setTimeout(this.generateVisible.bind(this), 100);
            }
        });

        /* Make board scalable */
        this.scale = 1
        this.obj.onwheel = (event) => {
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
        };
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
    get visibleRect() {
        return {
            left: Math.floor((-this.x)/this.scale),
            top: Math.floor((-this.y)/this.scale),
            right: Math.ceil((this.obj.parentElement.offsetWidth-this.x)/this.scale),
            bottom: Math.ceil((this.obj.parentElement.offsetHeight-this.y)/this.scale)
        };
    }

    generateVisible() {
        const rect = this.visibleRect;
        const start = Coord.fromPixel(rect.left, rect.top);
        const end = Coord.fromPixel(rect.right, rect.bottom);
        for (let x = start.xIndex; x <= end.xIndex; x++) {
            for (let y = start.yIndex; y <= end.yIndex; y++) {
                this.grid.getField(x, y);
            }
        }
    }
}

export const board = new Board();
