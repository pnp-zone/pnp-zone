import React from "https://cdn.skypack.dev/react";
import {Drag, LEFT_BUTTON} from "../js/lib/mouse.js";
const e = React.createElement;

const CSS = {
    BOBBLE: "hitbox-bobble",
    HITBOX: "hitbox",
    FRAME: "hitbox-frame",
}

function dragMove(ns, we) {
    return function (event) {
        const {setRect, rect} = this.props;
        let {x, y, width, height} = rect;
        const ratio = width / height;

        if (ns === "n") {
            y += height;
        }
        if (we === "w") {
            x += width;
        }

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

        if (ns === "n") {
            y -= height;
        }
        if (we === "w") {
            x -= width;
        }

        setRect({x, y, width, height});
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
            visible: false,
        };

        this.resizeDrag = {};
        for (let i = 0; i < Hitbox.orientations.length; i++) {
            const [ns, we] = Hitbox.orientations[i];
            const drag = new Drag();
            drag.register(LEFT_BUTTON, {
                dragStart() {},
                dragMove: dragMove(ns, we).bind(this),
                dragEnd: this.dragEnd.bind(this),
            });
            this.resizeDrag[ns+we] = drag;
        }

        let offsetX, offsetY;
        const drag = new Drag();
        drag.register(LEFT_BUTTON, {
            dragStart: function (event) {
                const {rect} = this.props;
                const {x, y} = rect;
                offsetX = x - event.nativeEvent.boardX;
                offsetY = y - event.nativeEvent.boardY;
            }.bind(this),
            dragMove: function (event) {
                const {setRect} = this.props;
                setRect({
                    x: event.boardX + offsetX,
                    y: event.boardY + offsetY,
                });
            }.bind(this),
            dragEnd: this.dragEnd.bind(this),
        });
        this.moveDrag = drag;

        this.div = React.createRef(null);
    }

    dragEnd() {
        const {dragEnd} = this.props;
        if (dragEnd) {
            dragEnd();
        }
    }

    render() {
        const {rect, setRect, dragEnd, ...unconsumedProps} = this.props;
        const {x, y, width, height} = rect;
        const {visible} = this.state;

        return e("div", {
            ref: this.div,
            className: CSS.HITBOX,
            style: {
                width: `${width}px`,
                height: `${height}px`,
                left: `${x}px`,
                top: `${y}px`,
            },
            tabIndex: -1,
            onClick: function () {
                this.div.current.focus();
            }.bind(this),
            onFocus: function () {
                this.setState({visible: true});
            }.bind(this),
            onBlur: function () {
                this.setState({visible: false});
            }.bind(this),
            ...unconsumedProps,
        }, visible ? [
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
                    onDragStart(event) {
                        event.preventDefault();
                    }
                });
            }),
            ...(this.props.children || []),
        ] : []);
    }
}

export function StatefulHitbox(props) {
    const {children} = props;
    const [rect, setRect] = React.useState({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
    });
    return e(Hitbox, {rect, setRect, dragEnd: () => {console.log("Ended drag with:", rect)}}, children);
}