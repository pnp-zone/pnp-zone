import React, {e} from "../../react.js";
import socket from "../../socket.js";
import TextInput from "../forms/textinput.js";
import {TableRow} from "../../lib/misc.js";

export default function UserTools({setPosition}) {
    const [x, setX] = React.useState(0);
    const [y, setY] = React.useState(0);
    const [scale, setScale] = React.useState(1);

    return e("form", {
        className: "flex-vertical margin",
        onSubmit(event) {
            event.preventDefault();
            const pos = {x, y, scale};
            for (const [key, value] of Object.entries(pos)) {
                const number = parseFloat(value);
                if (isNaN(number))
                    return;
                else
                    pos[key] = number;
            }

            setPosition(pos);
            socket.send({type: "session", ...pos,});
        }
    }, [
        e("h2", {}, "Set board position:"),
        e("table", {}, [
            e(TableRow, {}, [
                e("label", {
                    htmlFor: "userToolsX",
                }, [
                    "X:",
                ]),
                e(TextInput, {
                    id: "userToolsX",
                    value: x,
                    setValue: setX,
                }),
            ]),
            e(TableRow, {}, [
                e("label", {
                    htmlFor: "userToolsY",
                }, [
                    "Y:",
                ]),
                e(TextInput, {
                    id: "userToolsY",
                    value: y,
                    setValue: setY,
                }),
            ]),
            e(TableRow, {}, [
                e("label", {
                    htmlFor: "userToolsScale",
                }, [
                    "Scale:",
                ]),
                e(TextInput, {
                    id: "userToolsScale",
                    value: scale,
                    setValue: setScale,
                }),
            ]),
            e(TableRow, {}, [
                e(React.Fragment),
                e("button", {
                    type: "submit"
                }, "Set position"),
            ]),
        ]),
    ]);
}
