import React from "../react.js";
import ReactDOM from "../react-dom.js";
import Board from "./board.js";
import {CharacterModal, ImageModal} from "./moderator.js";
import {ContextMenuController} from "./contextmenu.js";
import {TabList} from "./sidemenu/tabs.js";
import UserTools from "./sidemenu/usertools.js";
import Paintbrush from "./sidemenu/paintbrush.js";
import {BoardSwitch} from "./sidemenu/boardlist.js";
import {LayerList} from "./sidemenu/layerlist.js";
const e = React.createElement;

function Main(props) {
    const {bbb, boards, isModerator} = props;

    const [board, setBoard] = React.useState(document.initialBoard);
    const [selectedLayer, setSelectedLayer] = React.useState(() => {
        const obj = {
            image: "background-images",
            character: "characters",
            tile: "tiles",
        };
        for (const [type, uuid] of Object.entries(obj)) {
            if (board.layers[uuid] === undefined)
                obj[type] = null;
        }
        for (const [uuid, {type}] of Object.entries(board.layers)) {
            if (obj[type] === null)
                obj[type] = uuid;
        }
        return obj;
    });
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
            },
            selectedLayer,
        }),
        ...(isModerator ? [
            e(CharacterModal, {
                layer: selectedLayer.character,
                layers: Object.fromEntries(Object.entries(board.layers).filter(([_, {type}]) => type === "character").map(([layer, {name}]) => [layer, name])),
            }),
            e(ImageModal, {
                layer: selectedLayer.image,
                layers: Object.fromEntries(Object.entries(board.layers).filter(([_, {type}]) => type === "image").map(([layer, {name}]) => [layer, name])),
            }),
        ] : []),
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
            [
                "User Tools",
                e(UserTools, {
                    setPosition({x, y, scale}) {
                        setBoard({...board, x, y, scale});
                    },
                }),
            ],
            ...(isModerator ? [
                [
                    e("img", {src: "/static/img/paintbrush.svg", className: "icon"}),
                    e(Paintbrush, {layer: selectedLayer.tile}),
                ],
                [
                    "Board",
                    e(BoardSwitch, {boards}),
                ],
                [
                    "Layers",
                    e(LayerList, {
                        layers: board.layers,
                        setSelectedLayer(type, layer) {
                            if (selectedLayer.hasOwnProperty(type))
                                setSelectedLayer({...selectedLayer, [type]: layer});
                        }
                    }),
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
