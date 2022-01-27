import React from "../react.js";
import ContextMenu from "./contextmenu.js";
import Hitbox from "./resizing.js";
import socket from "../socket.js";
const e = React.createElement;

export function ImageHitbox(props) {
    const {id, x, y, width, height, setImage, layer} = props;
    const contextMenu = React.useContext(ContextMenu);

    return e(Hitbox, {
        rect: {x, y, width, height},
        setRect: (rect) => setImage({id, ...rect}),
        dragEnd() {
            socket.send({
                type: "image.move",
                id, x, y, width, height,
            });
        },
        onContextMenu: contextMenu.handler(() => {
            return [
                /*e("button", {
                    onClick: () => {
                        socket.send({type: "image.change_layer", id, layer: layer === "B" ? "T" : "B"});
                        contextMenu.close();
                    },
                }, layer === "B" ? "Move to foreground" : "Move to background"),*/
                e("button", {
                    onClick: () => {
                        socket.send({type: "image.delete", id,});
                        contextMenu.close();
                    },
                }, "Delete image"),
            ];
        }),
    });
}

export default function Image({url, x, y, width, height}) {
    return e("img", {
        src: url,
        style: {
            position: "absolute",
            left: `${x}px`,
            top: `${y}px`,
            width: `${width}px`,
            height: `${height}px`,
        },
    });
}
