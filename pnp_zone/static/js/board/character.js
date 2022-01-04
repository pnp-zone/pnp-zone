import React from "../react.js";

import {Coord} from "./grid.js";
import {LEFT_BUTTON} from "../lib/mouse.js";
import {Drag} from "./drag.js";
import socket from "../socket.js";
import ContextMenu from "./contextmenu.js";

const e = React.createElement;

const CSS = {
    CHARACTER: "character noselect",
};

const HEXAGON_WIDTH = 80;
const BORDER_WIDTH = 2;

export default class Character extends React.Component {

    static contextType = ContextMenu;
    static OUTER_HEXAGON = {
        "--width": HEXAGON_WIDTH + "px",
        "--height": Math.floor(HEXAGON_WIDTH / Math.sqrt(3)) + "px",
    }
    static INNER_HEXAGON = {
        "--width": (HEXAGON_WIDTH - 2*BORDER_WIDTH) + "px",
        "--height": Math.floor((HEXAGON_WIDTH - 2*BORDER_WIDTH) / Math.sqrt(3)) + "px",
    }

    constructor(props) {
        super(props);

        const position = Coord.fromIndex(this.props.x, this.props.y);
        this.state = {
            x: position.xPixel,
            y: position.yPixel,
            isDragged: false,
        }
        // both state and props contain a x and y value
        // props holds the grid indices where the character is placed
        // state holds the center's coordinates while being dragged

        this.drag = new Drag();
        this.drag.register(LEFT_BUTTON, {
            dragStart: function () {
                this.setState({isDragged: true});
            }.bind(this),

            dragMove: function (event) {
                this.setState({
                    x: event.boardX,
                    y: event.boardY,
                });
            }.bind(this),

            dragEnd: function () {
                const position = Coord.fromIndex(this.props.x, this.props.y);
                this.setState({
                    x: position.xPixel,
                    y: position.yPixel,
                    isDragged: false
                });
            }.bind(this),
        });

        this.contextMenuItems = function () {
            return [
                e("button", {
                    onClick: () => {
                        socket.send({type: "character.delete", id: this.props.id});
                        this.context.close();
                    },
                }, "Delete character"),
            ];
        }.bind(this);

        this.onMouseUp = function (event) {
            if (event.button === LEFT_BUTTON && this.state.isDragged) {
                const x = event.nativeEvent.gridX;
                const y = event.nativeEvent.gridY;
                if (this.props.x !== x | this.props.y !== y) {
                    socket.send({type: "character.move", id: this.props.id, x, y});
                }
            }
        }.bind(this);
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.x !== prevProps.x || this.props.y !== prevProps.y) {
            const position = Coord.fromIndex(this.props.x, this.props.y);
            this.setState({
                x: position.xPixel,
                y: position.yPixel,
            });
        }
    }

    render() {
        let x, y;
        if (this.state.isDragged) {
            x = this.state.x;
            y = this.state.y;
        } else {
            const position = Coord.fromIndex(this.props.x, this.props.y);
            x = position.xPixel;
            y = position.yPixel;
        }

        return e("div", {
            className: CSS.CHARACTER,
            style: {
                left: x + "px",
                top: y + "px",
                transition: this.state.isDragged ? "none" : "",
                cursor: this.state.isDragged ? "grabbing" : "",
            },
            onMouseDown: this.drag.onMouseDown,
            onContextMenu: this.context.handler(this.contextMenuItems),
            onMouseUp: this.onMouseUp,
        }, [
            e("div", {
                key: "border",
                className: "hexagon",
                style: {
                    ...this.constructor.OUTER_HEXAGON,
                    "--color": "black",
                },
            }),
            e("div", {
                key: "background",
                className: "hexagon",
                style: {
                    ...this.constructor.INNER_HEXAGON,
                    "--color": this.props.color,
                },
            }),
            e("p", {key: "name"}, this.props.name),
        ]);
    }
}
