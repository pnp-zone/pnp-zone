import Hexagon from "./hexagon.js";
import tags from "./tagFactory.js";
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
            draggable: true,
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
            ondragstart: (event) => {
                event.dataTransfer.setData("plain/text", this.id);
            }
        });
        DIV.appendChild(this.obj);

        this.moveTo(x, y);
    }

    moveTo(x, y) {
        const coord = Coord.fromIndex(x, y);
        const self = {width: this.obj.offsetWidth, height: this.obj.offsetHeight};
        this.obj.style.left = coord.xPixel - self.width/2 + "px";
        this.obj.style.top = coord.yPixel - self.height/2 + "px";
    }

    static registerDropTarget(obj, ondrop=null) {
        if (ondrop) {
            obj.ondrop = (event) => {
                event.preventDefault();
                const id = event.dataTransfer.getData("plain/text");
                ondrop(id);
            }
        } else {
            obj.ondrop = (event) => {
                event.preventDefault();
            }

        }

        obj.ondragenter = (event) => {
            event.preventDefault();
        };
        obj.ondragover = (event) => {
            event.preventDefault();
        };
        obj.ondragleave = (event) => {
            event.preventDefault();
        };
    }

    static registerMoveTarget(obj, x, y) {
        Character.registerDropTarget(obj, (id) => {
            socket.send({type: "move", id: id, x: x, y: y});
        });
    }

    static registerDeleteTarget(obj) {
        Character.registerDropTarget(obj, (id) => {
            socket.send({type: "delete", id: id});
        });
    }
}