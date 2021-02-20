import Hexagon from "./hexagon.js";
import tags from "./tagFactory.js";
import { Coord } from "./grid.js";
import socket from "./socket.js";
import { EventListener, EventGroup } from "./eventHandler.js";

const CHARACTER = new Hexagon(80);
const CHARACTER_WIDTH = Math.floor(CHARACTER.width);
const CHARACTER_HEIGHT = Math.floor(CHARACTER.height);
const DIV = document.getElementById("characters");

export default class Character {

    static selected = null;
    static movementGlobal = new EventGroup(
        new EventListener(document, "mousemove", (event) => {
            if (Character.selected) {
                Character.selected._moveToPixel(event.boardX, event.boardY);
            }
        }),
        new EventListener(document, "mouseup", () => {
            if (Character.selected) {
                Character.selected.obj.style.transition = "";
                Character.selected.moveTo(Character.selected.x, Character.selected.y);
            }
            Character.selected = null;
        })
    ).enable();

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

        this.movementLocal = new EventGroup(
            new EventListener(this.obj, "mousedown", (event) => {
                Character.selected = this;
                this.obj.style.transition = "none";
                event.stopPropagation();
            }),
            new EventListener(this.obj, "mouseup", (event) => {
                if (Character.selected === this) {
                    this.obj.style.transition = "";
                    const coord = Coord.fromPixel(event.boardX, event.boardY);
                    socket.send({type: "move", id: this.id, x: coord.xIndex, y: coord.yIndex});

                    Character.selected = null;
                    event.stopPropagation();
                }
            }),
        ).enable();

        this.moveTo(x, y);
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
            if (Character.selected) {
                socket.send({type: "delete", id: Character.selected.id});
            }
        }).enable();
    }
}