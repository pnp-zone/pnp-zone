import React, {e} from "../../react.js";
import staticUrl from "../../lib/static.js";
import {TableRow} from "../../lib/misc.js";
import socket from "../../socket.js";
import {SortableList} from "./sortablelist.js";

function layerSort([_A, {["level"]: levelA}], [_B, {["level"]: levelB}]) {
    return levelB - levelA;
}
const layerTypes = {
    tile: staticUrl("img/tiles.svg"),
    character: staticUrl("img/character.svg"),
    image: staticUrl("img/image.svg"),
    cursor: staticUrl("img/cursor.svg"),
};

function renderLayer(setSelectedLayer, [uuid, {type, name}]) {
    if (uuid === null) {
        return e("tr", {}, [e("td", {colspan: 5}, [""])]);
    } else {
        return e(TableRow, {
            key: uuid,
            onClick() {
                setSelectedLayer(type, uuid);
            },
        }, [
            e("img", {src: layerTypes[type], className: "icon"}),
            name,
            e("img", {src: "/static/img/show.svg", className: "icon"}),
            e("img", {
                src: "/static/img/close.svg", className: "icon",
                onClick() {
                    socket.send({type: "layer.drop", id: uuid});
                }
            }),
        ]);
    }
}

export function LayerList(props) {
    const {layers: {cursors: _, ...layers}, setSelectedLayer} = props;
    const layerEntries = Object.entries(layers);
    layerEntries.push([null, {level: 0}]);
    const table = React.useRef();

    return e("div", {className: "flex-vertical"}, [
        e("form", {
            onSubmit(event) {
                event.preventDefault();
                const {type: {value: type}, name: {value: name}} = event.target.elements;
                socket.send({
                    type: "layer.new",
                    component_type: type,
                    name,
                });
            },
        }, [
            e("table", {className: "layer-list"}, [
                e("thead", {}, [
                    e(TableRow, {colspans: {1: 3}}, [
                        e("img", {src: layerTypes.cursor, className: "icon"}),
                        "Cursors",
                    ]),
                ]),
                e("tbody", {ref: table}, [
                    e(SortableList, {
                        domParent: table,
                        setIndex(key, index) {
                            if (!isNaN(index))
                                socket.send({type: "layer.move", layer: key, index});
                        },
                    },
                        layerEntries.sort(layerSort).map(renderLayer.bind(null, setSelectedLayer))
                    ),
                ]),
                e("tfoot", {}, [
                    e(TableRow, {colspans: {2: 2}}, [
                        e("select", {name: "type"}, [
                            e("option", {value: "character"}, "Character"),
                            e("option", {value: "tile"}, "Tile"),
                            e("option", {value: "image"}, "Image"),
                        ]),
                        e("input", {name: "name"}),
                        e("button", {type: "submit"}, "Add @ top"),
                    ]),
                ]),
            ]),
        ]),
    ]);
}
LayerList.defaultProps = {
    setSelectedLayer(type, layer) {},
};
