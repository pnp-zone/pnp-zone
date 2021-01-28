class Character {
    static DIV = document.getElementById("characters");

    constructor({id, x, y}) {
        this.id = id;

        const request = new XMLHttpRequest();
        request.open(
            "GET",
            "/board/load_character?room="+encodeURIComponent(room)+"&character="+encodeURIComponent(this.id),
            true);
        request.onreadystatechange = () => {
            if (request.readyState === 4) {
                if (request.status === 200) {
                    const parser = document.createElement("div");
                    parser.innerHTML = request.responseText;
                    Character.DIV.appendChild(parser.firstChild);

                    this.obj = document.getElementById(this.id);

                    this.moveTo(x, y);

                    this.obj.ondragstart = (event) => {
                        event.dataTransfer.setData("plain/text", this.id);
                    };
                } else {
                    throw Error("Couldn't load character: " + id);
                }
            }
        };
        request.send();
    }

    moveTo(x, y) {
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