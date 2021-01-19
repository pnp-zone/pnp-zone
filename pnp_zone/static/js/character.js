document.addEventListener("mousemove", function (event) {
    if (Character.selected != null) {
        Character.selected.x = Character._px2unit(event.pageX);
        Character.selected.y = Character._px2unit(event.pageY);
    }
});

class Character {
    static UNIT = "vw";
    static DIV = document.getElementById("characters");
    static selected = null;

    static _px2unit(coord) {
        return coord / window.innerWidth * 100;
    }

    constructor(id) {
        this.id = id;
        this.obj = document.getElementById(this.id);

        if (this.obj === null) {
            const request = new XMLHttpRequest();
            request.open(
                "GET",
                "/board/load_character?room="+encodeURIComponent(room)+"&character="+encodeURIComponent(this.id),
                false);
            request.send();

            const parser = document.createElement("div");
            parser.innerHTML = request.responseText;
            Character.DIV.appendChild(parser.firstChild);

            this.obj = document.getElementById(this.id);
        }

        this.width = Character._px2unit(this.obj.offsetWidth);
        this.height  = Character._px2unit(this.obj.offsetHeight);
        this.coords = {
            x: parseFloat(this.obj.style.left.replace(Character.UNIT, "")),
            y: parseFloat(this.obj.style.top.replace(Character.UNIT, "")),
        };
        // Readjust the coordinates given by django template
        this.x = this.coords.x;
        this.y = this.coords.y;

        if (this.obj.draggable) {
            this.obj.ondragstart = (event) => {
                event.dataTransfer.setData("plain/text", this.id);
            };
        } else {
            this.obj.onmousedown = () => {
                Character.selected = this;
            };
            this.obj.onmouseup = () => {
                socket.send({
                    type: "move",
                    id: this.id,
                    x: this.x,
                    y: this.y,
                });
                Character.selected = null;
            };
        }
    }

    get x() {
        return this.coords.x;
    }

    get y() {
        return this.coords.y;
    }

    set x(value) {
        this.coords.x = value;
        this.obj.style.left = value - this.width/2 + Character.UNIT;
    }

    set y(value) {
        this.coords.y = value;
        this.obj.style.top = value - this.height/2 + Character.UNIT;
    }

    static registerDropTarget(obj) {
        const rect = obj.getBoundingClientRect();
        const x = Character._px2unit(rect.left + rect.width/2);
        const y = Character._px2unit(rect.top + rect.height/2);

        obj.ondragenter = (event) => {
            event.preventDefault();
        };
        obj.ondragover = (event) => {
            event.preventDefault();
        };
        obj.ondrop = (event) => {
            event.preventDefault();
            const id = event.dataTransfer.getData("plain/text");
            socket.send({type: "move", id: id, x: x, y: y});
        };
        obj.ondragleave = (event) => {
            event.preventDefault();
        };
    }
}
