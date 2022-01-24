import React from "../react.js";
import Character from "./character.js";
import Image from "./image.js";
import {Tile} from "./grid.js";
import {Cursor} from "./cursors.js";
const e = React.createElement;


export class LayerStack extends React.Component {

    static layerTypes = {
        "tile": Tile,
        "character": Character,
        "image": Image,
        "cursor": Cursor,
    };

    constructor(props) {
        super(props);
    }

    static layerSort([_A, {["level"]: levelA}], [_B, {["level"]: levelB}]) {
        return levelA - levelB;
    }

    static level0([_, {level}]) {
        return level === 0;
    }

    static createElem([uuid, {children, type}]) {
        return e(Layer, {
            key: uuid,
            childrenData: children,
            childrenComponent: LayerStack.layerTypes[type],
            commonProps: undefined,
        });
    }

    render() {
        const layers = Object.entries(this.props.layers).sort(LayerStack.layerSort);
        const level0 = layers.findIndex(LayerStack.level0);
        const elems = layers.map(LayerStack.createElem);
        if (this.props.children.length > 0)
            elems.splice(level0, 0, this.props.children[0]);

        return e(React.Fragment, {}, elems)
    }
}
LayerStack.defaultProps = {
    children: [null],
    layers: {
        "uuid-1": {
            level: 1,
            children: {},
            type: null,
        },
        "uuid-2": {
            level: -1,
            children: {},
            type: null,
        },
        "uuid-3": {
            level: 0,
            children: {},
            type: null,
        },
    }
};

export default class Layer extends React.Component {
    render() {
        const {childrenData, childrenComponent, id, commonProps, filter} = this.props;

        return e("div", {id},
            Object.entries(childrenData)
                .filter(([_, child]) => !filter || filter(child))
                .map(([key, child]) => e(childrenComponent, {key: key, ...commonProps, ...child}))
        );
    }
}
Layer.defaultProps = {
    childrenData: {},
}
