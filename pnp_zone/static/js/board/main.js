import React from "../react.js";
import ReactDOM from "../react-dom.js";
import Board from "./board.js";
import Moderator, {BoardSwitch, LayerList, Tiles} from "./moderator.js";
import {ContextMenuController} from "./contextmenu.js";
import {TabList} from "./tabs.js";
const e = React.createElement;

function Main(props) {
    const {bbb, boards, isModerator} = props;

    const [board, setBoard] = React.useState(document.initialBoard);
    const [editMode, setEditMode] = React.useState(false);
    const [activeDrag, setActiveDrag] = React.useState(false);
    const [openTab, setOpenTab] = React.useState(bbb !== "" ? 0 : -1);

    const bbbDomain = bbb !== null ? bbb.match(/https?:\/\/[^/]+/)[0] : null

    return e(ContextMenuController, {
        containerId: "context-menu",
    }, [
        e(Board, {
            editMode,
            ...board,
            setBoard(value) {
                if (typeof value === "function")
                    value = value(board);
                setBoard({...board, ...value});
            }
        }),
        isModerator ? e(Moderator, {editMode, setEditMode}) : null,
        e(TabList, {
            open: openTab,
            setOpen: setOpenTab,
            onMouseDownCapture() { setActiveDrag(true); },
            onMouseUpCapture() { setActiveDrag(false); },
        }, [
            ...(bbb !== null ? [
                [
                    e("img", {src: `${bbbDomain}/favicon.ico`, className: "icon"}),
                    e("iframe", {
                        allow: `microphone ${bbbDomain}; camera ${bbbDomain}`,
                        allowFullScreen: true,
                        src: bbb,
                        style: {
                            width: "100%",
                            height: "100vh",
                            pointerEvents: activeDrag ? "none" : "",
                        }
                    })
                ],
            ] : []),
            ...(isModerator ? [
                [
                    e("img", {src: "/static/img/paintbrush.svg", className: "icon"}),
                    e(Tiles, {})
                ],
                [
                    "Board",
                    e(BoardSwitch, {boards}),
                ],
                [
                    "Layers",
                    e(LayerList, {layers: board.layers}),
                ],
            ] : []),
        ]),
    ]);
}

ReactDOM.render(
    e(Main, document.initialData),
    document.getElementById("root"),
);
delete document.initialData;
