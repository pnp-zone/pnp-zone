import React from "https://cdn.skypack.dev/react";
import ReactDOM from "https://cdn.skypack.dev/react-dom";
import Board from "./board.js";

ReactDOM.render(
    React.createElement(Board, document.initialData),
    document.getElementById("board-view")
);
delete document.initialData;
