import React from "../../react.js";
import {LEFT_BUTTON} from "../../lib/mouse.js";
import {Drag} from "../drag.js";
const e = React.createElement;

class HSV {
    constructor(hue, saturation, value, alpha = 1) {
        this.hue = hue;
        this.saturation = saturation;
        this.value = value;
        this.alpha = alpha;
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

class HSL {
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

    get css() {
        return `hsla(${this.hue}, ${this.saturation * 100}%, ${this.lightness * 100}%, ${this.alpha})`;
    }
}

function clamp(min, value, max) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
}

function SliderPlot(props) {
    const {ratioX, setRatioX, ratioY, setRatioY, className} = props;
    const ref = React.useRef(null);
    const drag = React.useMemo(function () {
        const drag = new Drag();
        drag.update = function (event) {};
        drag.register(LEFT_BUTTON, {
            dragStart(event) {
                drag.update(event);
            },
            dragMove(event) {
                drag.update(event);
            },
            dragEnd(event) {},
        });
        return drag;
    });

    drag.update = function(event) {
        if (setRatioX) setRatioX(
            clamp(0, (event.pageX - ref.current.offsetLeft) / ref.current.offsetWidth, 1)
        );
        if (setRatioY) setRatioY(
            clamp(0, (event.pageY - ref.current.offsetTop) / ref.current.offsetHeight, 1)
        );
    }

    return e("div", {
        className,
        ref,
        onMouseDown: drag.onMouseDown,
    }, [
        ratioX !== undefined ? e("div", {
            className: "slider horizontal",
            style: {"--ratio": ratioX},
        }) : null,
        ratioY !== undefined ? e("div", {
            className: "slider vertical",
            style: {"--ratio": ratioY},
        }) : null,
    ]);
}

export function ColorPicker(props) {
    const [hue, setHue] = React.useState(0);
    const [saturation, setSaturation] = React.useState(0);
    const [value, setValue] = React.useState(0);
    const [alpha, setAlpha] = React.useState(1);
    const hsl = new HSV(hue, saturation, value, alpha).hsl

    return e("div", {
        className: "color-picker flex-vertical"
    }, [
        e("div", {
            key: "picker",
            className: "flex-horizontal",
            style: {"--hue": hsl.hue, "--saturation": `${hsl.saturation*100}%`, "--lightness": `${hsl.lightness*100}%`},
        }, [
            e(SliderPlot, {
                className: "plot sv",
                ratioX: saturation,
                setRatioX: setSaturation,
                ratioY: 1 - value,
                setRatioY(y) {setValue(1 - y)},
            }),
            e(SliderPlot, {
                className: "plot hue",
                ratioY: hue / 360,
                setRatioY(ratio) {setHue(ratio*360)},
            }),
            e(SliderPlot, {
                className: "plot alpha",
                ratioY: 1 - alpha,
                setRatioY(ratio) {setAlpha(1 - ratio)},
            }),
        ]),
        e("div", {
            key: "preview",
            className: "preview",
            style: {
                backgroundColor: hsl.css,
            },
        })
    ]);
}
