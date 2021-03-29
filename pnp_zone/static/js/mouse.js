import { Coord } from "./grid.js";

export const LEFT_BUTTON = 0;
export const MIDDLE_BUTTON = 1;
export const RIGHT_BUTTON = 2;

export function buttons(event) {
    return {
        0: event.buttons & 1,  // left
        1: event.buttons & 4,  // middle
        2: event.buttons & 2,  // right
        // back: event.buttons & 8,
        // forward: event.buttons & 16,
    };
}

let board = null;
export function init(b) {
    board = b;

    // Extend mouse events
    document.addEventListener("click", extendEvent, true);
    document.addEventListener("contextmenu", extendEvent, true);
    document.addEventListener("ondbclick", extendEvent, true);
    document.addEventListener("mousedown", extendEvent, true);
    document.addEventListener("mouseenter", extendEvent, true);
    document.addEventListener("mouseleave", extendEvent, true);
    document.addEventListener("mousemove", extendEvent, true);
    document.addEventListener("mouseout", extendEvent, true);
    document.addEventListener("mouseover", extendEvent, true);
    document.addEventListener("mouseup", extendEvent, true);
}

export function extendEvent(event) {
    const boardViewRect = board.obj.parentElement.getBoundingClientRect();

    // is the cursor over the board?
    //const overBoard = (boardViewRect.left < event.clientX && event.clientX < boardViewRect.right)
    //    && boardViewRect.top < event.clientY && event.clientY < boardViewRect.bottom;

    // get the cursor coordinates in the board
    // (taking position and scale into consideration)
    const boardX = (event.clientX - boardViewRect.x)/board.scale + board.left;
    const boardY = (event.clientY - boardViewRect.y)/board.scale + board.top;

    event.boardX = boardX;
    event.boardY = boardY;

    let coord = null;
    Object.defineProperty(event, "gridX", {get: () => {
        if (!coord) {
            coord = Coord.fromPixel(boardX, boardY);
        }
        return coord.xIndex;
    }});
    Object.defineProperty(event, "gridY", {get: () => {
            if (!coord) {
                coord = Coord.fromPixel(boardX, boardY);
            }
            return coord.yIndex;
    }});
}

let is_drag_active = false;
let dragged_for_button = {};
document.addEventListener("mousemove", (event) => {
    if (is_drag_active) {
        const pressed_buttons = buttons(event);
        for (let button in dragged_for_button) {
            if (!pressed_buttons[button]) {
                _endDrag(button, event)
            } else {
                dragged_for_button[button].dragMove(event);
            }
        }
    }
});
document.addEventListener("mouseup", (event) => {
    if (is_drag_active) {
        for (let button in dragged_for_button) {
            if (event.button === parseInt(button)) {
                _endDrag(button, event)
            }
        }
    }
});

function _endDrag(button, event=null) {
    dragged_for_button[button].dragEnd(event);
    delete dragged_for_button[button];

    is_drag_active = false;
    for (let button in dragged_for_button) {
        is_drag_active = true;
        break;
    }
}

export function startDrag(obj, button=LEFT_BUTTON) {
    if (dragged_for_button[button]) {
        console.error("You can't start dragging, because there is already something being dragged");
        return false;
    } else {
        dragged_for_button[button] = obj;
        is_drag_active = true;
        return true
    }
}
export function endDrag(obj, button=LEFT_BUTTON) {
    if (dragged_for_button[button] === obj) {
        dragged_for_button[button].dragEnd(null);
        dragged_for_button[button] = null;
    } else {
        console.error("The object isn't being dragged.");
    }
}
export function getDragged(button=LEFT_BUTTON) {
    return dragged_for_button[button];
}
