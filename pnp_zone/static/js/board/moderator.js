import React from "../react.js";
import socket from "../socket.js";
import {LEFT_BUTTON} from "../lib/mouse.js";
import DragTarget, {Drag} from "./drag.js";
import {Coord, Line} from "./grid.js";
import TextInput from "./forms/textinput.js";
import CheckBox from "./forms/checkbox.js";
import ContextMenu from "./contextmenu.js";
import Hexagon from "./hexagon.js";
const e = React.createElement;

function TableRow(props) {
    const {children} = props;
    return e("tr", {}, children.map((element) => e("td", {}, [element])));
}

const INNER_HEXAGON = new Hexagon(80);
const OUTER_HEXAGON = new Hexagon(100);
export class Tiles extends React.PureComponent {
    static contextType = DragTarget;

    constructor(props) {
        super(props);
        this.state = {
            background: "#FFFFFF",
            border: "#000000",
            active: false,
        };

        this.toSend = [];
        this.sendTimeout = null;
        this.visited = {};
        this.previously = null;  //previously colored Tile

        this.drag = new Drag();
        this.drag.register(LEFT_BUTTON, this);
    }

    send() {
        const {background, border} = this.state;
        socket.send({type: "colorTile", tiles: this.toSend, background, border,});
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
        }
    }

    dragStart(event) {
        this.previously = Coord.fromIndex(event.gridX, event.gridY);
        this.color(event.gridX, event.gridY);
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
        if (this.state.active !== prevState.active) {
            if (this.state.active) {
                document.body.style.cursor = "crosshair";
                this.context.addHandler(this.drag.onMouseDown);
            } else {
                document.body.style.cursor = "";
                this.context.removeHandler(this.drag.onMouseDown);
            }
        }
    }

    render() {
        const setState = this.setState.bind(this);
        return e("div", {
                className: "moderator-child"
            }, [
                e("label", {forHtml: "active"}, "Active"),
                e(CheckBox, {
                    id: "active", name: "active",
                    value: this.state.active,
                    setValue: (value) => {setState({active: value})},
                }),
                e("div", {
                    style: {
                        position: "relative",
                        width: `${OUTER_HEXAGON.width}px`,
                        height: `${OUTER_HEXAGON.height}px`,
                    },
                }, [
                    e("svg", {
                        version: "1.1",
                        xmlns: "http://www.w3.org/2000/svg",
                        className: "field",
                        viewBox: `-${OUTER_HEXAGON.width/2} -${OUTER_HEXAGON.height/2} ${OUTER_HEXAGON.width} ${OUTER_HEXAGON.height}`,
                    }, [
                        e("polygon", {
                            key: "background",
                            points: OUTER_HEXAGON.asPolygon,
                            style: {
                                fill: this.state.background,
                            },
                        }),
                        e("path", {
                            key: "border",
                            fillRule: "evenodd",
                            d: `${OUTER_HEXAGON.asPath} ${INNER_HEXAGON.asPath}`,
                            style: {
                                fill: this.state.border,
                            },
                        }),
                    ]),
                    e("label", {
                        key: "border",
                        htmlFor: "colorBr",
                        style: {
                            position: "absolute",
                            left: 0,
                            top: 0,
                            width: `${OUTER_HEXAGON.width}px`,
                            height: `${OUTER_HEXAGON.height}px`,
                        }
                    }),
                    e("label", {
                        key: "background",
                        htmlFor: "colorBg",
                        style: {
                            position: "absolute",
                            left: `${(OUTER_HEXAGON.width-INNER_HEXAGON.width)/2}px`,
                            top: `${(OUTER_HEXAGON.height-INNER_HEXAGON.a-INNER_HEXAGON.b)/2}px`,
                            width: `${INNER_HEXAGON.width}px`,
                            height: `${INNER_HEXAGON.a+INNER_HEXAGON.b}px`,
                        }
                    }),
                    e(TextInput, {
                        id: "colorBg", name: "background", type: "color",
                        value: this.state.background,
                        setValue: (value) => {setState({background: value})},
                        style: {
                            display: "none",
                        },
                    }),
                    e(TextInput, {
                        id: "colorBr", name: "border", type: "color",
                        value: this.state.border,
                        setValue: (value) => {setState({border: value})},
                        style: {
                            display: "none",
                        },
                    }),
                ]),
            ]);
    }
}

