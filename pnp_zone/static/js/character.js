import Hexagon from "./hexagon.js";
import tags from "./tagFactory.js";
import { Coord } from "./grid.js";
import socket from "./socket.js";
import { EventListener, EventGroup } from "./eventHandler.js";
import { getDragged, startDrag, endDrag, LEFT_BUTTON, registerDrag } from "./mouse.js";
import { board } from "./board.js";

const CHARACTER = new Hexagon(80);
const CHARACTER_WIDTH = Math.floor(CHARACTER.width);
const CHARACTER_HEIGHT = Math.floor(CHARACTER.height);
const DIV = document.getElementById("characters");

export default class Character {

    constructor({id, x, y, color}) {
        this.id = id;

        const svg = Hexagon.generateSVG(512, 12);
        svg.firstChild.style.fill = color;
        this.obj = tags.div({
            id: this.id,
            class: "character",// board-element",
            style: {
                width: CHARACTER_WIDTH + "px",
                height: CHARACTER_HEIGHT + "px",
            },
            children: [
                svg,
                tags.p({
                    class: "board-element",
                    innerText: this.id
                }),
            ],
        });
        DIV.appendChild(this.obj);

        registerDrag(this, LEFT_BUTTON, this.obj);
        this.drag = new EventGroup(
            new EventListener(this.obj, "mouseup", (event) => {
                if (event.button === LEFT_BUTTON && getDragged() === this) {
                    socket.send({type: "move", id: this.id, x: event.gridX, y: event.gridY});

                    endDrag(this);
                    event.stopPropagation();
                }
            }),
        ).enable();

        this.moveTo(x, y);
    }

    dragStart(event) {
        this.obj.style.transition = "none";
    }

    dragMove(event) {
        this._moveToPixel(event.boardX, event.boardY);
    }

    dragEnd() {
        this.obj.style.transition = "";
        this.moveTo(this.x, this.y);
    }

    toString() {
        return "" + this.id;
    }

    _moveToPixel(x, y) {
        const self = {width: this.obj.offsetWidth, height: this.obj.offsetHeight};
        this.obj.style.left = x - self.width/2 + "px";
        this.obj.style.top = y - self.height/2 + "px";
    }

    moveTo(x, y) {
        this.x = x;
        this.y = y;
        const coord = Coord.fromIndex(x, y);
        this._moveToPixel(coord.xPixel, coord.yPixel);
    }

    static registerDeleteTarget(obj) {
        new EventListener(obj, "mouseup", () => {
            if (getDragged() instanceof Character) {
                socket.send({type: "delete", id: getDragged().id});
            }
        }).enable();
    }
}