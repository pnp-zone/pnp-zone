import React from "https://cdn.skypack.dev/react";
import ReactDOM from "https://cdn.skypack.dev/react-dom";
import Board from "./board.js";
import Moderator from "./moderator.js";
import CheckBox, {StatefulCheckBox} from "./forms/checkbox.js";
const e = React.createElement;

function Main(props) {
    const {x, y, scale, characters, tiles, images} = props;
    const {isModerator} = props;
    const [boardView, setBoardView] = React.useState(null);
    const [viewToolbar, setViewToolbar] = React.useState(false);

    const ref = React.useRef();
    React.useEffect(() => {
        if (boardView === null) {
            setBoardView(ref.current);
        }
    });

    return e(React.Fragment, {}, [
        e("div", {
            id: "board-view",
            key: "board",
            ref,
        }, [
            e(Board, {parent: boardView, x, y, scale, characters, tiles, images}),
        ]),
        e("div", {
            id: "jitsi",
            key: "jitsi"
        }),
        ...(isModerator ? [
            e(CheckBox, {
                key: "toggle",
                className: "toggleModerator",
                value: viewToolbar,
                setValue: setViewToolbar,
            }),
            e("div", {
                key: "toolbar",
                id: "moderator",
                className: "flex-horizontal",
                style: {
                    display: viewToolbar ? "" : "none",
                }
            }, [
                e(Moderator, {
                    board: boardView,
                }),
            ]),
        ] : []),
    ]);
}

ReactDOM.render(
    e(Main, document.initialData),
    document.getElementById("root"),
);
delete document.initialData;
