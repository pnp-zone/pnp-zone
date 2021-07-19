import React from "../react.js";
import ReactDOM from "../react-dom.js";
import Board from "./board.js";
import Moderator, {Tiles} from "./moderator.js";
import {ContextMenuController} from "./contextmenu.js";
import DragTarget, {DragController} from "./drag.js";
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
        e(DragController, {}, [
            e("div", {
                id: "board-view",
                key: "board",
                ref,
            }, [
                e(Board, {parent: boardView, x, y, scale, characters, tiles, images, editMode}),
            ]),
            e(TabList, {}, [
                [e("img", {src: "https://docs.bigbluebutton.org/favicon.ico"}), "here be dragons"],
                ...(isModerator ? [
                    ["Moderator", e(Moderator, {
                        editMode,
                        setEditMode,
                    })],
                    [
                        e("img", {
                            src: "/static/img/paintbrush.svg",
                            width: 24,
                            height: 24,
                        }),
                        e(Tiles, {
                            board: boardView,
                        })
                    ],
                ] : []),
            ]),
            e("div", {
                id: "jitsi",
                key: "jitsi"
            }),
        ]),
    ]);
}

ReactDOM.render(
    e(Main, document.initialData),
    document.getElementById("root"),
);
delete document.initialData;
