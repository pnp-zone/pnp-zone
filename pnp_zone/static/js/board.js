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

function createCharacter() {
    const form = document.forms["new_character"]
    socket.send({type: "new",
        id: form["id"].value,
        x: form["x"].value,
        y: form["y"].value,
        color:form["color"].value,
    });
}

function deleteCharacter() {
    const form = document.forms["delete_character"];
    socket.send({type: "delete",
        id: form["id"].value,
    });
}

function createGrid() {
    const board = tags.div({id: "grid", class: "board-layer"});
    for (let y = 0; y < 10; y++) {
        const row = tags.div({class: "flex-horizontal"});
        if (y%2 === 0) {
            row.appendChild(
                tags.div({style: "width: 50px"})
            );
        }
        for (let x = 0; x < 10; x++) {
            const field =
                tags.div({id: "grid-"+x+"-"+y, class: "grid-field", children: [
                    tags.img({
                        //src: "https://upload.wikimedia.org/wikipedia/commons/4/41/Regular_hexagon.svg",
                        src: "/static/svg/standing_hexagon.svg",
                        style: "height: auto, width: 100px",
                        draggable: false
                    })
                ]});
            row.appendChild(field);
            Character.registerDropTarget(field);
        }
        board.appendChild(row);
    }
    document.getElementById("grid").replaceWith(board);
}
