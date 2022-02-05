import React from "../react.js";
import ReactDom from "../react-dom.js";

import {Coord, PatchGrid} from "./grid.js";
import {addMouseExtension, LEFT_BUTTON, MIDDLE_BUTTON} from "../lib/mouse.js";
import {Drag, GlobalDrag} from "./drag.js";
import socket from "../socket.js";
import {LayerStack} from "./layer.js";
import ContextMenu from "./contextmenu.js";

const e = React.createElement;

const PATCH_SIZE = 16;
const SCALE_SPEED = 1.1;

const titleElement = document.querySelector("title");

export default class Board extends React.Component {
    static contextType = ContextMenu;

    constructor(props) {
        super(props);
        this.state = {
            _boardView: null,
        };
        delete document.initialBoard;

        this.drag = new Drag();
        this.drag.dragStart = function (event) {
            document.body.style.cursor = "move";
            this._mouseStart = {x: event.pageX, y: event.pageY};
            this._boardStart = {x: this.props.x, y: this.props.y};
        }.bind(this);
        this.drag.dragMove = function (event) {
            this.props.setBoard({
                x: event.pageX - this._mouseStart.x + this._boardStart.x,
                y: event.pageY - this._mouseStart.y + this._boardStart.y,
            });
        }.bind(this);
        this.drag.dragEnd = function (event) {
            document.body.style.cursor = "default";
        }.bind(this);
        this.drag.register(LEFT_BUTTON, this.drag);
        this.drag.register(MIDDLE_BUTTON, this.drag);
        GlobalDrag.addHandler(this.drag.onMouseDown, LEFT_BUTTON);
        GlobalDrag.addHandler(this.drag.onMouseDown, MIDDLE_BUTTON);

        this.resizer = new ResizeObserver(function(){this.props.setBoard({});}.bind(this));

        socket.registerEvent("error", ({message}) => { console.error(message); });
        socket.registerEvent("layer.new", (layers) => {
            this.props.setBoard((state) => ({layers: {...state.layers, ...layers}}));
        });
        socket.registerEvent("layer.set", this.layerSetter.bind(this));
        socket.registerEvent("layer.delete", this.layerDeleter.bind(this));
        socket.registerEvent("switch", ({url}) => {
            fetch(`${url}/data`, {method: "GET"})
                .then(response => response.json())
                .then(result => {
                    socket.getEndpoint = function () {return url.replace("http", "ws");};
                    socket.socket.close();
                    this.layers = {}
                    this.props.setBoard(result);
                });
        });
        window.addEventListener("beforeunload", (event) => {
            const {x, y, scale} = this.props;
            socket.send({
                type: "session",
                x, y, scale,
            });
        });
        addMouseExtension((event) => {
            //const boardViewRect = this.props._boardView.getBoundingClientRect();
            const boardViewRect = {x: 0, y: 0};

            // get the cursor coordinates in the board
            // (taking position and scale into consideration)
            const {left, top} = this.rect;
            const boardX = (event.clientX - boardViewRect.x)/this.props.scale + left;
            const boardY = (event.clientY - boardViewRect.y)/this.props.scale + top;

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

        this.layers = {}
        this.setLayerRef = function (layer, elem) {
            if (this.layers[layer] === undefined) {
                elem.setData(this.props.layers[layer].children);
                delete this.props.layers[layer].children;
            }
            this.layers[layer] = elem;
        }.bind(this);
    }

    componentDidMount() {
        socket.open();
        document.socket = socket;
    }

    layerSetter({layer, key, object, objects}) {
        if (key === undefined && object !== undefined) key = object.id;
        this.layers[layer].setData((state) => ({
            ...state,
            ...(object !== undefined ? {
                [key]: {
                    ...state[key],
                    ...object,
                }
            } : undefined),
            ...objects
        }));
    }
    layerDeleter({layer, key, object, objects}) {
        if (key === undefined && object !== undefined) key = object.id;
        this.layers[layer].setData((state) => {
            const {...children} = state;
            delete children[key];
            for (let key in objects) {
                delete children[key];
            }
            return children;
        });
    }

    onWheel(event) {
        const rect = this.props._boardView.getBoundingClientRect();
        let newScale;

        if (event.deltaY > 0) { // down
            newScale = this.props.scale / SCALE_SPEED;
        } else {                // up
            newScale = this.props.scale * SCALE_SPEED;
        }

        if (newScale < 0.05) {
            newScale = 0.05;
        } else if (newScale > 10) {
            newScale = 10;
        }

        const factor = newScale / this.props.scale;
        this.props.setBoard((state) => ({
            scale: newScale,
            x: state.x + (event.clientX - rect.x - state.x) - factor*(event.clientX - rect.x - state.x),
            y: state.y + (event.clientY - rect.y - state.y) - factor*(event.clientY - rect.y - state.y),
        }));
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.parent !== this.props._boardView) {
            if (prevState.parent)
                this.resizer.unobserve(prevProps.parent);
            if (this.props._boardView)
                this.resizer.observe(this.props._boardView);
        }
    }

    render() {
        return e("div", {
            id: "board-view",
            ref: function (elem) {
                if (!this.props._boardView)
                    this.props.setBoard({_boardView: elem});
            }.bind(this),
        }, [
            e("div", {
                style: {
                    position: "absolute",
                    left: `${this.props.x}px`,
                    top: `${this.props.y}px`,
                    transform: `scale(${this.props.scale})`,
                },
                onMouseDown: GlobalDrag.onMouseDown,
                onWheel: this.onWheel.bind(this),
                onContextMenu: this.context.handler(() => []),
            }, [
                ReactDom.createPortal(this.props.title, titleElement),
                e("style", {}, `body {background-color: ${this.props.background};`),
                e(LayerStack, {
                    layers: this.props.layers,
                    setLayerRef: this.setLayerRef,
                    rerender: function () {}, // this function is a new one each board render
                                              // and therefore always triggers a layerstack render
                    selectedLayer: this.props.selectedLayer,
                }, [
                    e(PatchGrid, {
                        id: "grid",
                        key: "grid",
                        size: PATCH_SIZE,
                        border: this.props.border,
                        ...this.rect,
                    }),
                ]),
                /*...(this.props.editMode ? [
                    e(Layer, {
                        id: "background-hitboxes",
                        key: "background-hitboxes",
                        childrenData: this.props.layers["background-images"].children,
                        childrenComponent: ImageHitbox,
                        commonProps: {
                            setImage: (object) => {
                                this.layerSetter({layer: "background-images", object});
                            }
                        }
                    }),
                ] : []),*/
            ]),
        ]);
    }

    get rect() {
        const parent = (this.props._boardView || {offsetWidth: 0, offsetHeight: 0});
        return {
            left: Math.floor((-this.props.x)/this.props.scale),
            top: Math.floor((-this.props.y)/this.props.scale),
            right: Math.ceil((parent.offsetWidth-this.props.x)/this.props.scale),
            bottom: Math.ceil((parent.offsetHeight-this.props.y)/this.props.scale),
        };
    }
}
