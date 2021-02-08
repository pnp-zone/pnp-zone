import Hexagon from "./hexagon.js";
import { parseHTML } from "./hexagon.js";
import tags from "./tagFactory.js";
import Character from "./character.js";

const FIELD = new Hexagon(100);
const FIELD_WIDTH = Math.floor(FIELD.width);
const FIELD_HEIGHT = Math.floor(FIELD.height);
const ROW_HEIGHT = Math.floor(FIELD.height - FIELD.b);

export class Grid {
    static hexString = Hexagon.svgString(512, 8);

    constructor() {
        this.fields = [];
        this.obj = document.getElementById("grid");
    }

    getField(x, y) {
        let column = this.fields[x];
        if (!column) {
            column = [];
            this.fields[x] = column;
        }

        let field = column[y];
        if (!field) {
            field = tags.div({
                class: "board-element",
                style: {
                    left: (FIELD_WIDTH*x + ((y%2 === 0) ? 0 : FIELD_WIDTH/2))+"px",
                    top: (ROW_HEIGHT*y)+"px",
                    width: FIELD_WIDTH+"px",
                    height: FIELD_HEIGHT+"px",
                },
                ondragstart: () => { return false; },
                children: [parseHTML(Grid.hexString)],
            });
            this.obj.appendChild(field);
            Character.registerMoveTarget(field, x, y);
            column[y] = field;
        }

        return field;
    }
}

export class Coord {
    constructor() {
        this.xPixel = 0;
        this.yPixel = 0;
        this.xIndex = 0;
        this.yIndex = 0;
    }

    get left() {
        return FIELD_WIDTH*this.xIndex + ((this.yIndex%2 === 0) ? 0 : FIELD_WIDTH/2);
    }
    get top() {
        return ROW_HEIGHT*this.yIndex;
    }
    get right() {
        return this.left + FIELD_WIDTH;
    }

    static fromIndex(x, y) {
        const coord = new Coord();
        coord.xIndex = x;
        coord.yIndex = y;
        coord.xPixel = FIELD_WIDTH*x + ((y%2 === 0) ? 0 : FIELD_WIDTH/2) + FIELD_WIDTH/2;
        coord.yPixel = ROW_HEIGHT*y + FIELD_HEIGHT/2;
        return coord;
    }

    static fromPixel(x, y) {
        const coord = new Coord();
        coord.yIndex = Math.floor(y / ROW_HEIGHT);
        coord.xIndex = Math.floor((x - ((coord.yIndex%2 === 0) ? 0 : FIELD_WIDTH/2)) / FIELD_WIDTH);
        coord.xPixel = x;
        coord.yPixel = y;

        // Point lies in the triangle part
        // and might have to be adjusted
        if (y % ROW_HEIGHT < ROW_HEIGHT - FIELD_HEIGHT/2) {
            const slope = FIELD.b/FIELD.a;
            // left half
            if (x < coord.left + FIELD_WIDTH/2) {
                const rX = x - coord.left;
                const rY = FIELD.b - y + coord.top;
                // point is above slope
                if (slope*rX < rY) {
                    coord.yIndex -= 1;
                    coord.xIndex -= (coord.yIndex % 2 === 0) ? 0 : 1;
                }
            }
            // right half
            else {
                const rX = coord.right - x;
                const rY = FIELD.b - y + coord.top;
                // point is above slope
                if (slope*rX < rY) {
                    coord.xIndex += (coord.yIndex % 2 === 0) ? 0 : 1;
                    coord.yIndex -= 1;
                }
            }
        }

        return coord;
    }
}
