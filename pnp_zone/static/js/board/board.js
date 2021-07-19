import React from "../react.js";

import {Coord, Tile, PatchGrid} from "./grid.js";
import {addMouseExtension, LEFT_BUTTON, MIDDLE_BUTTON} from "../lib/mouse.js";
import DragTarget, {Drag} from "./drag.js";
import socket from "../socket.js";
import Character from "./character.js";
import {Cursor} from "./cursors.js";
import Layer from "./layer.js";
import Hitbox from "./resizing.js";
import ContextMenu from "./contextmenu.js";

const e = React.createElement;

const PATCH_SIZE = 16;
const SCALE_SPEED = 1.1;

export default class Board extends React.Component {
    static contextType = DragTarget;

    constructor(props) {
        super(props);
        const { x, y, scale, characters, tiles, images } = this.props;
        this.state = {
            x,
            y,
            scale,
            characters,
            tiles,
            images,
            cursors: {},
        };

        this.drag = new Drag();
        this.drag.register(LEFT_BUTTON, this);
        this.drag.register(MIDDLE_BUTTON, this);

        /*document.addEventListener("DOMContentLoaded", () => {
            new ResizeObserver(() => {
                this.setState({}); // Force re-render
            }).observe(boardView);
        });*/
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
        socket.registerEvent("image.update", this.subStateSetter("images"));
        socket.registerEvent("image.delete", this.subStateDeleter("images"));
        window.addEventListener("beforeunload", (event) => {
            const {x, y, scale} = this.state;
            socket.send({
                type: "session",
                x, y, scale,
            });
        });
        addMouseExtension((event) => {
            //const boardViewRect = this.props.parent.getBoundingClientRect();
            const boardViewRect = {x: 0, y: 0};

            // is the cursor over the board?
            //const overBoard = (boardViewRect.left < event.clientX && event.clientX < boardViewRect.right)
            //    && boardViewRect.top < event.clientY && event.clientY < boardViewRect.bottom;

            // get the cursor coordinates in the board
            // (taking position and scale into consideration)
            const {left, top} = this.rect;
            const boardX = (event.clientX - boardViewRect.x)/this.state.scale + left;
            const boardY = (event.clientY - boardViewRect.y)/this.state.scale + top;

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

    onWheel(event) {
        const rect = this.props.parent.getBoundingClientRect();
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
        this.context.addHandler(this.drag.onMouseDown, LEFT_BUTTON);
        this.context.addHandler(this.drag.onMouseDown, MIDDLE_BUTTON);
    }

    render() {
        const {editMode} = this.props;

        return e(ContextMenu.Consumer, {},
            (contextMenu) => e("div", {
                style: {
                    position: "absolute",
                    left: `${this.state.x}px`,
                    top: `${this.state.y}px`,
                    transform: `scale(${this.state.scale})`,
                },
                onMouseDown: this.context.onMouseDown,
                onWheel: this.onWheel.bind(this),
                onContextMenu: contextMenu.handler(() => []),
            }, [
                e(Layer, {
                    id: "background-images",
                    key: "background-images",
                    childrenData: this.state.images,
                    childrenComponent: Image,
                    filter: ({layer}) => (layer === "B"),
                }),
                e(PatchGrid, {
                    id: "grid",
                    key: "grid",
                    size: PATCH_SIZE,
                    ...this.rect,
                }),
                e(Layer, {
                    id: "tiles",
                    key: "tiles",
                    childrenData: this.state.tiles,
                    childrenComponent: Tile,
                }),
                e(Layer, {
                    id: "foreground-images",
                    key: "foreground-images",
                    childrenData: this.state.images,
                    childrenComponent: Image,
                    filter: ({layer}) => (layer !== "B"),
                }),
                e(Layer, {
                    id: "characters",
                    key: "characters",
                    childrenData: this.state.characters,
                    childrenComponent: Character,
                }),
                ...(editMode ? [
                    e(Layer, {
                        id: "background-hitboxes",
                        key: "background-hitboxes",
                        childrenData: this.state.images,
                        childrenComponent: ImageHitbox,
                        filter: ({layer}) => (layer === "B"),
                        commonProps: {
                            setImage: this.subStateSetter("images"),
                        }
                    }),
                    e(Layer, {
                        id: "foreground-hitboxes",
                        key: "foreground-hitboxes",
                        childrenData: this.state.images,
                        childrenComponent: ImageHitbox,
                        filter: ({layer}) => (layer !== "B"),
                        commonProps: {
                            setImage: this.subStateSetter("images"),
                        }
                    }),
                ]: []),
                e(Layer, {
                    id: "cursors",
                    key: "cursors",
                    childrenData: this.state.cursors,
                    childrenComponent: Cursor,
                }),
            ])
        );
    }

    get rect() {
        const parent = (this.props.parent || {offsetWidth: 0, offsetHeight: 0});
        return {
            left: Math.floor((-this.state.x)/this.state.scale),
            top: Math.floor((-this.state.y)/this.state.scale),
            right: Math.ceil((parent.offsetWidth-this.state.x)/this.state.scale),
            bottom: Math.ceil((parent.offsetHeight-this.state.y)/this.state.scale),
        };
    }

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

function ImageHitbox(props) {
    const {id, x, y, width, height, setImage, layer} = props;
    const contextMenu = React.useContext(ContextMenu);

    return e(Hitbox, {
        rect: {x, y, width, height},
        setRect: (rect) => setImage({id, ...rect}),
        dragEnd() {
            socket.send({
                type: "image.move",
                id, x, y, width, height,
            });
        },
        onContextMenu: contextMenu.handler(() => {
            return [
                e("button", {
                    onClick: () => {
                        socket.send({type: "image.change_layer", id, layer: layer === "B" ? "T" : "B"});
                        contextMenu.close();
                    },
                }, layer === "B" ? "Move to foreground" : "Move to background"),
                e("button", {
                    onClick: () => {
                        socket.send({type: "image.delete", id,});
                        contextMenu.close();
                    },
                }, "Delete image"),
            ];
        }),
    });
}

function Image({url, x, y, width, height}) {
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
