import Hexagon from "./hexagon.js";
import tags from "./tagFactory.js";
import Character from "./character.js";

const TILE_HEXAGON = new Hexagon(100);
const TILE_WIDTH = Math.floor(TILE_HEXAGON.width);
const TILE_HEIGHT = Math.floor(TILE_HEXAGON.height);
const ROW_HEIGHT = Math.floor(TILE_HEXAGON.height - TILE_HEXAGON.b);
const DIV = document.getElementById("grid");

export class Tile {
    static lookup = [];

    constructor(x, y) {
        this.position = Coord.fromIndex(x, y);
        this.obj = tags.div({
            class: "board-element",
            style: {
                left: this.position.left+"px",
                top: this.position.top+"px",
                width: TILE_WIDTH+"px",
                height: TILE_HEIGHT+"px",
            },
            ondragstart: () => { return false; },
            children: [Hexagon.generateSVG(512, 8)],
        });
        DIV.appendChild(this.obj);
        Character.registerMoveTarget(this.obj, x, y);
    }

    // get backgroundColor() { return this.obj.firstChild.style.fill; }
    set backgroundColor(value) { this.obj.firstChild.firstChild.style.fill = ""+value; }
    // get borderColor() { return this.obj.lastChild.style.fill; }
    set borderColor(value) { this.obj.firstChild.lastChild.style.fill = ""+value; }

    static getOrCreate(x, y) {
        let column = this.lookup[x];
        if (!column) {
            column = [];
            this.lookup[x] = column;
        }

        let tile = column[y];
        if (!tile) {
            tile = new Tile(x, y);
            column[y] = tile;
        }
        return tile;
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
        return TILE_WIDTH*this.xIndex + ((this.yIndex%2 === 0) ? 0 : TILE_WIDTH/2);
    }
    get top() {
        return ROW_HEIGHT*this.yIndex;
    }
    get right() {
        return this.left + TILE_WIDTH;
    }

    static fromIndex(x, y) {
        const coord = new Coord();
        coord.xIndex = x;
        coord.yIndex = y;
        coord.xPixel = TILE_WIDTH*x + ((y%2 === 0) ? 0 : TILE_WIDTH/2) + TILE_WIDTH/2;
        coord.yPixel = ROW_HEIGHT*y + TILE_HEIGHT/2;
        return coord;
    }

    static fromPixel(x, y) {
        const coord = new Coord();
        coord.yIndex = Math.floor(y / ROW_HEIGHT);
        coord.xIndex = Math.floor((x - ((coord.yIndex%2 === 0) ? 0 : TILE_WIDTH/2)) / TILE_WIDTH);
        coord.xPixel = x;
        coord.yPixel = y;

        // Point lies in the triangle part
        // and might have to be adjusted
        if (y % ROW_HEIGHT < ROW_HEIGHT - TILE_HEIGHT/2) {
            const slope = TILE_HEXAGON.b/TILE_HEXAGON.a;
            // left half
            if (x < coord.left + TILE_WIDTH/2) {
                const rX = x - coord.left;
                const rY = TILE_HEXAGON.b - y + coord.top;
                // point is above slope
                if (slope*rX < rY) {
                    coord.yIndex -= 1;
                    coord.xIndex -= (coord.yIndex % 2 === 0) ? 0 : 1;
                }
            }
            // right half
            else {
                const rX = coord.right - x;
                const rY = TILE_HEXAGON.b - y + coord.top;
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
