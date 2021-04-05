import Hexagon from "./hexagon.js";
import tags from "./tagFactory.js";

export const TILE_HEXAGON = new Hexagon(100);
export const TILE_WIDTH = Math.floor(TILE_HEXAGON.width);
export const TILE_HEIGHT = Math.floor(TILE_HEXAGON.height);
export const ROW_HEIGHT = Math.floor(TILE_HEXAGON.height - TILE_HEXAGON.b);

export class Tile {
    constructor(container, x, y) {
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
        container.appendChild(this.obj);
    }

    // get backgroundColor() { return this.obj.firstChild.style.fill; }
    set backgroundColor(value) { this.obj.firstChild.firstChild.style.fill = ""+value; }
    // get borderColor() { return this.obj.lastChild.style.fill; }
    set borderColor(value) { this.obj.firstChild.lastChild.style.fill = ""+value; }
}

export class Grid {
    constructor(container) {
        this.container = container;
        this.lookup = {};
    }

    getOrCreate(x, y) {
        const p = [x, y];
        let tile = this.lookup[p]
        if (!tile) {
            tile = this.newTile(x, y);
            this.lookup[p] = tile;
        }
        return tile;
    }

    newTile(x, y) {
        return new Tile(this.container, x, y);
    }
}

export class BackgroundGrid extends Grid {
    constructor(container,
                patchSize = 16,
                width=100,
                borderWidth=2) {
        super(container);

        this.patchSize = patchSize;

        // Generate an svg for the patches
        const border = this.container.style.color;
        const borders = [];
        for (let ix = 0; ix < this.patchSize; ix++) {
            for (let iy = 0; iy < this.patchSize; iy++) {
                // Generate new hexagons
                const coord = Coord.fromIndex(ix, iy);
                const bigH = new Hexagon(width);
                const smallH = new Hexagon(width - 2*borderWidth);

                // Translate hexagons
                for (let i = 0; i < 6; i++) {
                    bigH.points[i][0] += coord.xPixel;
                    bigH.points[i][1] += coord.yPixel;
                    smallH.points[i][0] += coord.xPixel;
                    smallH.points[i][1] += coord.yPixel;
                }

                // Combine hexagons
                borders.push(`<path fill='${border}' fill-rule='evenodd' d='${bigH.asPath} ${smallH.asPath}'></path>`);
            }
        }
        const viewBox = "0 0 "+TILE_WIDTH * this.patchSize+" "+ROW_HEIGHT * this.patchSize;
        const header = "<svg version='1.1' xmlns='http://www.w3.org/2000/svg' viewBox='"+viewBox+"'>\n";
        const svg = header + borders.join("\n") + "\n</svg>";

        // Set svg as background image
        const css = document.createElement("style");
        css.innerHTML = `.patch${this.patchSize} {background-image: url("data:image/svg+xml,${encodeURIComponent(svg)}");}`;
        document.body.appendChild(css);
    }

    newTile(x, y) {
        const position = Coord.fromIndex(x, y);
        const tile = tags.div({
            class: "board-element patch" + this.patchSize,
            style: {
                left: position.left+"px",
                top: position.top+"px",
                width: TILE_WIDTH * this.patchSize + "px",
                height: ROW_HEIGHT * this.patchSize + "px",
            },
        });
        this.container.appendChild(tile);
        return tile;
    }

    getOrCreate(x, y) {
        x -= x % this.patchSize;
        y -= y % this.patchSize;
        return super.getOrCreate(x, y);
    }

    get x() { return parseInt(this.container.style.left.replace("px", "")); }
    get y() { return parseInt(this.container.style.top.replace("px", "")); }
    set x(value) { this.container.style.left = "" + value + "px"; }
    set y(value) { this.container.style.top = "" + value + "px"; }
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

    /*
     * "step" - methods:
     * A step returns a point's neighbor in the desired direction.
     * For example stepNorthWest returns the upper right hexagon.
     */
    stepNW() {
        return Coord.fromIndex(this.xIndex - (this.yIndex % 2 === 0 ? 1 : 0), this.yIndex - 1);
    }
    stepW() {
        return Coord.fromIndex(this.xIndex - 1, this.yIndex);
    }
    stepSW() {
        return Coord.fromIndex(this.xIndex - (this.yIndex % 2 === 0 ? 1 : 0), this.yIndex + 1);
    }
    stepNE() {
        return Coord.fromIndex(this.xIndex + (this.yIndex % 2 === 0 ? 0 : 1), this.yIndex - 1);
    }
    stepE() {
        return Coord.fromIndex(this.xIndex + 1, this.yIndex);
    }
    stepSE() {
        return Coord.fromIndex(this.xIndex + (this.yIndex % 2 === 0 ? 0 : 1), this.yIndex+1);
    }
    step(direction) {
        return this["step"+direction]();
    }
    neighbors() {
        return [this.stepNW(), this.stepW(), this.stepSW(), this.stepNE(), this.stepE(), this.stepSE()];
    }
}

export class Line {
    constructor(start, end) {
        const goesWest = start.xIndex > end.xIndex;
        const goesNorth = start.yIndex > end.yIndex;
        const dx = Math.abs(start.xIndex - end.xIndex);
        const dy = Math.abs(start.yIndex - end.yIndex);

        // "x over y": How many steps in x could you make through steps in y?
        let xoy = Math.floor(dy / 2);
        if (dy % 2 !== 0) {
            if (goesWest) {
                if (end.yIndex % 2 !== 0) {
                    xoy += 1
                }
            } else {
                if (start.yIndex % 2 !== 0) {
                    xoy += 1
                }
            }
        }

        const counts = {};  // How many steps in a given direction are required?
        const taken = {};  // How many steps in a given direction where already taken?
        let direction;     // Place holder
        if (xoy > dx) {
            direction = (goesNorth ? "N" : "S") + (goesWest ? "E" : "W")
            counts[direction] = xoy - dx;
            taken[direction] = 0;

            direction = (goesNorth ? "N" : "S") + (goesWest ? "W" : "E")
            counts[direction] = dy - (xoy - dx);
            taken[direction] = 0;
        } else {
            direction = (goesNorth ? "N" : "S") + (goesWest ? "W" : "E")
            counts[direction] = dy;
            taken[direction] = 0;
        }
        if (dx > xoy) {
            direction = goesWest ? "W" : "E";
            counts[direction] = dx - xoy;
            taken[direction] = 0;
        }

        // How many steps are required in total?
        const total = dy + (dx > xoy ? dx - xoy : 0);

        this.steps = [];
        this.points = [start];
        for (let i = 0; i < total; i++) {
            let smallest = 2; // Some number greater 1
            let next = null;

            for (let direction in counts) {
                let completed = taken[direction] / counts[direction];
                if (completed < smallest) {
                    smallest = completed;
                    next = direction;
                }
            }

            if (smallest >= 1) {
                break;
            } else {
                this.steps.push(next);
                this.points.push(this.points[this.points.length-1].step(next));
                taken[next] += 1;
            }
        }
    }
}
