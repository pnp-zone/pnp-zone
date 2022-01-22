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

export default class Color {
    static fromCSS(css) {
        const hsl = css.match(/hsla?\((\d+(?:\.\d+)?), (\d+(?:\.\d+)?)%, (\d+(?:\.\d+)?)%, ([01](?:\.\d+)?)\)/);
        if (hsl) {
            const [_, h, s, l, a] = hsl;
            return new HSL(parseFloat(h), parseFloat(s) / 100, parseFloat(l) / 100, parseFloat(a))
        }
    }
}
