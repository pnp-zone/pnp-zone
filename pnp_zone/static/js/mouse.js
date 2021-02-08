import { Coord } from "./grid.js";

let board = null;
export function init(b) {
    board = b;

    // Mouse events
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
}