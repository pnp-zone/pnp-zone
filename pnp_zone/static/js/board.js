let socket = new Socket();
socket.register_event("move", (event) => {
    const obj = document.getElementById(event.id);
    obj.style.left = event.x + "px";
    obj.style.top = event.y + "px";
});
socket.register_event("reload", () => {
    window.location.reload(true);
});
socket.register_event("error", (event) => {
    console.error(event.message);
});

function center(obj, x, y) {
    return {x: x - (obj.offsetWidth/2), y: y - (obj.offsetHeight/2)};
}

let selected = null;
document.onmousemove = function (event) {
    if (selected != null) {
        const { x, y } = center(selected, event.pageX, event.pageY);
        selected.style.left = x + "px";
        selected.style.top = y + "px";
    }
};

const characters = document.getElementsByClassName("character");
for (let i = 0; i < characters.length; i++) {
    const character = characters[i];
    character.onclick = function(event) {
        if (selected === character) {
            const { x, y } = center(selected, event.pageX, event.pageY);
            socket.send({
                type: "move",
                id: selected.id,
                x: x,
                y: y,
            });
            selected = null;
        } else {
            selected = character;
        }
    };
}