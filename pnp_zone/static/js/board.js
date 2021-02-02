const room = window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1);
const characters = {};
const socket = new Socket();
const FIELD_WIDTH = 100;
const FIELD_HEIGHT = 124;
const ROW_HEIGHT = FIELD_WIDTH*0.865;
const SCALE_SPEED = 1.1;


let board;
function init({ boardWidth }) {
    board = new Board();

    // Scale background image
    document.addEventListener("DOMContentLoaded", () => {
        const background = document.getElementById("background");
        background.style.transform = "scale("+((boardWidth*FIELD_WIDTH + 0.5*FIELD_WIDTH)/background.width)+")";
        background.style.transformOrigin = "left top";
    });

    // Get and add characters
    const request = new XMLHttpRequest();
    request.open("GET", "/board/load_room?room="+encodeURIComponent(room), true);
    request.responseType = "json";
    request.onreadystatechange = () => {
        if (request.readyState === 4) {
            if (request.status === 200) {
                request.response.characters.forEach((character) => {
                    characters[character.id] = new Character(character);
                });
            }
        }
    };
    request.send();

    // Add delete functionality
    const deleteCharacter = document.getElementById("deleteCharacter");
    if (deleteCharacter) {
        Character.registerDeleteTarget(deleteCharacter);
    }

    // Setup socket
    socket.registerEvent("move", (event) => {
        characters[event.id].moveTo(event.x, event.y);
    });
    socket.registerEvent("new", (event) => {
        characters[event.id] = new Character({id: event.id, x: event.x, y: event.y});
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
        this.selected = false;

        this.x = 0;
        this.y = 0;

        /* Make board draggable */
        let mouseStart;
        let boardStart;  // values shared across event handlers

        this.grid.obj.addEventListener("mousedown", (event) => {
            this.selected = true;
            mouseStart = {x: event.pageX, y: event.pageY};
            boardStart = {x: this.x, y: this.y};
        });
        document.addEventListener("mouseup", () => {
            this.selected = false
        });
        document.addEventListener("mousemove", (event) => {
            if (this.selected) {
                this.x = event.pageX - mouseStart.x + boardStart.x;
                this.y = event.pageY - mouseStart.y + boardStart.y;
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
            // triangle points A, B, C
            //
            // v0 = C - A
            // v1 = B - A
            // v2 = P - A
            //
            // dot00 = dot(v0, v0)
            // dot01 = dot(v0, v1)
            // dot02 = dot(v0, v2)
            // dot11 = dot(v1, v1)
            // dot12 = dot(v1, v2)
            //
            // invDenom = 1 / (dot00 * dot11 - dot01 * dot01)
            // u = (dot11 * dot02 - dot01 * dot12) * invDenom
            // v = (dot00 * dot12 - dot01 * dot02) * invDenom
            //
            // return (u >= 0) && (v >= 0) && (u + v < 1)
            console.error("Not implemented");
            const A = {x: coord.left + FIELD_WIDTH, y: coord.top + FIELD_HEIGHT - ROW_HEIGHT};
            const B = {x: coord.left, y: coord.top + FIELD_HEIGHT - ROW_HEIGHT};
            const C = {x: coord.left + FIELD_WIDTH/2, y: coord.top};
            const P = {x: x, y: y}

            const v0 = {x: C.x - A.x, y: C.y - A.y};
            const v1 = {x: B.x - A.x, y: B.y - A.y};
            const v2 = {x: P.x - A.x, y: P.y - A.y};

            const dot00 = v0.x * v0.x + v0.y * v0.y;
            const dot01 = v0.x * v1.x + v0.y * v1.y;
            const dot02 = v0.x * v2.x + v0.y * v2.y;
            const dot11 = v1.x * v1.x + v1.y * v1.y;
            const dot12 = v1.x * v2.x + v1.y * v2.y;

            const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
            const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
            const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

            console.log((u >= 0) && (v >= 0) && (u + v < 1) ? "drin": "draus");
            /*
            TODO:
                test whether the point lies in the top triangle of the hexagon.
                if it does not readjust it
            */
        }

        return coord;
    }
}

class Grid {
    constructor() {
        this.fields = [];
        this.obj = document.getElementById("grid");
        for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 32; x++) {
                this.appendField(x, y);
            }
        }
    }

    appendField(x, y) {
        const field = tags.div({
            class: "board-element",
            style: {
                left: (FIELD_WIDTH*x + ((y%2 === 0) ? 0 : FIELD_WIDTH/2))+"px",
                top: (ROW_HEIGHT*y)+"px"
            },
            ondragstart: () => { return false; },
            children: [
                tags.img({
                    src: "/static/svg/standing_hexagon.svg",
                    style: {
                        width: FIELD_WIDTH+"px",
                        height: "auto"
                    },
                    draggable: false
                })
            ]});
        this.obj.appendChild(field);
        this.setField(x, y, field)
        Character.registerMoveTarget(field, x, y);
    }

    getField(x, y) {
        if (this.fields.hasOwnProperty(x) && this.fields[x].hasOwnProperty(y)) {
            return this.fields[x][y];
        } else {
            return null;
        }
    }
    setField(x, y, field) {
        let column = this.fields[x];
        if (!column) {
            column = [];
            this.fields[x] = column;
        }
        column[y] = field;
    }
}
