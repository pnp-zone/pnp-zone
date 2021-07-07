import React from "https://cdn.skypack.dev/react";

import {Coord, Tile, PatchGrid} from "./grid.js";
import {addMouseExtension, Drag, LEFT_BUTTON, Menu, MIDDLE_BUTTON} from "../js/lib/mouse.js";
import socket from "../js/socket.js";
import Character from "./character.js";
import {Cursor} from "./cursors.js";
import Layer from "./layer.js";
import Hitbox, {StatefulHitbox} from "./resizing.js";

const e = React.createElement;

const PATCH_SIZE = 16;
const SCALE_SPEED = 1.1;

export default class Board extends React.Component {

    constructor(props) {
        super(props);
        const { x, y, scale, characters, tiles, backgrounds } = this.props;
        this.state = {
            x,
            y,
            scale,
            characters,
            tiles,
            backgrounds,
            cursors: {},
        };

        this.drag = new Drag();
        this.drag.register(LEFT_BUTTON, this);
        this.drag.register(MIDDLE_BUTTON, this);

        document.addEventListener("DOMContentLoaded", () => {
            new ResizeObserver(() => {
                this.setState({}); // Force re-render
            }).observe(boardView);
        });
        socket.registerEvent("error", ({message}) => { console.error(message); });
        socket.registerEvent("session", this.setState.bind(this));
        socket.registerEvent("character.new", this.subStateSetter("characters"));
        socket.registerEvent("character.move", this.subStateSetter("characters"));
        socket.registerEvent("character.delete", this.subStateDeleter("characters"));
        socket.registerEvent("colorTile", ({tiles, background, border}) => {
            for (let i = 0; i < tiles.length; i++) {
                const [x, y] = tiles[i];
                this.state.tiles[`${x} | ${y}`] = {x, y, border, background};
            }
            this.setState({});
        });
        socket.registerEvent("cursor", this.subStateSetter("cursors"));
        socket.registerEvent("background.update", this.subStateSetter("backgrounds"));
        socket.registerEvent("background.delete", this.subStateDeleter("backgrounds"));
        window.addEventListener("beforeunload", (event) => {
            const {x, y, scale} = this.state;
            socket.send({
                type: "session",
                x, y, scale,
            });
        });
        addMouseExtension((event) => {
            const boardViewRect = boardView.getBoundingClientRect();

            // is the cursor over the board?
            //const overBoard = (boardViewRect.left < event.clientX && event.clientX < boardViewRect.right)
            //    && boardViewRect.top < event.clientY && event.clientY < boardViewRect.bottom;

            // get the cursor coordinates in the board
            // (taking position and scale into consideration)
            const boardX = (event.clientX - boardViewRect.x)/this.state.scale + this.left;
            const boardY = (event.clientY - boardViewRect.y)/this.state.scale + this.top;

            event.boardX = boardX;
            event.boardY = boardY;

            let coord = null;
            Object.defineProperty(event, "gridX", {get: () => {
                    if (!coord) {
                        coord = Coord.fromPixel(boardX, boardY);
                    }
                    return coord.xIndex;
                }});
            Object.defineProperty(event, "gridY", {get: () => {
                    if (!coord) {
                        coord = Coord.fromPixel(boardX, boardY);
                    }
                    return coord.yIndex;
                }});
        });
    }

    subStateSetter(subState, keyFromObj = ({id}) => id) {
        return function (obj) {
            this.setState((state) => ({
                [subState]: {
                    ...state[subState],
                    [keyFromObj(obj)]: {
                        ...state[subState][keyFromObj(obj)],
                        ...obj
                    }
                }
            }));
        }.bind(this);
    }
    subStateDeleter(subState, keyFromObj = ({id}) => id) {
        return function (obj) {
            this.setState((state) => {
                const {[keyFromObj(obj)]: toBeRemoved, ...toKeep} = state[subState];
                return {[subState]: toKeep};
            });
        }.bind(this);
    }

    jumpTo(coord) {
        this.setState((state, props) => ({
            x: (boardView.offsetWidth / 2) - (coord.xPixel * state.scale),
            y: (boardView.offsetHeight / 2) - (coord.yPixel * state.scale),
        }));
    }

