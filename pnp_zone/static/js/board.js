createGrid();

const room = window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1);

let characters = {};
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

const socket = new Socket();
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

(() => {
    const deleteCharacter = document.getElementById("deleteCharacter");
    if (deleteCharacter) {
        Character.registerDeleteTarget(deleteCharacter);
    }

    const SCALE_SPEED = 0.01
    const board = document.getElementById("board");
    board.style.scale = "1";
    board.onwheel = (event) => {
        // down
        if (event.deltaY > 0) {
            board.style.scale = ""+(parseFloat(board.style.scale) - SCALE_SPEED);
        }

        // up
        else {
            board.style.scale = ""+(parseFloat(board.style.scale) + SCALE_SPEED);
        }
    };
})();

function createField(x, y) {
    return tags.div({
        id: "grid-"+x+"-"+y, class: "board-element",
        style: {
            left: (100*x + ((y%2 === 0) ? 0 : 50))+"px",
            top: (86*y)+"px"
        },
        children: [
            tags.img({
                src: "/static/svg/standing_hexagon.svg",
                style: {
                    width: "100px",
                    height: "auto"
                },
                draggable: false
            })
    ]});
}

function createCharacter() {
    const form = document.forms["new_character"]
    socket.send({type: "new",
        id: form["id"].value,
        x: form["x"].value,
        y: form["y"].value,
        color:form["color"].value,
    });
}

function createGrid() {
    const board = tags.div({id: "grid", class: "board-element"});
    for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
            const field = createField(x, y);
            Character.registerMoveTarget(field);
            board.appendChild(field);
        }
    }
    document.getElementById("grid").replaceWith(board);
}
