import tags from "./lib/tagFactory.js";
import socket from "./socket.js";

// Timeout for sending movement events to server
const SENDING_TIMEOUT = 100;
let sendingTimeout = null;

// Timeout to remove inactive cursors
const DELETING_TIMEOUT = 5000;
const deletingTimeout = {};

// Div to add cursors to
const CONTAINER = document.getElementById("cursors");

// Map from id to existing cursors
const CURSORS = {};

// This function processes the cursor events from the websocket
export function handleCursors(event) {
    const { id, name, x, y } = event;

    let cursor = CURSORS[id];
    if (cursor) {
        clearTimeout(deletingTimeout[id]);
    } else {
        cursor = tags.div({
            class: "cursor board-element",
            children: [
                tags.span({}),
                tags.p({
                    innerText: name,
                })
            ],
        });
        CONTAINER.appendChild(cursor);
        CURSORS[id] = cursor;
    }

    deletingTimeout[id] = setTimeout(() => {
        cursor.remove();
        CURSORS[id] = undefined;
    }, DELETING_TIMEOUT);
    cursor.style.left = "" + x + "px";
    cursor.style.top = "" + y + "px";
}

// This listener sends cursor events over the websocket
document.addEventListener("mousemove", (event) => {
    if (!sendingTimeout) {
        sendingTimeout = setTimeout(() => {
            socket.send({type: "cursor", x: event.boardX, y: event.boardY});
            sendingTimeout = null;
        }, SENDING_TIMEOUT);
    }
});
