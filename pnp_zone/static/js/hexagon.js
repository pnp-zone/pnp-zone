export default class Hexagon {
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

export const parseHTML = (() => {
    const parser = document.createElement("div");
    return (html) => {
        parser.innerHTML = html;
        return parser.firstChild;
    };
})();

export function hexagonSVG(width, borderWidth) {
    return parseHTML(Hexagon.svgString(width, borderWidth));
}