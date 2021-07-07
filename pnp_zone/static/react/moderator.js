import React from "https://cdn.skypack.dev/react";
import socket from "../js/socket.js";
import {Drag, LEFT_BUTTON} from "../js/lib/mouse.js";
import {Coord, Line} from "./grid.js";
const e = React.createElement;

function TableRow(props) {
    const {children} = props;
    return e("tr", {}, children.map((element) => e("td", {}, [element])));
}

export default class Moderator extends React.PureComponent {
    componentDidMount() {
        new PaintBrush(document.forms["colorTile"]);
    }

    render() {
        return e(React.Fragment, {}, [
            e("form", {
                id: "newCharacter",
                className: "moderator-child",
                onSubmit: (event) => {
                    const form = document.forms["newCharacter"];
                    socket.send({type: "character.new",
                        name: form["name"].value,
                        x: form["x"].value,
                        y: form["y"].value,
                        color:form["color"].value,
                    });
                    event.preventDefault();
                },
            }, [
                e("h2", {}, "New character"),
                e("table", {}, [
                    e(TableRow, {}, [
                        e("label", {htmlFor: "newName"}, "Name: "),
                        e("input", {id: "newName", name: "name", type: "text"}),
                    ]),
                    e(TableRow, {}, [
                        e("label", {htmlFor: "newX"}, "X: "),
                        e("input", {id: "newX", name: "x", type: "text"}),
                    ]),
                    e(TableRow, {}, [
                        e("label", {htmlFor: "newY"}, "Y: "),
                        e("input", {id: "newY", name: "y", type: "text"}),
                    ]),
                    e(TableRow, {}, [
                        e("label", {htmlFor: "newColor"}, "Color: "),
                        e(React.Fragment, {}, [
                            e("button", {"data-jscolor": "{valueElement:'#newColor'}"}),
                            e("input", {id: "newColor", name: "color", type: "hidden", value: "#FFFFFF"}),
                        ]),
                    ]),
                    e(TableRow, {}, [
                        e(React.Fragment),
                        e("input", {type: "submit", value: "New"}),
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
                        e(React.Fragment, {}, [
                            e("button", {"data-jscolor": "{valueElement:'#colorBg'}"}),
                            e("input", {id: "colorBg", name: "background", type: "hidden", value: "#FFFFFF"}),
                        ]),
                    ]),
                    e(TableRow, {}, [
                        e("label", {htmlFor: "colorBr"}, "Border: "),
                        e(React.Fragment, {}, [
                            e("button", {"data-jscolor": "{valueElement:'#colorBr'}"}),
                            e("input", {id: "colorBr", name: "border", type: "hidden", value: "#000000"}),
                        ]),
                    ]),
                    e(TableRow, {}, [
                        e("label", {forHtml: "active"}, "Active"),
                        e("input", {id: "active", type: "checkbox", name: "active"}),
                    ]),
                ]),
            ]),
            e("form", {
                id: "addBackground",
                className: "moderator-child",
                onSubmit: (event) => {
                    const addBackground = document.forms["addBackground"];

                    const img = new Image();
                    img.onload = () => {
                        socket.send({type: "background.new",
                            url: img.src,
                            width: img.width,
                            height: img.height,
                        });
                    };
                    img.src = addBackground["url"].value;

                    event.preventDefault();
                },
            }, [
                e("h2", {}, "Add Background"),
                e("table", {}, [
                    e(TableRow, {}, [
                        e("label", {htmlFor: "bgUrl"}, "Background Url:"),
                        e("input", {id: "bgUrl", name: "url", type: "text"}),
                    ]),
                    e(TableRow, {}, [
                        e(React.Fragment),
                        e("input", {value: "Add", type: "submit"}),
                    ]),
                ]),
            ])
        ]);
    }
}

class PaintBrush {
    constructor(form) {
        this.form = form;

        this.visited = {};
        this.toSend = [];
        this.sendTimeout = null;

        this.previously = null;  //previously colored Tile

        this.drag = new Drag();
        this.drag.register(LEFT_BUTTON, this);

        this.form["active"].onchange = () => {
            this.active = this.form["active"].checked;
        };
        this.active = this.form["active"].checked;
    }

    send() {
        socket.send({type: "colorTile", tiles: this.toSend, background: this.background, border: this.border});
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

    get background() {
        return this.form["colorBg"].value;
    }
    get border() {
        return this.form["colorBr"].value;
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
        const boardView = document.getElementById("board-view");
        if (value) {
            boardView.style.cursor = "crosshair";
            boardView.addEventListener("mousedown", this.drag.onMouseDown, true);
        } else {
            boardView.style.cursor = "";
            boardView.removeEventListener("mousedown", this.drag.onMouseDown, true);
        }
    }
}
