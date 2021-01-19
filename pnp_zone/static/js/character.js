class Character {
    static DIV = document.getElementById("characters");

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

        console.log(this.obj.style);
        this._x = parseInt(this.obj.style.left.replace("px", ""));
        this._y = parseInt(this.obj.style.top.replace("px", ""));
        console.log(this._x);
        this.moveTo(this._x, this._y);

        this.obj.ondragstart = (event) => {
            event.dataTransfer.setData("plain/text", this.id);
        };
    }

    get x() {
        return this._x;
    }

    get y() {
        return this._y;
    }

    moveTo(x, y) {
        this._x = x;
        this._y = y;
        const field = document.getElementById("grid-"+x+"-"+y);
        if (field) {
            const target = field.getBoundingClientRect();
            const self = this.obj.getBoundingClientRect();
            this.obj.style.left = target.x + target.width/2 - self.width/2 + "px";
            this.obj.style.top = target.y + target.height/2 - self.height/2 + "px";
        } else {
            console.error("Coordinates are out of range:", x, y);
        }
    }

    static registerDropTarget(obj) {
        const match = obj.id.match(/^grid-(\d+)-(\d+)$/);
        const x = parseInt(match[1]);
        const y = parseInt(match[2]);

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
