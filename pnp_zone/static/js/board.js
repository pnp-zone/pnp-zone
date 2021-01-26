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

/* WIP: */

function field_coords(field) {
    const match = field.id.match(/grid-(\d+)-(\d+)/);
    const x = parseInt(match[1]);
    const y = parseInt(match[2]);
    return { x: x, y: y};
}

const fields = document.getElementsByClassName("grid-field");
for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    field.onclick = (event) => {
        console.log("Clicked field: ", field_coords(field));
    }
    Character.registerDropTarget(field);
}