    onWheel(event) {
        const rect = boardView.getBoundingClientRect();
        let newScale;

        // down
        if (event.deltaY > 0) {
            newScale = this.state.scale / SCALE_SPEED;
        }

        // up
        else {
            newScale = this.state.scale * SCALE_SPEED;
        }

        if (newScale < 0.05) {
            newScale = 0.05;
        } else if (newScale > 10) {
            newScale = 10;
        }

        const factor = newScale / this.state.scale;
        this.setState((state, props) => ({
            scale: newScale,
            x: state.x + (event.clientX - rect.x - state.x) - factor*(event.clientX - rect.x - state.x),
            y: state.y + (event.clientY - rect.y - state.y) - factor*(event.clientY - rect.y - state.y),
        }));
    }

    componentDidMount() {
        socket.open();
        document.socket = socket;
    }

    render() {
        return e("div", {
            style: {
                position: "absolute",
                left: `${this.state.x}px`,
                top: `${this.state.y}px`,
                transform: `scale(${this.state.scale})`,
            },
            onMouseDown: this.drag.onMouseDown,
            onWheel: this.onWheel.bind(this),
            //onContextMenu: Menu.handler(() => [e("p", {}, "Hello World")]),
        }, [
            e(PatchGrid, {
                id: "grid",
                key: "grid",
                size: PATCH_SIZE,
                left: this.left,
                right: this.right,
                top: this.top,
                bottom: this.bottom,
            }),
            e(Layer, {
                id: "backgrounds",
                key: "backgrounds",
                childrenData: this.state.backgrounds,
                childrenComponent: Background,
            }),
            e(Layer, {
                id: "tiles",
                key: "tiles",
                childrenData: this.state.tiles,
                childrenComponent: Tile,
            }),
            e(Layer, {
                id: "characters",
                key: "characters",
                childrenData: this.state.characters,
                childrenComponent: Character,
            }),
            e(Layer, {
                id: "background-hitboxes",
                key: "background-hitboxes",
                childrenData: this.state.backgrounds,
                childrenComponent: BackgroundHitbox,
                commonProps: {
                    setBackground: this.subStateSetter("backgrounds"),
                }
            }),
            e(Layer, {
                id: "cursors",
                key: "cursors",
                childrenData: this.state.cursors,
                childrenComponent: Cursor,
            }),
        ]);
    }

    get left() { return Math.floor((-this.state.x)/this.state.scale); }
    get top() { return Math.floor((-this.state.y)/this.state.scale); }
    get right() { return Math.ceil((boardView.offsetWidth-this.state.x)/this.state.scale); }
    get bottom() { return Math.ceil((boardView.offsetHeight-this.state.y)/this.state.scale); }

    dragStart(event) {
        document.body.style.cursor = "move";
        this._mouseStart = {x: event.pageX, y: event.pageY};
        this._boardStart = {x: this.state.x, y: this.state.y};
    }

    dragMove(event) {
        this.setState({
            x: event.pageX - this._mouseStart.x + this._boardStart.x,
            y: event.pageY - this._mouseStart.y + this._boardStart.y,
        });
    }

    dragEnd(event) {
        document.body.style.cursor = "default";
    }
}

function BackgroundHitbox(props) {
    const {id, x, y, width, height, setBackground} = props;
    return e(Hitbox, {
        rect: {x, y, width, height},
        setRect: (rect) => setBackground({id, ...rect}),
        dragEnd() {
            socket.send({
                type: "background.move",
                id, x, y, width, height,
            });
        },
        onContextMenu: Menu.handler(() => {
            return [
                e("button", {
                    onClick: () => {
                        socket.send({type: "background.delete", id,});
                        Menu.close();
                    },
                }, "Delete background"),
            ];
        }),
    });
}

function Background({url, x, y, width, height}) {
    return e("img", {
        src: url,
        style: {
            position: "absolute",
            left: `${x}px`,
            top: `${y}px`,
            width: `${width}px`,
            height: `${height}px`,
        },
    });
}

const boardView = document.getElementById("board-view");
