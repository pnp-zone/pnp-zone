import {MIDDLE_BUTTON, LEFT_BUTTON, Drag, addMouseExtension} from "./lib/mouse.js";
import socket from "./socket.js";
import { Tile, Grid, Coord, Line, ROW_HEIGHT, TILE_WIDTH, BackgroundGrid } from "./grid.js";
import Character from "./character.js";
import { handleCursors } from "./cursors.js";
import { deleteBackground, updateBackground } from "./backgrounds.js";
import { BoardElement } from "./boardElement.js";
import tags from "./lib/tagFactory.js";

// Register custom tags
window.customElements.define("board-character", Character);
window.customElements.define("board-tile", Tile);

const SCALE_SPEED = 1.1;

// Setup socket
document.addEventListener("DOMContentLoaded", () => {
    socket.open();
});
socket.registerEvent("move", (event) => {
    document.getElementById(event.id).moveTo(event.x, event.y);
});
socket.registerEvent("new", (event) => {
    const character = document.createElement("board-character");
    character.id = event.id;
    character.setAttribute("x", event.x);
    character.setAttribute("y", event.y);
    character.setAttribute("color", event.color);
    document.getElementById("coloredGrid").appendChild(character);
});
socket.registerEvent("error", (event) => {
    console.error(event.message);
});
socket.registerEvent("delete", (event) => {
    document.getElementById(event.id).remove();
});
socket.registerEvent("colorTile", (event) => {
    for (let i = 0; i < event.tiles.length; i++) {
        const tile = board.tiles.getOrCreate(...event.tiles[i]);
        tile.backgroundColor = event.background;
        tile.borderColor = event.border;
    }
});
socket.registerEvent("cursor", handleCursors);
socket.registerEvent("background.update", updateBackground);
socket.registerEvent("background.delete", deleteBackground);
socket.registerEvent("session", (event) => {
    board.x = event.x;
    board.y = event.y;
    board.scale = event.scale;
    board.generateVisible();
});

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

class Board extends BoardElement {
    static observedAttributes = ["x", "y", "scale"];
    static stylesheet = "/static/css/board/board.css";

    _mouseStart;
    _boardStart;  // values shared across event listeners
    _generateTimeout;

    constructor() {
        super();
        this.shadowRoot.appendChild(tags.slot({}));
        this.hiddenStyle.addEntry("left", "0px");
        this.hiddenStyle.addEntry("top", "0px");
        this.hiddenStyle.addEntry("transform", "scale(1)");

        this.tiles = new Grid(document.getElementById("coloredGrid"));
        this.grid = new BackgroundGrid(document.getElementById("backgroundGrid"));
    }

    connectedCallback() {
        document.addEventListener("DOMContentLoaded", () => {
            this.generateVisible();
            new ResizeObserver(() => {
                this.generateVisible();
            }).observe(this.parentElement);
        });

        window.addEventListener("beforeunload", (event) => {
            socket.send({
                type: "session",
                x: this.x,
                y: this.y,
                scale: this.scale
            });
        });

        // dragStart
        new Drag(this, this, LEFT_BUTTON).enable();
        new Drag(this, this, MIDDLE_BUTTON).enable();

        // scaling
        this.addEventListener("wheel", (event) => {
            const oldRect = this.parentElement.getBoundingClientRect();
            const oldScale = this.scale;

            // down
            if (event.deltaY > 0) {
                this.scale /= SCALE_SPEED;
            }

            // up
            else {
                this.scale *= SCALE_SPEED;
            }

            const factor = this.scale / oldScale;
            const newRect = this.parentElement.getBoundingClientRect();

            this.x += (event.clientX - newRect.x - this.x) - factor*(event.clientX - oldRect.x - this.x);
            this.y += (event.clientY - newRect.y - this.y) - factor*(event.clientY - oldRect.y - this.y);

            if (this._generateTimeout) {
                clearTimeout(this._generateTimeout);
            }
            this._generateTimeout = setTimeout(this.generateVisible.bind(this), 100);
        });
    }

    attributeChangedCallback(attr, oldValue, newValue) {
        switch (attr) {
            case "x":
                this.hiddenStyle.left = "" + newValue + "px";
                this.grid.x = this.left - (this.left % TILE_WIDTH) + (this.grid.y / ROW_HEIGHT % 2 !== 0 ? TILE_WIDTH/2 : 0);
                break;
            case "y":
                this.hiddenStyle.top = "" + newValue + "px";
                this.grid.y = this.top - (this.top % ROW_HEIGHT);
                this.grid.x = this.left - (this.left % TILE_WIDTH) + (this.grid.y / ROW_HEIGHT % 2 !== 0 ? TILE_WIDTH/2 : 0);
                break;
            case "scale":
                if (parseFloat(newValue) < 0.05) {
                    newValue = "0.05";
                }
                this.hiddenStyle.transform = `scale(${newValue})`;
                break;
        }
    }

