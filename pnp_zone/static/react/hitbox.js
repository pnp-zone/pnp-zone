import React from "https://cdn.skypack.dev/react";
import {Drag, LEFT_BUTTON} from "../js/lib/mouse.js";
const e = React.createElement;

const CSS = {
    BOBBLE: "hitbox-bobble",
    HITBOX: "hitbox",
    FRAME: "hitbox-frame",
}

function dragStart(ns, we) {
    return function (event) {
        switch (ns) {
            case "n":
                this.setState((state) => ({
                    y: state.onBottom ? state.y : (state.y + state.height),
                    onBottom: true,
                }));
                break;
            case "s":
                this.setState((state) => ({
                    y: state.onBottom ? (state.y - state.height) : state.y,
                    onBottom: false,
                }));
                break;
        }
        switch (we) {
            case "w":
                this.setState((state) => ({
                    x: state.onRight ? state.x : (state.x + state.width),
                    onRight: true,
                }));
                break;
            case "e":
                this.setState((state) => ({
                    x: state.onRight ? (state.x - state.width) : state.x,
                    onRight: false,
                }));
                break;
        }
    }
}

function dragMove(ns, we) {
    return function (event) {
        const {x, y,} = this.state;
        let {width, height} = this.state;
        const ratio = width / height;

        if (ns !== "") {
            height = Math.abs(y - event.boardY);
        }
        if (we !== "") {
            width = Math.abs(x - event.boardX);
        }

        if (ns !== "" && we !== "") {
            if (height * ratio > width) {
                width = height * ratio;
            } else if (width / ratio > height) {
                height = width / ratio;
            }
        }

        this.setState({width, height});
    }
}

export default class Hitbox extends React.Component {

    static orientations = [
        ["n", ""],
        ["n", "e"],
        ["", "e"],
        ["s", "e"],
        ["s", ""],
        ["s", "w"],
        ["", "w"],
        ["n", "w"]
    ];

    constructor(props) {
        super(props);

        this.state = {
            x: 100,
            y: 100,
            width: 100,
            height: 100,
            onRight: false,
            onBottom: false,
        };

        this.resizeDrag = {};
        for (let i = 0; i < Hitbox.orientations.length; i++) {
            const [ns, we] = Hitbox.orientations[i];
            const drag = new Drag();
            drag.register(LEFT_BUTTON, {
                dragStart: dragStart(ns, we).bind(this),
                dragMove: dragMove(ns, we).bind(this),
                dragEnd() {}
            });
            this.resizeDrag[ns+we] = drag;
        }

        let prevX, prevY;
        const drag = new Drag();
        drag.register(LEFT_BUTTON, {
            dragStart(event) {
                prevX = event.nativeEvent.boardX;
                prevY = event.nativeEvent.boardY;
            },
            dragMove: function (event) {
                const dx = event.boardX - prevX;
                const dy = event.boardY - prevY;
                prevX = event.boardX;
                prevY = event.boardY;
                this.setState((state) => ({
                    x: state.x + dx,
                    y: state.y + dy,
                }));
            }.bind(this),
            dragEnd() {},
        });
        this.moveDrag = drag;
    }

    render() {
        const {x, y, width, height, onRight, onBottom} = this.state;

        return e("div", {
            className: CSS.HITBOX,
            style: {
                width: `${width}px`,
                height: `${height}px`,
                left: `${x - (onRight ? width : 0)}px`,
                top: `${y - (onBottom ? height : 0)}px`,
            },
        }, [
            e("div", {
                key: "frame",
                className: CSS.FRAME,
                onMouseDown: this.moveDrag.onMouseDown,
            }),
            ...Hitbox.orientations.map(([ns, we]) => {
                return e("div", {
                    key: ns+we,
                    className: `${CSS.BOBBLE} ${ns+we}`,
                    onMouseDown: this.resizeDrag[ns+we].onMouseDown,
                });
            }),
            ...(this.props.children || []),
        ]);
    }
}