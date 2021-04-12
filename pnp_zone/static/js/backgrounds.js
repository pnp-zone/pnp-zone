import tags from "./tagFactory.js";
import { Drag, LEFT_BUTTON } from "./mouse.js";

function getNumericStyle(node, property, unit="px") {
    return parseFloat(node.style[property].replace(unit, ""));
}

function setNumericStyle(node, property, value, unit="px") {
    node.style[property] = "" + value + unit;
}

const DELTA = 20;

const CONTAINER = document.getElementById("backgrounds");
const HITBOXES = document.getElementById("backgroundHitboxes");

class Background {

    constructor(node) {
        this.leftHitbox = tags.div({
            class: "board-element",
            style: {
                cursor: "ew-resize",
                width: ""+DELTA+"px",
                height: "100%",
            }
        });
        new Drag(this.wrapDragMove((function(dx, dy) {
            this.x += dx;
            this.width -= dx;
        }).bind(this)), this.leftHitbox, LEFT_BUTTON).enable();

        this.rightHitbox = tags.div({
            class: "board-element",
            style: {
                cursor: "ew-resize",
                width: ""+DELTA+"px",
                height: "100%",
                left: "auto",
                right: 0,
            }
        });
        new Drag(this.wrapDragMove((function(dx, dy) {
            this.width += dx;
        }).bind(this)), this.rightHitbox, LEFT_BUTTON).enable();

        this.topHitbox = tags.div({
            class: "board-element",
            style: {
                cursor: "ns-resize",
                width: "100%",
                height: ""+DELTA+"px",
            }
        });
        new Drag(this.wrapDragMove((function(dx, dy) {
            this.y += dy;
            this.height -= dy;
        }).bind(this)), this.topHitbox, LEFT_BUTTON).enable();

        this.bottomHitbox = tags.div({
            class: "board-element",
            style: {
                cursor: "ns-resize",
                width: "100%",
                height: ""+DELTA+"px",
                top: "auto",
                bottom: 0,
            }
        });
        new Drag(this.wrapDragMove((function(dx, dy) {
            this.height += dy;
        }).bind(this)), this.bottomHitbox, LEFT_BUTTON).enable();

        this.hitbox = tags.div({
            class: "board-element",
            style: {
                cursor: "grab",
                left: "0px",
                top: "0px",
                padding: "" + DELTA/2 + "px",
            },
            children: [
                this.leftHitbox,
                this.rightHitbox,
                this.topHitbox,
                this.bottomHitbox,
            ],
        });
        const move = this.wrapDragMove(function(dx, dy) {
            this.x += dx;
            this.y += dy;
        }.bind(this));
        const dragStart = move.dragStart.bind(this);
        move.dragStart = function(event) {
            dragStart(event);
            this.hitbox.style.cursor = "grabbing";
        }.bind(this);
        move.dragEnd = function() {
            this.hitbox.style.cursor = "grab";
        }.bind(this);
        new Drag(move, this.hitbox, LEFT_BUTTON).enable();
        HITBOXES.appendChild(this.hitbox);

        this.inner = node;
        this.outer = tags.div({
            class: "board-element",
            style: {
                left: "0px",
                top: "0px",
                padding: "" + DELTA/2 + "px",
            },
            children: [
                this.inner,
            ]
        });
        CONTAINER.appendChild(this.outer);

        // Get size for outer from inner after rendering it
        setTimeout(() => {
            this.width = this.inner.offsetWidth;
            this.height = this.inner.offsetHeight;
            this.inner.style.width = "100%";
            this.inner.style.height = "100%";
        }, 1000);
    }

    get x() { return getNumericStyle(this.outer, "left"); }
    get y() { return getNumericStyle(this.outer, "top"); }
    set x(value) {
        setNumericStyle(this.outer, "left", value);
        setNumericStyle(this.hitbox, "left", value);
    }
    set y(value) {
        setNumericStyle(this.outer, "top", value);
        setNumericStyle(this.hitbox, "top", value);
    }
    get width() { return getNumericStyle(this.outer, "width"); }
    get height() { return getNumericStyle(this.outer, "height"); }
    set width(value) {
        setNumericStyle(this.outer, "width", value);
        setNumericStyle(this.hitbox, "width", value);
    }
    set height(value) {
        setNumericStyle(this.outer, "height", value);
        setNumericStyle(this.hitbox, "height", value);
    }

    wrapDragMove(callback) {
        let prevX;
        let prevY;

        return {
            dragStart(event) {
                prevX = event.boardX;
                prevY = event.boardY;
            },
            dragMove(event) {
                const dx = event.boardX - prevX;
                const dy = event.boardY - prevY;
                callback(dx, dy);
                prevX = event.boardX;
                prevY = event.boardY;
            },
            dragEnd() {}
        };
    }
}

const test = new Background(tags.img({src: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Hinterwald_Cattle_Hinterzarten.jpg/1200px-Hinterwald_Cattle_Hinterzarten.jpg"}));
