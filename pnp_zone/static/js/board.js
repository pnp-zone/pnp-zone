const room = window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1);
const characters = {};
const socket = new Socket();
const FIELD_WIDTH = 100;
const FIELD_HEIGHT = FIELD_WIDTH*0.865;
const SCALE_SPEED = 0.01;

function init({ boardWidth }) {
    new Board();

    // Create grid
    const grid = tags.div({id: "grid", class: "board-element"});
    for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
            const field = createField(x, y);
            Character.registerMoveTarget(field);
            grid.appendChild(field);
        }
    }
    document.getElementById("grid").replaceWith(grid);

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

function createField(x, y) {
    return tags.div({
        id: "grid-"+x+"-"+y, class: "board-element",
        style: {
            left: (FIELD_WIDTH*x + ((y%2 === 0) ? 0 : FIELD_WIDTH/2))+"px",
            top: (FIELD_HEIGHT*y)+"px"
        },
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
        this.selected = false;

        this.x = 0;
        this.y = 0;

        // Values shared across event handlers
        let mouseStart;
        let boardStart;

        this.obj.addEventListener("mousedown", (event) => {
            this.selected = true;
            mouseStart = {x: event.pageX, y: event.pageY};
            boardStart = {x: this.x, y: this.y};
        });
        this.obj.addEventListener("mouseleave", () => {
            this.selected = false;
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

        // Make board scalable
        this.scale = 1
        this.obj.onwheel = (event) => {
            // down
            if (event.deltaY > 0) {
                this.scale -= SCALE_SPEED;
            }

            // up
            else {
                this.scale += SCALE_SPEED;
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
