const FIELD = new Hexagon(100);
const FIELD_WIDTH = Math.floor(FIELD.width);
const FIELD_HEIGHT = Math.floor(FIELD.height);
const ROW_HEIGHT = Math.floor(FIELD.height - FIELD.b);
const SCALE_SPEED = 1.1;

const room = window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1);
const characters = {};

// Setup socket
const socket = new Socket();
document.addEventListener("DOMContentLoaded", socket.open.bind(socket));
socket.registerEvent("move", (event) => {
    characters[event.id].moveTo(event.x, event.y);
});
socket.registerEvent("new", (event) => {
    characters[event.id] = new Character({id: event.id, x: event.x, y: event.y, color: event.color});
});
socket.registerEvent("reload", () => {
    window.location.reload(true);
});
socket.registerEvent("error", (event) => {
    console.error(event.message);
});
socket.registerEvent("delete", (event) => {
    characters[event.id].obj.remove();
});

// Add delete functionality
const deleteCharacter = document.getElementById("deleteCharacter");
if (deleteCharacter) {
    Character.registerDeleteTarget(deleteCharacter);
}

// Function for moderator's create button
function createCharacter() {
    const form = document.forms["new_character"]
    socket.send({type: "new",
        id: form["id"].value,
        x: form["x"].value,
        y: form["y"].value,
        color:form["color"].value,
    });
}

class Board {
    constructor() {
        this.obj = document.getElementById("board");
        this.grid = new Grid();
        document.addEventListener("DOMContentLoaded", () => {
            this.generateVisible();
        });
        this.selected = false;

        this.x = 0;
        this.y = 0;

        /* Make board draggable */
        let mouseStart;
        let boardStart;  // values shared across event handlers
        let generateTimeout;

        this.grid.obj.addEventListener("mousedown", (event) => {
            this.selected = true;
            mouseStart = {x: event.pageX, y: event.pageY};
            boardStart = {x: this.x, y: this.y};
        });
        document.addEventListener("mouseup", () => {
            this.selected = false;
        });
        document.addEventListener("mousemove", (event) => {
            if (this.selected) {
                this.x = event.pageX - mouseStart.x + boardStart.x;
                this.y = event.pageY - mouseStart.y + boardStart.y;
                if (generateTimeout) {
                    clearTimeout(generateTimeout);
                }
                generateTimeout = setTimeout(this.generateVisible.bind(this), 100);
            }
        });

        /* Make board scalable */
        this.scale = 1
        this.obj.onwheel = (event) => {
            // down
            if (event.deltaY > 0) {
                this.scale /= SCALE_SPEED;
            }

            // up
            else {
                this.scale *= SCALE_SPEED;
            }

            if (generateTimeout) {
                clearTimeout(generateTimeout);
            }
            generateTimeout = setTimeout(this.generateVisible.bind(this), 100);
        };
    }

    get scale() {
        //return parseFloat(this.obj.style.transform.match(/scale\(([\d.]+)\)/)[1]);
        return parseFloat(this.obj.style.scale);
    }
    get x() {
        return parseInt(this.obj.style.left.replace("px", ""));
    }
    get y() {
        return parseInt(this.obj.style.top.replace("px", ""));
    }
    set scale(value) {
        //this.obj.style.transform = "scale("+value+")";
        this.obj.style.scale = "" + value;
    }
    set x(value) {
        this.obj.style.left = "" + value + "px";
    }
    set y(value) {
        this.obj.style.top = "" + value + "px";
    }

    /*
     * The boundary rect of what is visible
     * (in pixel; use `Coord.fromPixel` if you need indices)
     */
    get visibleRect() {
        return {
            left: Math.floor((-this.x)/this.scale),
            top: Math.floor((-this.y)/this.scale),
            right: Math.ceil((this.obj.parentElement.offsetWidth-this.x)/this.scale),
            bottom: Math.ceil((this.obj.parentElement.offsetHeight-this.y)/this.scale)
        };
    }

    generateVisible() {
        const rect = this.visibleRect;
        const start = Coord.fromPixel(rect.left, rect.top);
        const end = Coord.fromPixel(rect.right, rect.bottom);
        for (let x = start.xIndex; x <= end.xIndex; x++) {
            for (let y = start.yIndex; y <= end.yIndex; y++) {
                this.grid.getField(x, y);
            }
        }
    }
}

class Coord {
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

const board = new Board();
