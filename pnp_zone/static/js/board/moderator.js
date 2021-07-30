import React from "../react.js";
import socket from "../socket.js";
import {LEFT_BUTTON} from "../lib/mouse.js";
import DragTarget, {Drag} from "./drag.js";
import {Coord, Line} from "./grid.js";
import TextInput from "./forms/textinput.js";
import CheckBox from "./forms/checkbox.js";
import ContextMenu from "./contextmenu.js";
import Hexagon from "./hexagon.js";
import {HexagonDiv} from "./shapeddiv.js";
const e = React.createElement;

function TableRow(props) {
    const {children} = props;
    return e("tr", {}, children.map((element) => e("td", {}, [element])));
}

const Modes = {
    PAINT: "paint",
    ERASE: "erase",
    NONE: "none",
};

export class BoardSwitch extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            boards: props.boards,
            selected: null,
        };
    }

    render() {
        const setState = this.setState.bind(this);
        const {selected} = this.state;
        const selectedBoard = this.state.boards[selected];

        const boards = [];
        for (const key in this.state.boards) {
            if (this.state.boards.hasOwnProperty(key)) {
                const board = this.state.boards[key];
                boards.push(e("div", {
                    key,
                    className: "campaignItem" + (selected === key ? " campaignItem-hover" : ""),
                    onClick() { setState(({selected}) => ({selected: selected === key ? null : key})); },
                }, board.name));
            }
        }

        return e("div", {}, [
            e("div", {
                className: "campaignRow",
                style: {
                    margin: 0,
                },
            }, boards),
            e("hr"),
            selected === null ? null : e("div", {}, [
                e("h1", {}, selectedBoard.name),
                e("div", {}, [
                    e("button", {
                        onClick() {},
                    }, "Switch"),
                    e("button", {
                        onClick() {},
                    }, "Switch for all"),
                ]),
            ]),
        ]);
    }
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
            mode: Modes.NONE,
        };

        this.toSend = [];
        this.sendTimeout = null;
        this.visited = {};
        this.previously = null;  //previously colored Tile

        this.drag = new Drag();
        this.drag.register(LEFT_BUTTON, this);
    }

    send() {
        if (this.state.mode === Modes.PAINT) {
            const {background, border} = this.state;
            socket.send({type: "tiles.color", tiles: this.toSend, background, border,});
        } else if (this.state.mode === Modes.ERASE) {
            socket.send({type: "tiles.delete", tiles: this.toSend,});
        }
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
            if (this.state.mode === Modes.PAINT) {
                const {background, border} = this.state;
                socket.sendLocally({type: "tiles", tiles: [[x, y]], background, border,});
            } else if (this.state.mode === Modes.ERASE) {
                socket.sendLocally({type: "tiles.delete", tiles: [[x, y]],});
            }
        }
    }

    dragStart(event) {
        this.previously = Coord.fromIndex(event.nativeEvent.gridX, event.nativeEvent.gridY);
        this.color(event.nativeEvent.gridX, event.nativeEvent.gridY);
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
        if (this.state.mode !== prevState.mode) {
            if (this.state.mode === Modes.NONE) {
                this.context.removeHandler(this.drag.onMouseDown);
                document.body.style.cursor = "";
            } else {
                this.context.addHandler(this.drag.onMouseDown);
                document.body.style.cursor = "crosshair";
            }
        }
    }

    render() {
        const setState = this.setState.bind(this);
        return e("div", {
                className: "moderator-child"
            }, [
                e("button", {
                    key: "paintMode",
                    onClick() {setState((state) => ({mode: state.mode === Modes.PAINT ? Modes.NONE : Modes.PAINT}));},
                    style: {
                        backgroundColor: this.state.mode === Modes.PAINT ? "#233549" : "",
                    },
                }, [
                    e("img", {src: "/static/img/paintbrush.svg", width: 32, height: 32})
                ]),
                e("button", {
                    key: "eraseMode",
                    onClick() {setState((state) => ({mode: state.mode === Modes.ERASE ? Modes.NONE : Modes.ERASE}));},
                    style: {
                        backgroundColor: this.state.mode === Modes.ERASE ? "#233549" : "",
                    },
                }, [
                    e("img", {src: "/static/img/eraser.svg", width: 32, height: 32})
                ]),
                e("div", {
                    key: "colorPicker",
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
                    e(HexagonDiv, {
                        key: "border",
                        style: {
                            position: "absolute",
                            left: 0,
                            top: 0,
                            width: `${OUTER_HEXAGON.width}px`,
                            height: `${OUTER_HEXAGON.height}px`,
                        }
                    }, [
                        e("label", {
                            htmlFor: "colorBr",
                            style: {
                                display: "block",
                                width: "100%",
                                height: "100%",
                            },
                        }),
                    ]),
                    e(HexagonDiv, {
                        key: "background",
                        style: {
                            position: "absolute",
                            left: `${(OUTER_HEXAGON.width-INNER_HEXAGON.width)/2}px`,
                            top: `${(OUTER_HEXAGON.height-INNER_HEXAGON.height)/2}px`,
                            width: `${INNER_HEXAGON.width}px`,
                            height: `${INNER_HEXAGON.height}px`,
                        }
                    }, [
                        e("label", {
                            htmlFor: "colorBg",
                            style: {
                                display: "block",
                                width: "100%",
                                height: "100%",
                            },
                        }),
                    ]),
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
