import React from "../react.js";
import Character from "./character.js";
import Image, {ImageHitbox} from "./image.js";
import {Tile} from "./grid.js";
import {Cursor} from "./cursors.js";
import ContextMenu from "./contextmenu.js";

const e = React.createElement;

export class LayerStack extends React.Component {

    static contextType = ContextMenu;
    static layerTypes = {
        "tile": Tile,
        "character": Character,
        "image": Image,
        "cursor": Cursor,
    };

    constructor(props) {
        super(props);
        this.state = {
            moveImages: false,
        };
    }

    static layerSort([_A, {["level"]: levelA}], [_B, {["level"]: levelB}]) {
        return levelA - levelB;
    }

    static level0([_, {level}]) {
        return level === 0;
    }

    createElem([uuid, {type}]) {
        const {setLayerRef} = this.props;
        if (type === "image")
            return e(ImageLayer, {
                key: uuid,
                ref(elem) {
                    if (elem)
                        setLayerRef(uuid, elem);
                },
                component: LayerStack.layerTypes[type],
                // moveImages: this.state.moveImages && this.props.selectedLayer[type] === uuid,
                moveImages: this.state.moveImages,
            });
        else
            return e(Layer, {
                key: uuid,
                ref(elem) {
                    if (elem)
                        setLayerRef(uuid, elem);
                },
                component: LayerStack.layerTypes[type],
            });
    }

    render() {
        const contextMenu = this.context;
        const setState = this.setState.bind(this);
        const state = this.state;
        contextMenu.addDefaultItems("layer", () => [
            e("button", {
                className: state.moveImages ? "active" : "",
                onClick() {
                    setState((state) => ({moveImages: ! state.moveImages}));
                    contextMenu.close();
                },
            }, "Move images"),
        ]);

        const layers = Object.entries(this.props.layers).sort(LayerStack.layerSort);
        const level0 = layers.findIndex(LayerStack.level0);
        const elems = layers.map(this.createElem.bind(this));
        if (this.props.children.length > 0)
            elems.splice(level0, 0, this.props.children[0]);

        return e(React.Fragment, {}, elems)
    }
}
LayerStack.defaultProps = {
    selectedLayer: {
        image: "background-images",
        tiles: "tiles",
        character: "characters",
    },
    children: [null],
    setLayerRef(layer, ref) {},
    layers: {
        "uuid-1": {
            level: 1,
            type: null,
        },
        "uuid-2": {
            level: -1,
            type: null,
        },
        "uuid-3": {
            level: 0,
            type: null,
        },
    }
};

class Layer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data: {},
        };
        this.setData = function (update) {
            if (typeof update=== "function")
                this.setState((state) => ({data: update(state.data)}));
            else
                this.setState({data: update});
        }.bind(this);
    }
    render() {
        const {component, commonProps} = this.props;
        return e("div", {},
            Object.entries(this.state.data).map(([key, child]) => e(component, {key: key, ...commonProps, ...child}))
        );
    }
}
Layer.defaultProps = {
    component: "div",
};

class ImageLayer extends Layer {
    render() {
        const setState = this.setState.bind(this);

        if (this.props.moveImages)
            return e(React.Fragment, {}, [
                super.render(),
                e("div", {
                    style: {zIndex: 10},
                },
                Object.entries(this.state.data).map(([key, child]) =>
                    e(ImageHitbox, {
                        ...child,
                        setImage(image) {
                            setState((state) => ({
                                data: {
                                    ...state.data,
                                    [key]: {
                                        ...state.data[key],
                                        ...image,
                                    },
                                },
                            }));
                        },
                    })
                )),
            ]);
        else
            return super.render();
    }
}
ImageLayer.defaultProps = {
    component: "div",
    moveImages: false,
};
