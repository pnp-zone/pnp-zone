import tags from "./lib/tagFactory.js";
import { EventListener, EventGroup } from "./lib/eventHandler.js";
import {endDrag, getDragged, LEFT_BUTTON, Drag, registerContextMenu} from "./lib/mouse.js";
import Hexagon from "./hexagon.js";
import { Coord } from "./grid.js";
import socket from "./socket.js";

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
                cursor: "grab",
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

        new Drag(this, this.obj).enable();
        this.drag = new EventGroup(
            new EventListener(this.obj, "mouseup", (event) => {
                if (event.button === LEFT_BUTTON && getDragged() === this) {
                    socket.send({type: "move", id: this.id, x: event.gridX, y: event.gridY});

                    endDrag(this);
                    event.stopPropagation();
                }
            }),
        ).enable();
        registerContextMenu(this.obj, this.contextMenu.bind(this)).enable();

        this.moveTo(x, y);
    }

    dragStart(event) {
        this.obj.style.transition = "none";
        this.obj.style.cursor = "grabbing";
    }

    dragMove(event) {
        this.xPixel = event.boardX;
        this.yPixel = event.boardY;
    }

    dragEnd() {
        this.obj.style.transition = "";
        this.obj.style.cursor = "grab";
        this.moveTo(this.xIndex, this.yIndex);
    }

    contextMenu() {
        return [
            tags.button({
                onclick: (event) => {
                    socket.send({type: "delete", id: this.id});
                },
                innerText: "Delete character"
            }),
        ];
    }

    get xPixel() {
        return parseInt(this.obj.style.left.replace("px", "")) + this.obj.offsetWidth / 2;
    }
    set xPixel(value) {
        this.obj.style.left = value - this.obj.offsetWidth / 2 + "px";
    }
    get yPixel() {
        return parseInt(this.obj.style.top.replace("px", "")) + this.obj.offsetHeight / 2;
    }
    set yPixel(value) {
        this.obj.style.top = value - this.obj.offsetHeight / 2 + "px";
    }

    moveTo(x, y) {
        this.xIndex = x;
        this.yIndex = y;
        const coord = Coord.fromIndex(x, y);
        this.xPixel = coord.xPixel;
        this.yPixel = coord.yPixel;
    }
}