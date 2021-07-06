import React from "https://cdn.skypack.dev/react";
import ReactDOM from "https://cdn.skypack.dev/react-dom";

import {Coord, Tile, PatchGrid} from "./grid.js";
import {addMouseExtension, Drag, LEFT_BUTTON, Menu, MIDDLE_BUTTON} from "../js/lib/mouse.js";
import socket from "../js/socket.js";
import Character from "./character.js";
import "../js/board.js";
import {Cursor} from "./cursors.js";

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
        socket.registerEvent("error", (event) => {
            console.error(event.message);
        });
        socket.registerEvent("session", (event) => {
            this.setState({
                x: event.x,
                y: event.y,
                scale: event.scale,
            });
        });
        socket.registerEvent("character.new", (event) => {
            const {id, x, y, color} = event;
            this.state.characters[id] = {id, x, y, color};
            this.setState({});
        });
        socket.registerEvent("character.move", (event) => {
            const {id, x, y} = event;
            const char = this.state.characters[id];
            char.x = x;
            char.y = y;
            this.setState({});
        });
        socket.registerEvent("character.delete", (event) => {
            const {id} = event;
            delete this.state.characters[id]
            this.setState({});
        });
        socket.registerEvent("colorTile", (event) => {
            const {tiles, background, border} = event;
            for (let i = 0; i < tiles.length; i++) {
                const [x, y] = tiles[i];
                this.state.tiles[`${x} | ${y}`] = {x, y, border, background};
            }
            this.setState({});
        });
        socket.registerEvent("cursor", (event) => {
            const {id, x, y, name} = event;
            this.state.cursors[id] = {x, y, name};
            this.setState({});
        });
        socket.registerEvent("background.update", (event) => {
            const {id, url, x, y, width, height} = event;
            this.state.backgrounds[id] = {url, x, y, width, height};
            this.setState({});
        });
        window.addEventListener("beforeunload", (event) => {
            socket.send({
                type: "session",
                x: this.state.x,
                y: this.state.y,
                scale: this.state.scale,
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
        const backgrounds = [];
        for (const key in this.state.backgrounds) {
            if (this.state.backgrounds.hasOwnProperty(key)) {
                const {url, x, y, width, height} = this.state.backgrounds[key];
                backgrounds.push(e("img", {
                    key: key,
                    src: url,
                    alt: key,
                    style: {
                        position: "absolute",
                        left: `${x}px`,
                        top: `${y}px`,
                        width: `${width}px`,
                        height: `${height}px`,
                    }
                }));
            }
        }

        const tiles = [];
        for (const key in this.state.tiles) {
            if (this.state.tiles.hasOwnProperty(key)) {
                tiles.push(e(Tile, {key: key, ...this.state.tiles[key]}));
            }
        }

        const characters = [];
        for (const key in this.state.characters) {
            if (this.state.characters.hasOwnProperty(key)) {
                characters.push(e(Character, {key: key, ...this.state.characters[key]}));
            }
        }

        const cursors = [];
        for (const key in this.state.cursors) {
            if (this.state.cursors.hasOwnProperty(key)) {
                cursors.push(e(Cursor, {key: key, ...this.state.cursors[key]}));
            }
        }

        return e("div", {
            style: {
                position: "absolute",
                left: `${this.state.x}px`,
                top: `${this.state.y}px`,
                transform: `scale(${this.state.scale})`,
            },
            onMouseDown: this.drag.onMouseDown,
            onWheel: this.onWheel.bind(this),
            onContextMenu: Menu.handler(() => [e("p", {}, "Hello World")]),
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
            e("div", {
                id: "backgrounds",
                key: "backgrounds",
            }, backgrounds),
            e("div", {
                id: "tiles",
                key: "tiles",
            }, tiles),
            e("div", {
                id: "characters",
                key: "characters",
            }, characters),
            e("div", {
                id: "cursors",
                key: "cursors",
            }, cursors),
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

const boardView = document.getElementById("board-view");
