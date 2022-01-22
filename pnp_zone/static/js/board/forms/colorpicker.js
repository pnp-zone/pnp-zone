import React from "../../react.js";
import {LEFT_BUTTON} from "../../lib/mouse.js";
import {Drag} from "../drag.js";
import Color, {HSL, HSV} from "../../lib/color.js";
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

export class ColorPicker extends React.PureComponent {

    constructor(props) {
        super(props);

        this.external = new HSL();
        this.internal = new HSV();

        function set(key, value) {
            this.internal[key] = value;
            this.props.setValue(this.internal.css);
        }
        this.setHue = set.bind(this, "hue");
        this.setSaturation = set.bind(this, "saturation");
        this.setValue = set.bind(this, "value");
        this.setAlpha = set.bind(this, "alpha");
    }

    render() {
        this.external = Color.fromCSS(this.props.value).hsl;
        this.internal = this.external.hsv;
        const {hue, saturation, value, alpha} = this.internal;
        const {setHue, setSaturation, setValue, setAlpha} = this;

        return e("div", {
            className: "color-picker flex-vertical"
        }, [
            e("div", {
                key: "picker",
                className: "flex-horizontal",
                style: {
                    "--hue": hue,
                    "--saturation": `${this.external.saturation * 100}%`,
                    "--lightness": `${this.external.lightness * 100}%`
                },
            }, [
                e(SliderPlot, {
                    className: "plot sv",
                    ratioX: saturation,
                    setRatioX: setSaturation,
                    ratioY: 1 - value,
                    setRatioY(y) {
                        setValue(1 - y)
                    },
                }),
                e(SliderPlot, {
                    className: "plot hue",
                    ratioY: hue / 360,
                    setRatioY(ratio) {
                        setHue(ratio * 360)
                    },
                }),
                e(SliderPlot, {
                    className: "plot alpha",
                    ratioY: 1 - alpha,
                    setRatioY(ratio) {
                        setAlpha(1 - ratio)
                    },
                }),
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
