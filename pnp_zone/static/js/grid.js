class Hexagon {
    constructor(width) {
        this.a = width/2;
        this.b = this.a / Math.sqrt(3);

        this.side = Math.sqrt(Math.pow(this.a, 2) + Math.pow(this.b, 2));
        this.width = width;
        this.height = this.side + (2 * this.b);

        this.points = [
            [-this.a, this.side/2],
            [0, this.height/2],
            [this.a, this.side/2],
            [this.a, -this.side/2],
            [0, -this.height/2],
            [-this.a, -this.side/2]
        ];
    }

    get asPath() {
        return "M" + this.points.map((p) => p.join(",")).join(" L") + " Z";
    }

    get asPolygon() {
        return this.points.map((p) => p.join(",")).join(" ");
    }
}

const parser = tags.div({});
function hexagonSVG(width, borderWidth) {
    const bigH = new Hexagon(width);
    const smallH = new Hexagon(width - 2*borderWidth);
    const border = "<path fill-rule='evenodd' d='" +
        bigH.asPath +
        smallH.asPath +
        "'></path>"
    const polygon = "<polygon points='" +
        smallH.asPolygon +
        "'></polygon>";
    parser.innerHTML = "<svg version='1.1' xmlns='http://www.w3.org/2000/svg' class='field' " +
        "viewBox='-"+bigH.width/2+" -"+bigH.height/2+" "+bigH.width+" "+bigH.height+"'>" +
        border +
        polygon +
        "</svg>";
    return parser.firstChild;
}

class Grid {
    constructor() {
        this.fields = [];
        this.obj = document.getElementById("grid");
        for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 32; x++) {
                this.appendField(x, y);
            }
        }
    }

    appendField(x, y) {
        const field = tags.div({
            class: "board-element",
            style: {
                left: (FIELD_WIDTH*x + ((y%2 === 0) ? 0 : FIELD_WIDTH/2))+"px",
                top: (ROW_HEIGHT*y)+"px",
                width: FIELD_WIDTH+"px",
                height: FIELD_HEIGHT+"px",
            },
            ondragstart: () => { return false; },
            children: [hexagonSVG(100, 2)],
            /*children: [
                tags.img({
                    src: "/static/svg/standing_hexagon.svg",
                    style: {
                        width: FIELD_WIDTH+"px",
                        height: "auto"
                    },
                    draggable: false
                })
            ]*/});
        this.obj.appendChild(field);
        this.setField(x, y, field)
        Character.registerMoveTarget(field, x, y);
    }

    getField(x, y) {
        if (this.fields.hasOwnProperty(x) && this.fields[x].hasOwnProperty(y)) {
            return this.fields[x][y];
        } else {
            return null;
        }
    }
    setField(x, y, field) {
        let column = this.fields[x];
        if (!column) {
            column = [];
            this.fields[x] = column;
        }
        column[y] = field;
    }
}
