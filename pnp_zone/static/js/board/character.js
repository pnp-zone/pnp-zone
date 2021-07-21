import React from "../react.js";

import Hexagon from "./hexagon.js";
import {Coord} from "./grid.js";
import {LEFT_BUTTON} from "../lib/mouse.js";
import {Drag} from "./drag.js";
import socket from "../socket.js";
import ContextMenu from "./contextmenu.js";
import {HexagonDiv} from "./shapeddiv.js";

const e = React.createElement;

const CSS = {
    CHARACTER: "character noselect",
    NAME: "character-name",
    HEXAGON: "character-hexagon",

};

const CHARACTER_WIDTH = 80;
const CHARACTER_HEIGHT = 92;

export default class Character extends React.Component {

    static contextType = ContextMenu;
    static OUTER_HEXAGON = new Hexagon(512);
    static INNER_HEXAGON = new Hexagon(512 - 2 * 12); // 12 = border width

    constructor(props) {
        super(props);

        const position = Coord.fromIndex(this.props.x, this.props.y);
        this.state = {
            x: position.xPixel,
            y: position.yPixel,
            isDragged: false,
            hovered: false,
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

        return e(HexagonDiv, {
            className: CSS.CHARACTER,
            style: {
                left: (x - CHARACTER_WIDTH/2) + "px",
                top: (y - CHARACTER_HEIGHT/2) + "px",
                transition: this.state.isDragged ? "none" : "",
                cursor: this.state.isDragged ? "grabbing" : (this.state.hovered ? "grab" : ""),
            },
            onMouseDown: this.drag.onMouseDown,
            onContextMenu: this.context.handler(this.contextMenuItems),
            onMouseUp: this.onMouseUp,
            onMouseEnter: function () {
                this.setState({hovered: true});
            }.bind(this),
            onMouseLeave: function () {
                this.setState({hovered: false});
            }.bind(this),
        }, [
            e("svg", {
                key: "hexagon",
                className: CSS.HEXAGON,
                version: "1.1",
                xmlns: "http://www.w3.org/2000/svg",
                viewBox: "-"+Character.OUTER_HEXAGON.width/2+" -"+Character.OUTER_HEXAGON.height/2+" "+Character.OUTER_HEXAGON.width+" "+Character.OUTER_HEXAGON.height,
            }, [
                e("polygon", {
                    key: "background",
                    points: Character.OUTER_HEXAGON.asPolygon,
                    style: {
                        fill: this.props.color,
                    },
                }),
                e("path", {
                    key: "border",
                    fillRule: "evenodd",
                    d: `${Character.OUTER_HEXAGON.asPath} ${Character.INNER_HEXAGON.asPath}`,
                    style: {
                        fill: "black",
                    },
                }),
            ]),
            e("p", {
                key: "name",
                className: CSS.NAME,
            }, [
                this.props.name,
            ]),
        ]);
    }
}