    get scale() { return parseFloat(this.getAttribute("scale")); }
    get x() { return parseInt(this.getAttribute("x")); }
    get y() { return parseInt(this.getAttribute("y")); }
    set scale(value) { this.setAttribute("scale", value); }
    set x(value) { this.setAttribute("x", value); }
    set y(value) { this.setAttribute("y", value); }

    /*
     * The boundary rect of what is visible
     * (in pixel; use `Coord.fromPixel` if you need indices)
     */
    get left() { return Math.floor((-this.x)/this.scale); }
    get top() { return Math.floor((-this.y)/this.scale); }
    get right() { return Math.ceil((this.parentElement.offsetWidth-this.x)/this.scale); }
    get bottom() { return Math.ceil((this.parentElement.offsetHeight-this.y)/this.scale); }
    get visibleRect() {
        return { left: this.left, top: this.top, right: this.right, bottom: this.bottom, };
    }

    jumpTo(character) {
        const x = character.xPixel;
        const y = character.yPixel;
        this.x = (this.parentElement.offsetWidth / 2) - (x * this.scale);
        this.y = (this.parentElement.offsetHeight / 2) - (y * this.scale);
        this.generateVisible();
    }

    generateVisible() {
        const start = Coord.fromPixel(this.left, this.top);
        const end = Coord.fromPixel(this.right, this.bottom);
        const w = Math.abs(start.xIndex - end.xIndex);
        const h = Math.abs(start.yIndex - end.yIndex);
        for (let x = -this.grid.patchSize; x <= w; x += this.grid.patchSize) {
            for (let y = -this.grid.patchSize; y <= h; y += this.grid.patchSize) {
                this.grid.getOrCreate(x, y);
            }
        }
        this.x += 0;
        this.y += 0;
    }

    dragStart(event) {
        document.body.style.cursor = "move";
        this._mouseStart = {x: event.pageX, y: event.pageY};
        this._boardStart = {x: this.x, y: this.y};
    }

    dragMove(event) {
        this.x = event.pageX - this._mouseStart.x + this._boardStart.x;
        this.y = event.pageY - this._mouseStart.y + this._boardStart.y;
        if (this._generateTimeout) {
            clearTimeout(this._generateTimeout);
        }
        this._generateTimeout = setTimeout(this.generateVisible.bind(this), 100);
    }

    dragEnd(event) {
        document.body.style.cursor = "default";
    }
}
window.customElements.define("board-board", Board);

export const board = document.getElementById("board");

addMouseExtension((event) => {
    const boardViewRect = board.parentElement.getBoundingClientRect();

    // is the cursor over the board?
    //const overBoard = (boardViewRect.left < event.clientX && event.clientX < boardViewRect.right)
    //    && boardViewRect.top < event.clientY && event.clientY < boardViewRect.bottom;

    // get the cursor coordinates in the board
    // (taking position and scale into consideration)
    const boardX = (event.clientX - boardViewRect.x)/board.scale + board.left;
    const boardY = (event.clientY - boardViewRect.y)/board.scale + board.top;

    event.boardX = boardX;
    event.boardY = boardY;

    let coord = null;
    Object.defineProperty(event, "gridX", {get: () => {
        if (!coord) {
            coord = Coord.fromPixel(boardX, boardY);
        }
        return coord.xIndex;
    }});
    Object.defineProperty(event, "gridY", {get: () => {
            if (!coord) {
                coord = Coord.fromPixel(boardX, boardY);
            }
            return coord.yIndex;
    }});
});

class PaintBrush {
    constructor(form) {
        this.form = form;

        this.visited = {};
        this.toSend = [];
        this.sendTimeout = null;

        this.previously = null;  //previously colored Tile

        this.drag = new Drag(this, board);

        this.form["active"].onchange = () => {
            this.active = this.form["active"].checked;
        };
        this.active = this.form["active"].checked;
    }

    send() {
        socket.send({type: "colorTile", tiles: this.toSend, background: this.background, border: this.border});
        this.toSend = [];
        this.sendTimeout = null;
    }

    color(x, y) {
        const key = ""+x+" "+y;
        if (!this.visited.hasOwnProperty(key)) {
            this.visited[key] = null;

            this.toSend.push([x, y]);
            if (!this.sendTimeout)  {
                this.sendTimeout = setTimeout(this.send.bind(this), 1000);
            }

            const tile = board.tiles.getOrCreate(x, y);
            tile.backgroundColor = this.background;
            tile.borderColor = this.border;
        }
    }

    get background() {
        return this.form["colorBg"].value;
    }
    get border() {
        return this.form["colorBr"].value;
    }

    dragStart(event) {
        this.previously = Coord.fromIndex(event.gridX, event.gridY);
        this.color(event.gridX, event.gridY);
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
            board.parentElement.style.cursor = "crosshair";
            this.drag.enable();
        } else {
            board.parentElement.style.cursor = "";
            this.drag.disable();
        }
    }

    toString() {
        return "[object PaintBrush]";
    }
}

const colorTile = document.forms["colorTile"];
if (colorTile) {
    const brush = new PaintBrush(colorTile);
}