export default class Moderator extends React.PureComponent {
    static contextType = ContextMenu;

    constructor(props) {
        super(props);
        this.state = {
            character: {
                name: "",
                x: 0,
                y: 0,
                color: "#FF0000",
            },
            image: {
                url: "",
            },
        };
    }

    render() {
        const setState = this.setState.bind(this);
        const contextMenu = this.context;
        const {editMode, setEditMode} = this.props;
        contextMenu.addDefaultItems("moderator", (event) => [
            e("button", {
                onClick: () => {
                    const {character} = this.state;
                    socket.send({
                        type: "character.new",
                        ...character,
                        x: event.nativeEvent.gridX, y: event.nativeEvent.gridY,
                    });
                    contextMenu.close();
                },
            }, `Add character here`),
            e("button", {
                onClick: () => {
                    const {image} = this.state;

                    // Load the image locally to figure out its width and height
                    const img = new Image();
                    img.onload = () => {
                        socket.send({
                            type: "image.new",
                            ...image,
                            width: img.width, height: img.height,
                            x: event.nativeEvent.boardX, y: event.nativeEvent.boardY,
                        });
                        contextMenu.close();
                    };
                    img.src = image.url;
                },
            }, `Add image here`),
        ]);

        return e(React.Fragment, {}, [
            e("div", { key: "character", className: "moderator-child", }, [
                e("h2", {}, "New character"),
                e("table", {}, [
                    e(TableRow, {}, [
                        e("label", {htmlFor: "newName"}, "Name: "),
                        e(TextInput, {
                            id: "newName",
                            value: this.state.character.name,
                            setValue: (value) => {setState((state) => ({character: {...state.character, name: value}}))},
                        }),
                    ]),
                    e(TableRow, {}, [
                        e("label", {htmlFor: "newX"}, "X: "),
                        e(TextInput, {
                            id: "newX",
                            value: this.state.character.x,
                            setValue: (value) => {setState((state) => ({character: {...state.character, x: value}}))},
                        }),
                    ]),
                    e(TableRow, {}, [
                        e("label", {htmlFor: "newY"}, "Y: "),
                        e(TextInput, {
                            id: "newY",
                            value: this.state.character.y,
                            setValue: (value) => {setState((state) => ({character: {...state.character, y: value}}))},
                        }),
                    ]),
                    e(TableRow, {}, [
                        e("label", {htmlFor: "newColor"}, "Color: "),
                        e(TextInput, {
                            id: "newColor",
                            type: "color",
                            value: this.state.character.color,
                            setValue: (value) => {setState((state) => ({character: {...state.character, color: value}}))},
                        }),
                    ]),
                    e(TableRow, {}, [
                        e(React.Fragment),
                        e("button", {
                            onClick: () => {
                                const {character} = this.state;
                                socket.send({type: "character.new", ...character});
                            },
                        }, "New"),
                    ]),
                ])
            ]),
            e("div", { key: "image", className: "moderator-child", }, [
                e("h2", {}, "Add Image"),
                e("table", {}, [
                    e(TableRow, {}, [
                        e("label", {htmlFor: "bgUrl"}, "Url:"),
                        e(TextInput, {
                            id: "bgUrl",
                            value: this.state.image.url,
                            setValue: (value) => {setState((state) => ({image: {...state.image, url: value}}))},
                        }),
                    ]),
                    e(TableRow, {}, [
                        e(React.Fragment),
                        e("button", {
                            onClick: () => {
                                const {image} = this.state;

                                // Load the image locally to figure out its width and height
                                const img = new Image();
                                img.onload = () => {
                                    socket.send({type: "image.new",
                                        ...image,
                                        width: img.width,
                                        height: img.height,
                                    });
                                };
                                img.src = image.url;
                            },
                        }, "Add"),
                    ]),
                    e(TableRow, {}, [
                        e("label", {forHtml: "move"}, "Move images"),
                        e(CheckBox, {
                            id: "move", name: "move",
                            value: editMode,
                            setValue: setEditMode,
                        }),
                    ]),
                ]),
            ])
        ]);
    }
}
