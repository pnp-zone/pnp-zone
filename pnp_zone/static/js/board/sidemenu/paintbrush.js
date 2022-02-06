import React from "../../react.js";
import {Drag, GlobalDrag} from "../drag.js";
import {LEFT_BUTTON} from "../../lib/mouse.js";
import socket from "../../socket.js";
import {Coord, Line} from "../grid.js";
import {ColorPicker} from "../forms/colorpicker.js";
const e = React.createElement;

const Modes = {
    PAINT: "paint",
    ERASE: "erase",
    NONE: "none",
};

export default class Paintbrush extends React.PureComponent {

    constructor(props) {
        super(props);
        this.state = {
            background: "hsla(0, 0%, 100%, 1)",
            border: "hsla(0, 0%, 0%, 1)",
            mode: Modes.NONE,
            colorPicker: "background",
        };

        this.toSend = [];
        this.sendTimeout = null;
        this.visited = {};
        this.previously = null;  //previously colored Tile

        this.drag = new Drag();
        this.drag.register(LEFT_BUTTON, this);
    }

    send() {
        if (this.state.mode === Modes.PAINT) {
            const {background, border} = this.state;
            socket.send({type: "tiles.color", tiles: this.toSend, background, border,});
        } else if (this.state.mode === Modes.ERASE) {
            socket.send({type: "tiles.delete", tiles: this.toSend,});
        }
        this.toSend = [];
        this.sendTimeout = null;
    }

    color(x, y) {
        if (isNaN(x) || isNaN(y)) {
            return;
        }

        const key = ""+x+" "+y;
        if (!this.visited.hasOwnProperty(key)) {
            this.visited[key] = null;

            this.toSend.push([x, y]);
            if (!this.sendTimeout)  {
                this.sendTimeout = setTimeout(this.send.bind(this), 1000);
            }

            // Directly write tile to board
            if (this.state.mode === Modes.PAINT) {
                const {background, border} = this.state;
                socket.sendLocally({type: "layer.set", layer: "tiles", key: `${x} ${y}`, object: {x, y, background, border}});
            } else if (this.state.mode === Modes.ERASE) {
                socket.sendLocally({type: "layer.delete", layer: "tiles", key: `${x} ${y}`});
            }
        }
    }

    dragStart(event) {
        this.previously = Coord.fromIndex(event.nativeEvent.gridX, event.nativeEvent.gridY);
        this.color(event.nativeEvent.gridX, event.nativeEvent.gridY);
    }
    dragMove(event) {
        const points = (new Line(this.previously, Coord.fromIndex(event.gridX, event.gridY))).points;
        for (let i = 0; i < points.length; i++) {
            this.color(points[i].xIndex, points[i].yIndex);
        }
        this.previously = Coord.fromIndex(event.gridX, event.gridY);
    }
    dragEnd() {
        this.visited = {};
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.mode !== prevState.mode) {
            if (this.state.mode === Modes.NONE) {
                GlobalDrag.removeHandler(this.drag.onMouseDown);
                document.body.style.cursor = "";
            } else {
                GlobalDrag.addHandler(this.drag.onMouseDown);
                document.body.style.cursor = "crosshair";
            }
        }
    }

    render() {
        const setState = this.setState.bind(this);
        const {background, border} = this.state;
        return e("div", {
            className: "margin",
        }, [
            e("button", {
                key: "paintMode",
                className: this.state.mode === Modes.PAINT ? "active" : "",
                onClick() {setState((state) => ({mode: state.mode === Modes.PAINT ? Modes.NONE : Modes.PAINT}));},
            }, [
                e("img", {src: "/static/img/paintbrush.svg", width: 32, height: 32})
            ]),
            e("button", {
                key: "eraseMode",
                className: this.state.mode === Modes.ERASE ? "active" : "",
                onClick() {setState((state) => ({mode: state.mode === Modes.ERASE ? Modes.NONE : Modes.ERASE}));},
            }, [
                e("img", {src: "/static/img/eraser.svg", width: 32, height: 32})
            ]),
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
