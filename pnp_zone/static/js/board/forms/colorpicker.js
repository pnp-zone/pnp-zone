import React from "../../react.js";
import {LEFT_BUTTON} from "../../lib/mouse.js";
import {Drag} from "../drag.js";
import Color, {HSL, HSV, RGB} from "../../lib/color.js";
import TextInput from "./textinput.js";
const e = React.createElement;

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
        className: className
            + (ratioX !== undefined ? " horizontal" : "")
            + (ratioY !== undefined ? " vertical" : ""),
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

export class ColorPicker extends React.PureComponent {

    constructor(props) {
        super(props);

        this.hsl = new HSL();
        this.hsv = new HSV();
        this.rgb = new RGB();

        function setHSV(key, value) {
            this.hsv[key] = value;
            this.props.setValue(this.hsv.css);
        }
        this.setHue = setHSV.bind(this, "hue");
        this.setSaturation = setHSV.bind(this, "saturation");
        this.setValue = setHSV.bind(this, "value");
        this.setAlpha = setHSV.bind(this, "alpha");

        function setRGB(key, value) {
            this.rgb[key] = value;
            this.props.setValue(this.rgb.css);
        }
        this.setRed = setRGB.bind(this, "red");
        this.setGreen = setRGB.bind(this, "green");
        this.setBlue = setRGB.bind(this, "blue");
    }

    render() {
        const currentColor = Color.fromCSS(this.props.value);
        this.hsl = currentColor.hsl;
        this.hsv = this.hsl.hsv;
        this.rgb = currentColor.rgb;
        const {hue, saturation, value, alpha} = this.hsv;
        const {setHue, setSaturation, setValue, setAlpha,
               props, setRed, setGreen, setBlue} = this;

        return e("div", {
            className: "color-picker flex-vertical"
        }, [
            e("div", {
                key: "picker",
                className: "flex-horizontal",
                style: {
                    "--hue": this.hsl.hue,
                    "--saturation": `${this.hsl.saturation * 100}%`,
                    "--lightness": `${this.hsl.lightness * 100}%`,
                    "--red": this.rgb.red,
                    "--green": this.rgb.green,
                    "--blue": this.rgb.blue,
                },
            }, [
                e(SliderPlot, {
                    className: "plot sv",
                    ratioX: saturation,
                    setRatioX: setSaturation,
                    ratioY: 1 - value,
                    setRatioY(y) {setValue(1 - y);},
                }),
                e(SliderPlot, {
                    className: "plot hue",
                    ratioY: hue / 360,
                    setRatioY(ratio) {setHue(ratio * 360);},
                }),
                e(SliderPlot, {
                    className: "plot alpha",
                    ratioY: 1 - alpha,
                    setRatioY(ratio) {setAlpha(1 - ratio);},
                }),
                e("div", {className: "flex-vertical"}, [
                    e(SliderPlot, {
                        className: "plot red",
                        ratioX: this.rgb.red / 255,
                        setRatioX(ratio) {setRed(ratio * 255);},
                    }),
                    e(SliderPlot, {
                        className: "plot green",
                        ratioX: this.rgb.green / 255,
                        setRatioX(ratio) {setGreen(ratio * 255);},
                    }),
                    e(SliderPlot, {
                        className: "plot blue",
                        ratioX: this.rgb.blue / 255,
                        setRatioX(ratio) {setBlue(ratio * 255);},
                    }),
                    e(LazyInput, {
                        value: props.value,
                        setValue(css) {
                            const color = Color.fromCSS(css);
                            if (color) props.setValue(color.hsl.css);
                        },
                    }),
                ]),
            ]),
            e("div", {
                key: "preview",
                className: "preview",
                style: {
                    backgroundColor: this.props.value,
                },
            })
        ]);
    }
}

function LazyInput(props) {
    const {value, setValue} = props;
    const [v, setV] = React.useState(value);
    React.useEffect(() => {
        setV(value);
    }, [value]);
    return e("form", {
        onSubmit(event) {
            event.preventDefault();
            setValue(v);
        },
    }, [
        e(TextInput, {value: v, setValue: setV}),
    ]);
}
