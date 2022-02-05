import React, {e} from "../../react.js";
import socket from "../../socket.js";

export function BoardSwitch(props) {
    const {boards} = props;
    const [selected, setSelected] = React.useState(null);

    return e("div", {}, [
        e("div", {
            className: "campaignRow",
            style: {
                margin: 0,
            },
        }, Object.entries(boards).map(([uuid, name]) =>
            e("a", {
                key: uuid,
                className: "campaignItem" + (selected === uuid ? " campaignItem-hover" : ""),
                onClick(event) { setSelected(selected === uuid ? null : uuid); event.preventDefault(); },
            }, name)
        )),
        e("hr"),
        selected === null ? null : e("div", {}, [
            e("h1", {}, boards[selected]),
            e("div", {}, [
                e("button", {
                    onClick() {
                        const last = window.location.origin + window.location.pathname;
                        const url = last.replace(last.match(/.+\/([-0-9a-f]+)/)[1], selected);
                        socket.sendLocally({type: "switch", url,});
                    },
                }, "Switch"),
                e("button", {
                    onClick() {
                        const last = window.location.origin + window.location.pathname;
                        const url = last.replace(last.match(/.+\/([-0-9a-f]+)/)[1], selected);
                        socket.send({type: "switch", url,});
                    },
                }, "Switch for all"),
            ]),
        ]),
    ]);
}
