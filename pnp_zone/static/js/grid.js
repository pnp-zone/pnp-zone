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

    static svgString(width, borderWidth) {
        const bigH = new Hexagon(width);
        const smallH = new Hexagon(width - 2*borderWidth);

        const border = `<path fill-rule='evenodd' d='${bigH.asPath} ${smallH.asPath}'></path>`;
        const polygon = `<polygon points='${bigH.asPolygon}'></polygon>`;

        return "<svg version='1.1' xmlns='http://www.w3.org/2000/svg' class='field' " +
            "viewBox='-"+bigH.width/2+" -"+bigH.height/2+" "+bigH.width+" "+bigH.height+"'>" +
            polygon +
            border +
            "</svg>";
    }
}

const parseHTML = (() => {
    const parser = document.createElement("div");
    return (html) => {
        parser.innerHTML = html;
        return parser.firstChild;
    };
})();

function hexagonSVG(width, borderWidth) {
    return parseHTML(Hexagon.svgString(width, borderWidth));
}

class Grid {
    static hexString = Hexagon.svgString(512, 8);

    constructor() {
        this.fields = [];
        this.obj = document.getElementById("grid");
        for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 32; x++) {
                this.getField(x, y);
            }
        }
    }

    getField(x, y) {
        let column = this.fields[x];
        if (!column) {
            column = [];
            this.fields[x] = column;
        }

        let field = column[y];
        if (!field) {
            field = tags.div({
                class: "board-element",
                style: {
                    left: (FIELD_WIDTH*x + ((y%2 === 0) ? 0 : FIELD_WIDTH/2))+"px",
                    top: (ROW_HEIGHT*y)+"px",
                    width: FIELD_WIDTH+"px",
                    height: FIELD_HEIGHT+"px",
                },
                ondragstart: () => { return false; },
                children: [parseHTML(Grid.hexString)],
            });
            this.obj.appendChild(field);
            Character.registerMoveTarget(field, x, y);
            column[y] = field;
        }

        return field;
    }
}
