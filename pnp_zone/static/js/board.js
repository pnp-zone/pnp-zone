import {Drag, LEFT_BUTTON} from "./lib/mouse.js";
import socket from "./socket.js";
import {Coord, Line} from "../react/grid.js";

// Add submit action to new character form
const newCharacter = document.forms["newCharacter"];
if (newCharacter) {
    newCharacter.onsubmit = () => {
        const form = document.forms["newCharacter"];
        socket.send({type: "character.new",
            id: form["id"].value,
            x: form["x"].value,
            y: form["y"].value,
            color:form["color"].value,
        });
        return false;
    }
}

class PaintBrush {
    constructor(form) {
        this.form = form;

        this.visited = {};
        this.toSend = [];
        this.sendTimeout = null;

        this.previously = null;  //previously colored Tile

        this.drag = new Drag();
        this.drag.register(LEFT_BUTTON, this);

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

            // Directly write tile to board
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
        const boardView = document.getElementById("board-view");
        if (value) {
            boardView.style.cursor = "crosshair";
            boardView.addEventListener("mousedown", this.drag.onMouseDown);
        } else {
            boardView.style.cursor = "";
            boardView.removeEventListener("mousedown", this.drag.onMouseDown);
        }
    }
}

const colorTile = document.forms["colorTile"];
if (colorTile) {
    const brush = new PaintBrush(colorTile);
}
