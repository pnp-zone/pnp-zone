import React from "../react.js";
import socket from "../socket.js";
import {LEFT_BUTTON} from "../lib/mouse.js";
import DragTarget, {Drag} from "./drag.js";
import {Coord, Line} from "./grid.js";
import TextInput from "./forms/textinput.js";
import CheckBox from "./forms/checkbox.js";
import ContextMenu from "./contextmenu.js";
import Modal from "../modal.js";
const e = React.createElement;

function TableRow(props) {
    const {children} = props;
    return e("tr", {}, children.map((element) => e("td", {}, [element])));
}

export function BoardSwitch(props) {
    const {boards} = props;
    const [selected, setSelected] = React.useState(null);

    return e("div", {}, [
        e("div", {
            className: "campaignRow",
            style: {
                margin: 0,
            },
        }, Object.entries(boards).map(([uuid, name]) =>
            e("div", {
                key: uuid,
                className: "campaignItem" + (selected === uuid ? " campaignItem-hover" : ""),
                onClick() { setSelected(selected === uuid ? null : uuid); },
            }, name)
        )),
        e("hr"),
        selected === null ? null : e("div", {}, [
            e("h1", {}, boards[selected]),
            e("div", {}, [
                e("button", {
                    onClick() {
                        const last = window.location.origin + window.location.pathname;
                        const url = last.replace(last.match(/.+\/([-0-9a-f]+)/)[1], selected);
                        socket.sendLocally({type: "switch", url,});
                    },
                }, "Switch"),
                e("button", {
                    onClick() {
                        const last = window.location.origin + window.location.pathname;
                        const url = last.replace(last.match(/.+\/([-0-9a-f]+)/)[1], selected);
                        socket.send({type: "switch", url,});
                    },
                }, "Switch for all"),
            ]),
        ]),
    ]);
}

const Modes = {
    PAINT: "paint",
    ERASE: "erase",
    NONE: "none",
};

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
        const {editMode, setEditMode} = this.props;
        return e("div", {
            className: "moderator-child"
        }, [
            e("div", { key: "image", className: "moderator-child", }, [
                e("label", {forHtml: "move"}, "Move images"),
                e(CheckBox, {
                    id: "move", name: "move",
                    value: editMode,
                    setValue: setEditMode,
                }),
            ]),
            e("button", {
                key: "paintMode",
                className: this.state.mode === Modes.PAINT ? "active" : "",
                onClick() {setState((state) => ({mode: state.mode === Modes.PAINT ? Modes.NONE : Modes.PAINT}));},
            }, [
                e("img", {src: "/static/img/paintbrush.svg", width: 32, height: 32})
            ]),
            e("button", {
                key: "eraseMode",
                className: this.state.mode === Modes.ERASE ? "active" : "",
                onClick() {setState((state) => ({mode: state.mode === Modes.ERASE ? Modes.NONE : Modes.ERASE}));},
            }, [
                e("img", {src: "/static/img/eraser.svg", width: 32, height: 32})
            ]),
            e("div", {
                key: "colorPicker",
                className: "colorPicker",
            }, [
                e("label", {
                    key: "borderPicker",
                    className: "hexagon",
                    style: {"--color": this.state.border,},
                }, [
                    e(TextInput, {
                        type: "color",
                        value: this.state.border,
                        setValue: (value) => {setState({border: value})},
                    }),
                ]),
                e("label", {
                    key: "backgroundPicker",
                    className: "hexagon",
                    style: {"--color": this.state.background,},
                }, [
                    e(TextInput, {
                        type: "color",
                        value: this.state.background,
                        setValue: (value) => {setState({background: value})},
                    })
                ])
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
                _isModalOpen: false,
            },
            image: {
                url: "",
                x: 0,
                y: 0,
                _isModalOpen: false,
            },
        };
    }

    render() {
        const setState = this.setState.bind(this);
        const contextMenu = this.context;
        contextMenu.addDefaultItems("moderator", (event) => [
            e("button", {
                onClick: () => {
                    setState((state) => ({character: {
                        ...state.character, _isModalOpen: true,
                        x: event.nativeEvent.gridX, y: event.nativeEvent.gridY,
                    }}));
                    contextMenu.close();
                },
            }, `Add character here`),
            e("button", {
                onClick: () => {
                    setState((state) => ({image: {
                        ...state.image, _isModalOpen: true,
                        x: event.nativeEvent.boardX, y: event.nativeEvent.boardY,
                    }}));
                    contextMenu.close();
                },
            }, `Add image here`),
        ]);

        return e(React.Fragment, {}, [
            this.state.character._isModalOpen ? e(Modal, {
                hideModal() {setState((state) => ({character: {...state.character, _isModalOpen: false}}));},
            }, [
                e("form", {
                    onSubmit: (event) => {
                        event.preventDefault();
                        const {character} = this.state;
                        socket.send({type: "character.new", ...character});
                        setState((state) => ({character: {...state.character, _isModalOpen: false}}));
                    }
                }, [
                    e("table", {}, [
                        e(TableRow, {}, [
                            e("label", {htmlFor: "newName"}, "Name: "),
                            e(TextInput, {
                                id: "newName",
                                value: this.state.character.name,
                                setValue: (value) => {setState((state) => ({character: {...state.character, name: value}}))},
                                autoFocus: true,
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
                            e("button", {action: "submit"}, "Add"),
                        ]),
                    ]),
                ]),
            ]) : null,
            this.state.image._isModalOpen ? e(Modal, {
                hideModal() {setState((state) => ({image: {...state.image, _isModalOpen: false}}));},
            }, [
                e("form", {
                    onSubmit: (event) => {
                        event.preventDefault();
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

                        setState((state) => ({image: {...state.image, _isModalOpen: false}}));
                    },
                }, [
                    e("table", {}, [
                        e(TableRow, {}, [
                            e("label", {htmlFor: "bgUrl"}, "Url:"),
                            e(TextInput, {
                                id: "bgUrl",
                                value: this.state.image.url,
                                setValue: (value) => {setState((state) => ({image: {...state.image, url: value}}))},
                                autoFocus: true,
                            }),
                        ]),
                        e(TableRow, {}, [
                            e(React.Fragment),
                            e("button", {action: "submit"}, "Add"),
                        ]),
                    ]),
                ]),
            ]) : null,
        ]);
    }
}
