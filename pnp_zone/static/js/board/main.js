import React from "../react.js";
import ReactDOM from "../react-dom.js";
import Board from "./board.js";
import Moderator, {Tiles} from "./moderator.js";
import {ContextMenuController} from "./contextmenu.js";
import DragTarget, {DragController} from "./drag.js";
import {TabList} from "./tabs.js";
const e = React.createElement;

function Main(props) {
    const {x, y, scale, characters, tiles, images, bbb} = props;
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

    const bbbDomain = bbb !== "" ? bbb.match(/https?:\/\/[^/]+/)[0] : "";

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
                ...(bbb !== "" ? [
                    [
                        e("img", {
                            src: `${bbbDomain}/favicon.ico`,
                            width: 24,
                            height: 24,
                        }),
                        e("iframe", {
                            allow: `microphone ${bbbDomain}; camera ${bbbDomain}; fullscreen`,
                            src: bbb,
                            style: {
                                width: "100%",
                                height: "100vh",
                            }
                        })
                    ],
                ] : []),
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
