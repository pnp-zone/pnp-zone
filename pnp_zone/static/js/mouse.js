import { Coord } from "./grid.js";

let board = null;
export function init(b) {
    board = b;
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
    document.addEventListener("mousedown", down);
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
    return {
        boardX,
        boardY,
    };
}

function move(event) {

}

function up() {

}

function down() {

}