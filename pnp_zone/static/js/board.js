const room = window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1);

let socket = new Socket();
socket.registerEvent("move", (event) => {
    const obj = document.getElementById(event.id);
    moveObj(obj, event.x, event.y);
});
socket.registerEvent("new", (event) => {
    const request = new XMLHttpRequest();
    request.onreadystatechange = () => {
        if (request.readyState === 4) {
            if (request.status === 200) {
                addCharacter(request.responseText);
            } else {
                console.error("Couldn't load character: ", event.id);
            }
        }
    };
    request.open("GET", "/board/load_character?room="+room+"&character="+event.id, true);
    request.send()
});
socket.registerEvent("reload", () => {
    window.location.reload(true);
});
socket.registerEvent("error", (event) => {
    console.error(event.message);
});

socket.registerEvent("delete", (event) => {
    document.getElementById(event.id).remove();
});

function moveObj(obj, x, y) {
    obj.style.left = x - (obj.offsetWidth/2) + "px";
    obj.style.top = y - (obj.offsetHeight/2) + "px";
}

let selected = null;
document.onmousemove = function (event) {
    if (selected != null) {
        moveObj(selected, event.pageX, event.pageY);
    }
};

function addCharacter(character) {
    if (typeof character === "string") {
        const parser = document.createElement("div");
        parser.innerHTML = character;
        character = parser.firstChild;
        document.getElementById("characters").appendChild(character);
    }

    moveObj(character, character.offsetLeft, character.offsetTop);

    character.onclick = function(event) {
        if (selected === character) {
            socket.send({
                type: "move",
                id: selected.id,
                x: event.pageX,
                y: event.pageY,
            });
            selected = null;
        } else {
            selected = character;
        }
    };
}

const characters = document.getElementsByClassName("character");
for (let i = 0; i < characters.length; i++) {
    addCharacter(characters[i]);
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

function deleteCharacter() {
    const form = document.forms["delete_character"];
    socket.send({type: "delete",
        id: form["id"].value,
    });
}