import React, {e} from "../../react.js";
import staticUrl from "../../lib/static.js";
import {TableRow} from "../../lib/misc.js";

function layerSort([_A, {["level"]: levelA}], [_B, {["level"]: levelB}]) {
    return levelB - levelA;
}
const layerTypes = {
    tile: staticUrl("img/tiles.svg"),
    character: staticUrl("img/character.svg"),
    image: staticUrl("img/image.svg"),
    cursor: staticUrl("img/cursor.svg"),
};

export function LayerList(props) {
    const {layers, setSelectedLayer} = props;
    return e("table", {className: "layer-list"},
        Object.entries(layers)
            .sort(layerSort)
            .map(([uuid, {type, name}]) =>
                e(TableRow, {
                    key: uuid,
                    onClick() {
                        setSelectedLayer(type, uuid);
                    },
                }, [
                    e("img", {src: layerTypes[type], className: "icon"}),
                    name,
                    /*e("img", {src: "/static/img/show.svg", className: "icon"}),
                    e("div", {className: "flex-vertical"}, [
                        e("img", {src: "/static/img/up.svg", className: "icon"}),
                        e("img", {src: "/static/img/down.svg", className: "icon"}),
                    ]),
                    e("img", {src: "/static/img/close.svg", className: "icon"}),*/
                ])
            )
    );
}
LayerList.defaultProps = {
    setSelectedLayer(type, layer) {},
};
