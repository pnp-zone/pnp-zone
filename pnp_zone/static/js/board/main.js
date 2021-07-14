import React from "../react.js";
import ReactDOM from "../react-dom.js";
import Board from "./board.js";
import Moderator from "./moderator.js";
import CheckBox from "./forms/checkbox.js";
import {ContextMenuController} from "./contextmenu.js";
import {TabList} from "./tabs.js";
const e = React.createElement;

function Main(props) {
    const {x, y, scale, characters, tiles, images} = props;
    const {isModerator} = props;
    const [boardView, setBoardView] = React.useState(null);
    const [viewToolbar, setViewToolbar] = React.useState(false);
    const [editMode, setEditMode] = React.useState(false);

    const ref = React.useRef();
    React.useEffect(() => {
        if (boardView === null) {
            setBoardView(ref.current);
        }
    });

    return e(ContextMenuController, {
        containerId: "context-menu",
    }, [
        e("div", {
            id: "board-view",
            key: "board",
            ref,
        }, [
            e(Board, {parent: boardView, x, y, scale, characters, tiles, images, editMode}),
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
                    editMode,
                    setEditMode,
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
