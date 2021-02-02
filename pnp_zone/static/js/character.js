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
        const coord = Coord.fromIndex(x, y);
        const self = {width: this.obj.offsetWidth, height: this.obj.offsetHeight};
        this.obj.style.left = coord.xPixel - self.width/2 + "px";
        this.obj.style.top = coord.yPixel - self.height/2 + "px";
    }

    static registerDropTarget(obj, ondrop=null) {
        if (ondrop) {
            obj.ondrop = (event) => {
                event.preventDefault();
                const id = event.dataTransfer.getData("plain/text");
                ondrop(id);
            }
        } else {
            obj.ondrop = (event) => {
                event.preventDefault();
            }

        }

        obj.ondragenter = (event) => {
            event.preventDefault();
        };
        obj.ondragover = (event) => {
            event.preventDefault();
        };
        obj.ondragleave = (event) => {
            event.preventDefault();
        };
    }

    static registerMoveTarget(obj, x, y) {
        Character.registerDropTarget(obj, (id) => {
            socket.send({type: "move", id: id, x: x, y: y});
        });
    }

    static registerDeleteTarget(obj) {
        Character.registerDropTarget(obj, (id) => {
            socket.send({type: "delete", id: id});
        });
    }
}
