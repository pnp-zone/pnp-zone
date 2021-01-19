const room = window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1);

let characters = {};
for (let i = 0; i < Character.DIV.children.length; i++) {
    const id = Character.DIV.children[i].id;
    characters[id] = new Character(id);
}

const socket = new Socket();
socket.registerEvent("move", (event) => {
    characters[event.id].moveTo(event.x, event.y);
});
socket.registerEvent("new", (event) => {
    characters[event.id] = new Character(event.id);
});
socket.registerEvent("reload", () => {
    window.location.reload(true);
});
socket.registerEvent("error", (event) => {
    console.error(event.message);
});
socket.registerEvent("delete", (event) => {
    characters[event.id].obj.delete();
    characters[event.id] = new Character(event.id);
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