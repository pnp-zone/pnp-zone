export class HSV {
    constructor(hue, saturation, value, alpha = 1) {
        this.hue = hue;
        this.saturation = saturation;
        this.value = value;
        this.alpha = alpha;
    }

    get hsv() {
        return new HSV(this.hue, this.saturation, this.value, this.alpha);
    }

    get hsl() {
        const lightness = this.value * (1 - this.saturation / 2);
        let saturation = (this.value - lightness) / Math.min(lightness, 1 - lightness);
        if (!Number.isFinite(saturation)) saturation = 0;
        return new HSL(this.hue, saturation, lightness, this.alpha);
    }

    get css() {
        return this.hsl.css;
    }
}

export class HSL {
    constructor(hue, saturation, lightness, alpha = 1) {
        this.hue = hue;
        this.saturation = saturation;
        this.lightness = lightness;
        this.alpha = alpha;
    }

    get hsv() {
        const value = this.lightness + this.saturation * Math.min(this.lightness, 1 - this.lightness);
        let saturation = 2 * (1 - this.lightness / value);
        if (!Number.isFinite(saturation)) saturation = 0;
        return new HSV(this.hue, saturation, value, this.alpha);
    }

    get hsl() {
        return new HSL(this.hue, this.saturation, this.lightness, this.alpha);
    }

    get css() {
        return `hsla(${this.hue}, ${this.saturation * 100}%, ${this.lightness * 100}%, ${this.alpha})`;
    }
}

export class RGB {
    constructor(red, green, blue, alpha = 1) {
        this.red = red;
        this.green = green;
        this.blue = blue;
        this.alpha = alpha;
    }

    commonConversion() {
        const min = Math.min(this.red, this.green, this.blue);
        const max = Math.max(this.red, this.green, this.blue);
        const chroma = max - min;
        let hue;
        if (chroma === 0)
            hue = 0;
        else if (max === this.red)
            hue = 60 * (0 + (this.green - this.blue) / chroma);
        else if (max === this.green)
            hue = 60 * (2 + (this.blue - this.red) / chroma);
        else if (max === this.blue)
            hue = 60 * (4 + (this.red - this.green) / chroma);
        return {hue, chroma, value: max};
    }

    get hsv() {
        const {hue, chroma, value} = this.commonConversion();
        let saturation;
        if (value === 0) saturation = 0;
        else saturation = chroma / value;
        return new HSV(hue, saturation, value, this.alpha);
    }

    get hsl() {
        const {hue, chroma, value} = this.commonConversion();
        const lightness = value - chroma/2;
        let saturation;
        if (lightness === 0 || lightness === 1) saturation = 0;
        else saturation = (value - lightness) / Math.min(lightness, 1 - lightness);
        return new HSL(hue, saturation, lightness, this.alpha);
    }

    get rgb() {
        return new RGB(this.red, this.green, this.blue, this.alpha);
    }

    get css() {
        return `rgba(${this.red}, ${this.green}, ${this.blue}, ${this.alpha})`;
    }
}

function parseNumber(string) {
    const match = string.trim().match(/(\d*(?:\.\d+)?)(%?)/);
    if (match) {
        const [_, number, percent] = match;
        return parseFloat(number) / (percent ? 100 : 1);
    } else
        return NaN;
}

export default class Color {

    static colorConverter = null;

    static fromCSS(css) {
        const functionLike = css.match(/^(\w+)\(([^)]+)\)$/);
        if (functionLike) {
            const [_, func, argString] = functionLike;

            const args = argString.split(",").map(parseNumber);
            if (args.filter(isNaN).length > 0 || args.length < 3 || args.length > 4) return;

            switch (func) {
                case "hsl":
                case "hsla":
                    return new HSL(...args);
                case "rgb":
                case "rgba":
                    return new RGB(...args);
                case "hsv":
                case "hsva":
                    return new HSV(...args);
            }
        }

        const hexLike = css.match(/^#?([0-9A-Fa-f]+)$/);
        if (hexLike) {
            const [_, digitString] = hexLike;

            let nDigit;
            if (digitString.length === 3 || digitString.length === 4) nDigit = 1;
            else if (digitString.length === 6 || digitString.length === 8) nDigit = 2;
            else return;

            const args = [];
            for (let i = 0; i < digitString.length; i += nDigit)
                args.push(parseInt(digitString.substr(i, nDigit), 16) * (nDigit === 1 ? 16 : 1));
            if (args.length === 4)
                args[3] /= 255;

            return new RGB(...args);
        }

        // Slow and dirty
        const nameLike = css.match(/^(\w+)$/);
        if (nameLike) {
            const [_, name] = nameLike;
            if (Color.colorConverter === null) {
                Color.colorConverter = document.createElement("div");
                Color.colorConverter.id = "color-converter";
                Color.colorConverter.style.display = "none";
                document.body.append(Color.colorConverter);
            }
            Color.colorConverter.style.color = "rgba(0, 0, 0, 0)";
            Color.colorConverter.style.color = name;
            const newCss = window.getComputedStyle(Color.colorConverter).color;
            if (newCss === "rgba(0, 0, 0, 0)" && name !== "transparent") return;
            else return Color.fromCSS(newCss);
        }
    }
}
