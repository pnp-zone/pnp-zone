import React from "https://cdn.skypack.dev/react";
import socket from "../js/socket.js";
import {Drag, LEFT_BUTTON} from "../js/lib/mouse.js";
import {Coord, Line} from "./grid.js";
import TextInput from "./forms/textinput.js";
import CheckBox from "./forms/checkbox.js";
import {Contextmenu} from "./contextmenu.js";
const e = React.createElement;

function TableRow(props) {
    const {children} = props;
    return e("tr", {}, children.map((element) => e("td", {}, [element])));
}

export default class Moderator extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            character: {
                name: "",
                x: 0,
                y: 0,
                color: "#FF0000",
            },
            tile: {
                background: "#FFFFFF",
                border: "#000000",
                active: false,
            },
            image: {
                url: "",
            },
        };
        this.paintbrush = new PaintBrush(this);
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.tile.active !== prevState.tile.active) {
            this.paintbrush.active = this.state.tile.active;
        }
    }

    render() {
        const setState = this.setState.bind(this);
        Contextmenu.addDefaultItems("moderator", (event) => [
            e("button", {
                onClick: () => {
                    const {character} = this.state;
                    socket.send({
                        type: "character.new",
                        ...character,
                        x: event.nativeEvent.gridX, y: event.nativeEvent.gridY,
                    });
                    Contextmenu.close();
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
            e("form", {
                id: "colorTile",
                className: "moderator-child"
            }, [
                e("h2", {}, "Color tile"),
                e("table", {}, [
                    e(TableRow, {}, [
                        e("label", {htmlFor: "colorBg"}, "Background: "),
                        e(TextInput, {
                            id: "colorBg", name: "background", type: "color",
                            value: this.state.tile.background,
                            setValue: (value) => {setState((state) => ({tile: {...state.tile, background: value}}))},
                        }),
                    ]),
                    e(TableRow, {}, [
                        e("label", {htmlFor: "colorBr"}, "Border: "),
                        e("input", {
                            id: "colorBr", name: "border", type: "color",
                            value: this.state.tile.border,
                            setValue: (value) => {setState((state) => ({tile: {...state.tile, border: value}}))},
                        }),
                    ]),
                    e(TableRow, {}, [
                        e("label", {forHtml: "active"}, "Active"),
                        e(CheckBox, {
                            id: "active", name: "active",
                            value: this.state.tile.active,
                            setValue: (value) => {setState((state) => ({tile: {...state.tile, active: value}}))},
                        }),
                    ]),
                ]),
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
                ]),
            ])
        ]);
    }
}

class PaintBrush {
    constructor(moderator) {
        this.moderator = moderator;

        this.visited = {};
        this.toSend = [];
        this.sendTimeout = null;

        this.previously = null;  //previously colored Tile

        this.drag = new Drag();
        this.drag.register(LEFT_BUTTON, this);
    }

    send() {
        const {background, border} = this.moderator.state.tile;
        socket.send({type: "colorTile", tiles: this.toSend, background, border,});
        this.toSend = [];
        this.sendTimeout = null;
    }

    color(x, y) {
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

    set active(value) {
        const {board} = this.moderator.props;
        if (board) {
            if (value) {
                board.style.cursor = "crosshair";
                board.addEventListener("mousedown", this.drag.onMouseDown, true);
            } else {
                board.style.cursor = "";
                board.removeEventListener("mousedown", this.drag.onMouseDown, true);
            }
        }
    }
}
