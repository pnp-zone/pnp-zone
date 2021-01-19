const room = window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1);

let characters = {};
for (let i = 0; i < Character.DIV.children.length; i++) {
    const id = Character.DIV.children[i].id;
    characters[id] = new Character(id);
}

document.onmousemove = function (event) {
    if (Character.selected != null) {
        Character.selected.x = Character._px2unit(event.pageX);
        Character.selected.y = Character._px2unit(event.pageY);
    }
};

const socket = new Socket();
socket.registerEvent("move", (event) => {
    const obj = characters[event.id];
    const deltaX = event.x - obj.x;
    const deltaY = event.y - obj.y;
    let currentD = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
    const stepSize = 0.1;
    const stepNumber = currentD / stepSize;
    const stepX = deltaX/currentD*stepSize;
    const stepY = deltaY/currentD*stepSize;

    let i = 0;
    function doStep() {
        if (i <= stepNumber) {
            if (currentD < stepSize) {
                obj.x = event.x;
                obj.y = event.y;
                currentD = 0;
            } else {
                obj.x += stepX;
                obj.y += stepY;
                currentD += stepSize;
            }

            i++;
            setTimeout(doStep, 1);
        }
    }
    doStep();
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
}