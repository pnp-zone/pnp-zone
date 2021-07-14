import React from "../react.js";

import socket from "../socket.js";
const e = React.createElement;

export function Cursor(props) {
    const {name, x, y} = props;

    return e("div", {
        class: "cursor board-element",
        style: {
            left: `${x}px`,
            top: `${y}px`,
        }
    }, [
        e("span", {}),
        e("p", {}, name),
    ]);
}

// Timeout to remove inactive cursors
const DELETING_TIMEOUT = 5000;
const deletingTimeout = {};

// Timeout for sending movement events to server
const SENDING_TIMEOUT = 100;
let sendingTimeout = null;

// This listener sends cursor events over the websocket
document.addEventListener("mousemove", (event) => {
    if (!sendingTimeout) {
        sendingTimeout = setTimeout(() => {
            socket.send({type: "cursor", x: event.boardX, y: event.boardY});
            sendingTimeout = null;
        }, SENDING_TIMEOUT);
    }
});
