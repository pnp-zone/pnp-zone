import React, {e} from "../react.js";
import Hexagon from "./hexagon.js";

export const TILE_HEXAGON = new Hexagon(100);
export const TILE_WIDTH = Math.floor(TILE_HEXAGON.width);
export const TILE_HEIGHT = Math.floor(TILE_HEXAGON.height);
export const ROW_HEIGHT = Math.floor(TILE_HEXAGON.height - TILE_HEXAGON.b);
export const BORDER_WIDTH = Math.ceil(TILE_WIDTH / 50);

export function Tile(props) {
    const {x, y, border, background} = props;
    const position = Coord.fromIndex(x, y);

    return e("div", {
        style: {
            position: "absolute",
            left: position.xPixel + "px",
            top: position.yPixel + "px",
        },
    }, [
        e("div", {
            name: "background",
            className: "hexagon",
            style: {
                "--color": background,
                "--border-color": border,
            },
        }),
    ]);
}

export function PatchGrid(props) {
    const {size, border, left, right, top, bottom} = props;

    const patches = [];
    const start = Coord.fromPixel(left, top);
    const end = Coord.fromPixel(right, bottom);
    const w = Math.abs(start.xIndex - end.xIndex);
    const h = Math.abs(start.yIndex - end.yIndex);
    for (let x = -size; x <= w; x += size) {
        for (let y = -size; y <= h; y += size) {
            patches.push([x, y]);
        }
    }

    const y = top - (top % ROW_HEIGHT);
    const x = left - (left % TILE_WIDTH) + (y / ROW_HEIGHT % 2 !== 0 ? TILE_WIDTH/2 : 0);

    return e("div", {
        style: {
            position: "absolute",
            left: `${x}px`,
            top: `${y}px`,
        },
    }, [
        e(PatchCss, {
            key: "css",
            size,
            border,
        }),
        ...patches.map(([x, y]) => e(HexPatch, {key: `${x} | ${y}`, size, x, y})),
    ]);
}
function HexPatch(props) {
    const {x, y, size} = props;
    const position = Coord.fromIndex(x, y);
    return e("div", {
        className: `board-element patch${size}`,
        style: {
            left: position.left+"px",
            top: position.top+"px",
        },
    });
}
// React.memo wraps a component and only re-renders it when it has actually changed
const PatchCss = React.memo(function PatchCss(props) {
    const {size, border} = props;
    // Generate a svg for the patches
    const borders = [];
    for (let ix = -1; ix < size+1; ix++) {
        for (let iy = -1; iy < size+1; iy++) {
            // Generate new hexagons
            const coord = Coord.fromIndex(ix, iy);
            const bigH = new Hexagon(TILE_WIDTH);
            const smallH = new Hexagon(TILE_WIDTH - 2*BORDER_WIDTH);

            // Translate hexagons
            for (let i = 0; i < 6; i++) {
                bigH.points[i][0] += coord.xPixel;
                bigH.points[i][1] += coord.yPixel;
                smallH.points[i][0] += coord.xPixel;
                smallH.points[i][1] += coord.yPixel;
            }

            // Combine hexagons
            borders.push(`<path d='${bigH.asPath} ${smallH.asPath}'></path>`);
        }
    }
    const viewBox = `0 0 ${TILE_WIDTH * size} ${TILE_HEIGHT * size}`;
    const header = `<svg version='1.1' xmlns='http://www.w3.org/2000/svg' viewBox='${viewBox}' fill='${border}' fill-rule='evenodd'>\n`;
    const svg = header + borders.join("\n") + "\n</svg>";

    return e("style", {}, `.patch${size} {background-image: url("data:image/svg+xml,${encodeURIComponent(svg)}");
                                          width: ${TILE_WIDTH * size}px; height: ${TILE_HEIGHT * size}px;}`)
});

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
