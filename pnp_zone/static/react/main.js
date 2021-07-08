import React from "https://cdn.skypack.dev/react";
import ReactDOM from "https://cdn.skypack.dev/react-dom";
import Board from "./board.js";
import Moderator from "./moderator.js";
const e = React.createElement;

class Main extends React.Component {

    constructor(props) {
        super(props);
        this.boardView = null;
    }

    render() {
        const {x, y, scale, characters, tiles, images} = this.props;
        const {isModerator} = this.props;
        return e(React.Fragment, {}, [
            e("div", {
                id: "jitsi",
                key: "jitsi"
            }),
            e("div", {
                id: "board-view",
                key: "board",
                ref: (node) => {if (this.boardView === null) {this.boardView = node; this.setState({})}},
            }, [
                e(Board, {parent: this.boardView, x, y, scale, characters, tiles, images}),
            ]),
            ...(isModerator ? [
                e("input", {
                    key: "toggle",
                    type: "checkbox",
                    className: "toggleModerator",
                }),
                e("div", {
                    key: "toolbar",
                    id: "moderator",
                    className: "flex-horizontal",
                }, [
                    e(Moderator, {
                        board: this.boardView,
                    }),
                ]),
            ] : []),
        ]);
    }
}

ReactDOM.render(
    e(Main, document.initialData),
    document.getElementById("root"),
);
delete document.initialData;
