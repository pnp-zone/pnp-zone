import React from "../react.js";
import ReactDom from "../react-dom.js";

import {Coord, PatchGrid} from "./grid.js";
import {addMouseExtension, LEFT_BUTTON, MIDDLE_BUTTON} from "../lib/mouse.js";
import DragTarget, {Drag} from "./drag.js";
import socket from "../socket.js";
import Layer, {LayerStack} from "./layer.js";
import ContextMenu from "./contextmenu.js";

const e = React.createElement;

const PATCH_SIZE = 16;
const SCALE_SPEED = 1.1;

const titleElement = document.querySelector("title");

export default class Board extends React.Component {
    static contextType = DragTarget;

    constructor(props) {
        super(props);
        this.state = {
            title: "Loading",
            background: "white",
            border: "black",
            layers: {},
            x: 0,
            y: 0,
            scale: 1,
            ...document.initialBoard,
        };
        delete document.initialBoard;

        this.drag = new Drag();
        this.drag.register(LEFT_BUTTON, this);
        this.drag.register(MIDDLE_BUTTON, this);

        this.resizer = new ResizeObserver(() => {
            this.setState({}); // Force re-render
        });

        socket.registerEvent("error", ({message}) => { console.error(message); });
        socket.registerEvent("layer.set", this.layerSetter.bind(this));
        socket.registerEvent("layer.delete", this.layerDeleter.bind(this));
        socket.registerEvent("switch", ({url}) => {this.loadFromUrl(url);});
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

    loadFromUrl(url) {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", `${url}/data`);

        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    const result = JSON.parse(xhr.responseText);
                    console.log("Changing board...");
                    socket.getEndpoint = function () {
                        return url.replace("http", "ws");
                    }
                    socket.socket.close();
                    this.setState(result);
                } else {
                    console.error("Failed to load url:", url);
                }
            }
        }.bind(this);

        xhr.send();
    }

    layerSetter({layer, key, object, objects}) {
        if (key === undefined && object !== undefined) key = object.id;
        this.setState((state) => ({
            layers: {
                ...state.layers,
                [layer]: {
                    ...state.layers[layer],
                    children: {
                        ...state.layers[layer].children,
                        ...(object !== undefined ? {
                            [key]: {
                                ...state.layers[layer].children[key],
                                ...object,
                            }
                        } : undefined),
                        ...objects
                    },
                },
            },
        }));
    }
    layerDeleter({layer, key, object, objects}) {
        if (key === undefined && object !== undefined) key = object.id;
        this.setState((state) => {
            const {...children} = state.layers[layer].children;
            delete children[key];
            for (let key in objects) {
                delete children[key];
            }
            return {
                layers: {
                    ...state.layers,
                    [layer]: {
                        ...state.layers[layer],
                        children,
                    },
                },
            };
        });
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
        this.setState((state) => ({
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

    componentDidUpdate(prevProps) {
        if (prevProps.parent !== this.props.parent) {
            if (prevProps.parent)
                this.resizer.unobserve(prevProps.parent);
            if (this.props.parent)
                this.resizer.observe(this.props.parent);
        }
    }

    render() {
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
                ReactDom.createPortal(this.state.title, titleElement),
                e("style", {}, `body {background-color: ${this.state.background};`),
                e(LayerStack, {
                    layers: this.state.layers
                }, [
                    e(PatchGrid, {
                        id: "grid",
                        key: "grid",
                        size: PATCH_SIZE,
                        border: this.state.border,
                        ...this.rect,
                    }),
                ]),
                /*
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
                */
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
