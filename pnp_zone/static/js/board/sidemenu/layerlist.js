import React, {e} from "../../react.js";
import staticUrl from "../../lib/static.js";
import {TableRow} from "../../lib/misc.js";
import socket from "../../socket.js";

function layerSort([_A, {["level"]: levelA}], [_B, {["level"]: levelB}]) {
    return levelB - levelA;
}
const layerTypes = {
    tile: staticUrl("img/tiles.svg"),
    character: staticUrl("img/character.svg"),
    image: staticUrl("img/image.svg"),
    cursor: staticUrl("img/cursor.svg"),
};

function renderLayer([uuid, {type, name, level}]) {
    if (uuid === null) {
        return e("tr", {}, [e("td", {colspan: 5}, [""])]);
    } else {
        return e(TableRow, {
            key: uuid,
            /*onClick() {
                setSelectedLayer(type, uuid);
            },*/
        }, [
            e("img", {src: layerTypes[type], className: "icon"}),
            name,
            e("img", {src: "/static/img/show.svg", className: "icon"}),
            e("div", {className: "flex-vertical"}, [
                e("img", {
                    src: "/static/img/up.svg", className: "icon",
                }),
                e("img", {
                    src: "/static/img/down.svg", className: "icon",
                }),
            ]),
            e("img", {
                src: "/static/img/close.svg", className: "icon",
            }),
        ]);
    }
}

export function LayerList(props) {
    const {layers, setSelectedLayer} = props;
    const layerEntries = Object.entries(layers);
    layerEntries.push([null, {level: 0}]);

    return e("div", {className: "flex-vertical"}, [
        e("table", {className: "layer-list"},
            layerEntries.sort(layerSort).map(renderLayer)
        ),
        e("form", {
            onSubmit(event) {
                event.preventDefault();
                let [name, type] = event.target;
                name = name.value;
                type = type.value;
                socket.send({
                    type: "layer.new",
                    component_type: type,
                    name,
                });
            }
        }, [
            e("table", {}, [
                e(TableRow, {}, [
                    e("label", {htmlFor: "layer-name"}, "Name"),
                    e("input", {id: "layer-name", required: true}),
                ]),
                e(TableRow, {}, [
                    e("label", {htmlFor: "layer-type"}, "Type"),
                    e("select", {id: "layer-type"}, [
                        e("option", {value: "character"}, "Character"),
                        e("option", {value: "tile"}, "Tile"),
                        e("option", {value: "image"}, "Image"),
                    ]),
                ]),
                e(TableRow, {}, [
                    e(React.Fragment),
                    e("button", {type: "submit"}, "Add @ top"),
                ]),
            ]),
        ]),
    ]);
}
LayerList.defaultProps = {
    setSelectedLayer(type, layer) {},
};
