import { Coord } from "./grid.js";

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

let dragged = null;
document.addEventListener("mousemove", (event) => {
    if (dragged) {
        if (event.buttons % 2 === 1) {
            dragged.dragMove(event);
        } else {
            dragged.dragEnd(event);
            dragged = null;
        }
    }
});
document.addEventListener("mouseup", (event) => {
    if (dragged && (event.button === 0)) {
        dragged.dragEnd(event);
        dragged = null;
    }

})
export function startDrag(obj) {
    if (dragged) {
        console.error("You can't start dragging, because there is already something being dragged");
    } else {
        dragged = obj;
    }

}
export function endDrag(obj) {
    if (dragged === obj) {
        dragged.dragEnd(null);
        dragged = null;
    } else {
        console.error("The object isn't being dragged.");
    }
}
export function getDragged() {
    return dragged;
}
