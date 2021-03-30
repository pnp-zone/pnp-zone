import { Coord } from "./grid.js";
import { EventGroup, EventListener } from "./eventHandler.js";

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

let dragged_for_button = {};
const dragHandler = new EventGroup(
        /*new EventListener(document, "mousedown", (event) => {
            if (dragged_for_button[event.button]) {
                dragged_for_button[event.button].dragStart(event);
            }
        }),*/
        new EventListener(document, "mousemove", (event) => {
            const pressed_buttons = buttons(event);
            for (let button in dragged_for_button) {
                if (pressed_buttons[button] && dragged_for_button[button]) {
                    dragged_for_button[button].dragMove(event);
                }
            }
        }),
        new EventListener(document, "mouseup", (event) => {
            if (dragged_for_button[event.button]) {
                dragged_for_button[event.button].dragEnd(event);
                dragged_for_button[event.button] = null;
            }
        }),
);
dragHandler.enable();

const dragStarter = {};

export function registerDrag(obj, button=LEFT_BUTTON, target=null, name=null) {
    if (!name) {
        name = "" + obj;
    }
    if (!target) {
        target = obj;
    }

    dragStarter[name] = new EventListener(target, "mousedown", (event) => {
        if (event.button === button) {
            if (startDrag(obj, button)) {
                obj.dragStart(event);
                event.stopPropagation();
            }
        }
    }).enable();
}

export function disableDrag(name) {
    dragStarter[name].disable();
}

export function enableDrag(name) {
    dragStarter[name].enable();
}

export function startDrag(obj, button=LEFT_BUTTON) {
    if (dragged_for_button[button]) {
        console.error("You can't start dragging, because there is already something being dragged");
        return false;
    } else {
        dragged_for_button[button] = obj;
        dragHandler.enable();
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
