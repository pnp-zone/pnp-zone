import tags from "./lib/tagFactory.js";
import { EventListener, EventGroup } from "./lib/eventHandler.js";
import { endDrag, getDragged, LEFT_BUTTON, Drag, registerContextMenu } from "./lib/mouse.js";
import Hexagon from "./hexagon.js";
import { Coord } from "./grid.js";
import socket from "./socket.js";
import createEditableStyle from "./lib/style.js";

const CHARACTER_WIDTH = 80;
const CHARACTER_HEIGHT = 92;

export default class Character extends HTMLElement {
    static observedAttributes = ["id", "color", "x", "y"];

    constructor() {
        super();
        const shadowRoot = this.attachShadow({mode: 'open'});

        shadowRoot.appendChild(tags.link({
            rel: "stylesheet",
            href: "/static/css/board/character.css",
        }));
        this.hiddenStyle = createEditableStyle();
        this.hiddenStyle.setSelector(":host");
        this.hiddenStyle.addEntry("left", "10px");
        this.hiddenStyle.addEntry("top", "10px");
        this.hiddenStyle.addEntry("transition", "");
        this.hiddenStyle.addEntry("cursor", "");
        shadowRoot.appendChild(this.hiddenStyle);
        shadowRoot.appendChild(Hexagon.generateSVG(512, 12));
        shadowRoot.appendChild(tags.p({}));
    }

    attributeChangedCallback(attr, oldValue, newValue) {
        switch (attr) {
            case "id":
                this.shadowRoot.querySelector("p").innerText = newValue;
                break;
            case "color":
                this.shadowRoot.querySelector("svg").style.fill = newValue;
                break;
            case "x":
            case "y":
                const coord = Coord.fromIndex(this.xIndex, this.yIndex);
                if (!isNaN(coord.xPixel)) {
                    this.xPixel = coord.xPixel;
                }
                if (!isNaN(coord.yPixel)) {
                    this.yPixel = coord.yPixel;
                }
                break;
        }

    }

    connectedCallback() {
        new Drag(this, this).enable();
        this.drag = new EventGroup(
            new EventListener(this, "mouseup", (event) => {
                if (event.button === LEFT_BUTTON && getDragged() === this) {
                    socket.send({type: "move", id: this.id, x: event.gridX, y: event.gridY});

                    endDrag(this);
                    event.stopPropagation();
                }
            }),
        ).enable();
        registerContextMenu(this, this.contextMenu.bind(this)).enable();
    }

    remove() {
        super.remove();
        socket.send({type: "delete", id: this.id});
    }

    dragStart(event) {
        this.hiddenStyle.transition = "none";
        this.hiddenStyle.cursor = "grabbing";
    }

    dragMove(event) {
        this.xPixel = event.boardX;
        this.yPixel = event.boardY;
    }

    dragEnd() {
        this.hiddenStyle.transition = "";
        this.hiddenStyle.cursor = "";
        this.moveTo(this.xIndex, this.yIndex);
    }

    contextMenu() {
        return [
            tags.button({
                onclick: (event) => {
                    this.remove();
                },
                innerText: "Delete character"
            }),
        ];
    }

    get xIndex() {
        return parseInt(this.getAttribute("x"));
    }
    set xIndex(value) {
        return this.setAttribute("x", value);
    }
    get yIndex() {
        return parseInt(this.getAttribute("y"));
    }
    set yIndex(value) {
        return this.setAttribute("y", value);
    }
    get xPixel() {
        return parseInt(this.hiddenStyle.left.match(/(.*)px/)[1]) + CHARACTER_WIDTH / 2;
    }
    set xPixel(value) {
        this.hiddenStyle.left = "" + (value - CHARACTER_WIDTH / 2) + "px";
    }
    get yPixel() {
        return parseInt(this.hiddenStyle.top.match(/(.*)px/)[1]) + CHARACTER_HEIGHT / 2;
    }
    set yPixel(value) {
        this.hiddenStyle.top = "" + (value - CHARACTER_HEIGHT / 2) + "px";
    }
    moveTo(x, y) {
        this.xIndex = x;
        this.yIndex = y;
    }
}
