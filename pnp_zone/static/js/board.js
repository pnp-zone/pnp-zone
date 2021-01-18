const room = window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1);

let socket = new Socket();
socket.registerEvent("move", (event) => {
    const obj = document.getElementById(event.id);
    const targetX = (event.x - obj.offsetWidth/2) / window.innerWidth * 100;
    const targetY = (event.y - obj.offsetHeight/2) / window.innerWidth * 100;
    let currentX = parseFloat(obj.style.left.replace("vw", ""));
    let currentY = parseFloat(obj.style.top.replace("vw", ""));
    let currentD = Math.sqrt(Math.pow(targetX-currentX, 2) + Math.pow(targetY-currentY, 2));
    const stepSize = 0.1;
    const stepNumber = currentD / stepSize;
    const stepX = (targetX-currentX)/currentD*stepSize;
    const stepY = (targetY-currentY)/currentD*stepSize;

    let i = 0;
    function doStep() {
        if (i <= stepNumber) {
            if (currentD < stepSize) {
                currentX = targetX;
                currentY = targetY;
                currentD = 0;
            } else {
                currentX += stepX;
                currentY += stepY;
                currentD += stepSize;
            }
            obj.style.left = currentX + "vw";
            obj.style.top = currentY + "vw";

            i++;
            setTimeout(doStep, 1);
        }
    }
    doStep();
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
    request.open("GET", "/board/load_character?room="+encodeURIComponent(room)+"&character="+encodeURIComponent(event.id), true);
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
    obj.style.left = (x - obj.offsetWidth/2) / window.innerWidth * 100 + "vw";
    obj.style.top = (y - obj.offsetHeight/2) / window.innerWidth * 100 + "vw";
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

    character.onmousedown = (event) => {
        selected = character;
    };
    character.onmouseup = (event) => {
        socket.send({
            type: "move",
            id: selected.id,
            x: event.pageX,
            y: event.pageY,
        });
        selected = null;
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