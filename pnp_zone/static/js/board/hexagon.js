export default class Hexagon {
    constructor(width) {
        this.center = {
            x: 0,
            y: 0,
        };

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

    contains(x, y) {
        const nx = Math.abs(x - this.center.x);
        const ny = Math.abs(y - this.center.y);

        if (ny > this.side/2) {
            const slope = -(this.b/this.a);
            return ny <= slope*nx + this.height/2;
        } else {
            return nx <= this.width/2;
        }
    }

    get x() { return this.center.x; }
    get y() { return this.center.y; }
    set x(value) {
        const dx = value - this.center.x;
        this.center.x += dx;
        for (let i = 0; i < 6; i++) {
            this.points[i][0] += dx;
        }
    }
    set y(value) {
        const dy = value - this.center.y;
        this.center.y += dy;
        for (let i = 0; i < 6; i++) {
            this.points[i][1] += dy;
        }
    }

    get asPath() {
        return "M" + this.points.map((p) => p.join(",")).join(" L") + " Z";
    }

    get asPolygon() {
        return this.points.map((p) => p.join(",")).join(" ");
    }

    static _stringCache = {};
    static _parser = document.createElement("div");

    static generateSVG(width, borderWidth) {
        let html = this._stringCache[""+width+" "+borderWidth];
        if (!html) {
            html = this._svgString(width, borderWidth);
            this._stringCache[""+width+" "+borderWidth] = html;
        }

        this._parser.innerHTML = html;
        return this._parser.firstChild;
    }

    static _svgString(width, borderWidth) {
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
