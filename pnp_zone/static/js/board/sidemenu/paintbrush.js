import React from "../../react.js";
import {Drag, GlobalDrag} from "../drag.js";
import {LEFT_BUTTON} from "../../lib/mouse.js";
import socket from "../../socket.js";
import {Coord, Line} from "../grid.js";
import {ColorPicker} from "../forms/colorpicker.js";
import staticUrl from "../../lib/static.js";
const e = React.createElement;

const Modes = {
    PAINT: "paint",
    ERASE: "erase",
};
const ModeIcons = {
    [Modes.PAINT]: staticUrl("img/paintbrush.svg"),
    [Modes.ERASE]: staticUrl("img/eraser.svg"),
};

class PaintDrag extends Drag {
    constructor(visitCallback) {
        super();
        this.register(LEFT_BUTTON, this);
        this.visitCallback = visitCallback;
        this.previously = null;
        this.visited = {};
    }
    visit(x, y) {
        if (isNaN(x) || isNaN(y))
            return;

        const key = ""+x+" "+y;
        if (!this.visited.hasOwnProperty(key)) {
            this.visited[key] = null;
            this.visitCallback(x, y);
        }
    }
    dragStart(event) {
        this.previously = Coord.fromIndex(event.nativeEvent.gridX, event.nativeEvent.gridY);
        this.visit(event.nativeEvent.gridX, event.nativeEvent.gridY);
    }
    dragMove(event) {
        const points = (new Line(this.previously, Coord.fromIndex(event.gridX, event.gridY))).points;
        for (let i = 0; i < points.length; i++) {
            this.visit(points[i].xIndex, points[i].yIndex);
        }
        this.previously = Coord.fromIndex(event.gridX, event.gridY);
    }
    dragEnd() {
        this.visited = {};
    }
}

export default class Paintbrush extends React.PureComponent {

    constructor(props) {
        super(props);
        this.state = {
            background: "hsla(0, 0%, 100%, 1)",
            border: "hsla(0, 0%, 0%, 1)",
            mode: null,
            colorPicker: "background",
        };

        this.toColor = [];
        this.toErase = [];
        this.sendTimeout = null;

        this.drag = {
            [Modes.PAINT]: new PaintDrag((x, y) => {
                this.toColor.push([x, y]);
                const {background, border} = this.state;
                socket.sendLocally({type: "layer.set", layer: this.props.layer, key: `${x} ${y}`, object: {x, y, background, border}});

                if (!this.sendTimeout)
                    this.sendTimeout = setTimeout(this.send.bind(this), 1000);
            }),
            [Modes.ERASE]: new PaintDrag((x, y) => {
                this.toErase.push([x, y]);
                socket.sendLocally({type: "layer.delete", layer: this.props.layer, key: `${x} ${y}`});

                if (!this.sendTimeout)
                    this.sendTimeout = setTimeout(this.send.bind(this), 1000);
            }),
        };
    }

    send() {
        if (this.toColor.length > 0) {
            const {background, border} = this.state;
            socket.send({type: "tiles.color", tiles: this.toColor, background, border, layer: this.props.layer});
            this.toColor = [];
        }
        if (this.toErase.length > 0) {
            socket.send({type: "tiles.delete", tiles: this.toErase, layer: this.props.layer});
            this.toErase = [];
        }
        this.sendTimeout = null;
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.drag[prevState.mode] !== undefined) {
            document.body.style.cursor = "";
            GlobalDrag.removeHandler(this.drag[prevState.mode].onMouseDown);
        }
        if (this.drag[this.state.mode] !== undefined) {
            document.body.style.cursor = "crosshair";
            GlobalDrag.addHandler(this.drag[this.state.mode].onMouseDown);
        }
    }

    renderModeSwitch(mode) {
        const setState = this.setState.bind(this);
        return e("button", {
            key: `${mode}Mode`,
            className: this.state.mode === mode ? "active" : "",
            onClick() {setState((state) => ({mode: state.mode === mode ? null : mode}));},
        }, [
            e("img", {src: ModeIcons[mode], width: 32, height: 32})
        ]);
    }

    render() {
        const setState = this.setState.bind(this);
        const {background, border} = this.state;
        return e("div", {
            className: "margin",
        }, [
            Object.values(Modes).map(this.renderModeSwitch.bind(this)),
            e("div", {
                className: "flex-horizontal",
            }, [
                e("div", {
                    key: "tilePreview",
                    className: "tilePreview",
                }, [
                    e("div", {
                        key: "borderPreview",
                        className: "hexagon",
                        style: {"--color": this.state.border,},
                        onClick() {
                            setState({colorPicker: "border"});
                        },
                    }),
                    e("div", {
                        key: "backgroundPreview",
                        className: "hexagon",
                        style: {"--color": this.state.background,},
                        onClick() {
                            setState({colorPicker: "background"});
                        },
                    })
                ]),
                e("button", {
                    onClick() {
                        socket.send({type: "background.color", background, border});
                    }
                }, "Set as background")
            ]),
            e(ColorPicker, {
                value: this.state[this.state.colorPicker],
                setValue(value) {
                    setState((state) => ({[state.colorPicker]: value}));
                }
            }),
        ]);
    }
}
