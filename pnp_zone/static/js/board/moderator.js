import React from "../react.js";
import socket from "../socket.js";
import TextInput from "./forms/textinput.js";
import ContextMenu from "./contextmenu.js";
import Modal from "./modal.js";
import {ColorPicker} from "./forms/colorpicker.js";
import staticUrl from "../lib/static.js";
import Select from "./forms/select.js";
const e = React.createElement;

function TableRow(props) {
    const {children, ...restProps} = props;
    return e("tr", {...restProps}, children.map((element) => e("td", {key: element.key}, [element])));
}

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

export class ImageModal extends React.Component {
    static contextType = ContextMenu;

    constructor(props) {
        super(props);
        this.state = {
            url: "",
            layer: props.layer,
            x: 0,
            y: 0,
            _isOpen: false,
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.layer !== this.props.layer)
            this.setState({layer: this.props.layer,});
    }

    render() {
        const setState = this.setState.bind(this);
        const state = this.state;
        const contextMenu = this.context;

        contextMenu.addDefaultItems("imageModal", (event) => [
            e("button", {
                onClick() {
                    setState({
                        _isOpen: true,
                        x: event.nativeEvent.boardX,
                        y: event.nativeEvent.boardY,
                    });
                    contextMenu.close();
                },
            }, `Add image here`),
        ]);

        if (!state._isOpen)
            return null;

        return e(Modal, {
            hideModal() {
                setState({_isOpen: false});
            },
        }, [
            e("form", {
                className: "margin",
                onSubmit(event) {
                    event.preventDefault();

                    // Load the image locally to figure out its width and height
                    const img = new Image();
                    img.onload = () => {
                        socket.send({
                            type: "image.new",
                            url: state.url,
                            layer: state.layer,
                            x: state.x - img.width / 2,
                            y: state.y - img.height / 2,
                            width: img.width,
                            height: img.height,
                        });
                    };
                    img.src = state.url;

                    setState({_isOpen: false});
                },
            }, [
                e("table", {}, [
                    e(TableRow, {}, [
                        e("label", {htmlFor: "bgUrl"}, "Url:"),
                        e(TextInput, {
                            id: "bgUrl",
                            value: state.url,
                            setValue(value) {
                                setState({url: value});
                            },
                            autoFocus: true,
                        }),
                    ]),
                    e(TableRow, {}, [
                        e("label", {htmlFor: "imageLayer"}, "Layer:"),
                        e(Select, {
                            id: "imageLayer",
                            options: this.props.layers,
                            value: state.layer,
                            setValue(value) {
                                setState({layer: value});
                            },
                        }),
                    ]),
                    e(TableRow, {}, [
                        e(React.Fragment),
                        e("button", {action: "submit"}, "Add"),
                    ]),
                ]),
            ]),
        ]);
    }
}
ImageModal.defaultProps = {
    layer: "background-images",
    layers: {
        "background-images": "Background Images",
        "foreground-images": "Foreground Images",
    },
};

export class CharacterModal extends React.Component {
    static contextType = ContextMenu;

    constructor(props) {
        super(props);
        this.state = {
            name: "",
            layer: props.layer,
            x: 0,
            y: 0,
            color: "hsla(0, 100%, 50%, 1)",
            _isOpen: false,
        };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.layer !== this.props.layer)
            this.setState({layer: this.props.layer,});
    }

    render() {
        const setState = this.setState.bind(this);
        const state = this.state;
        const contextMenu = this.context;

        contextMenu.addDefaultItems("moderator", (event) => [
            e("button", {
                onClick: () => {
                    setState({
                        x: event.nativeEvent.gridX,
                        y: event.nativeEvent.gridY,
                        _isOpen: true,
                    });
                    contextMenu.close();
                },
            }, `Add character here`),
        ]);

        if (!state._isOpen)
            return null;

        return e(Modal, {
            hideModal() {
                setState({_isOpen: false});
            },
        }, [
            e("form", {
                className: "margin",
                onSubmit: (event) => {
                    event.preventDefault();
                    socket.send({type: "character.new", ...state});
                    setState({_isOpen: false});
                }
            }, [
                e("table", {}, [
                    e(TableRow, {}, [
                        e("label", {htmlFor: "newName"}, "Name: "),
                        e(TextInput, {
                            id: "newName",
                            value: state.name,
                            setValue(value) {
                                setState({name: value})
                            },
                            autoFocus: true,
                        }),
                    ]),
                    e(TableRow, {}, [
                        e("label", {htmlFor: "characterLayer"}, "Layer:"),
                        e(Select, {
                            id: "characterLayer",
                            options: this.props.layers,
                            value: state.layer,
                            setValue(value) {
                                setState({layer: value});
                            },
                        }),
                    ]),
                    e("tr", {}, [
                        e("td", {colSpan: 2}, [
                            e(ColorPicker, {
                                value: state.color,
                                setValue(value) {
                                    setState({color: value})
                                },
                            }),
                        ]),
                    ]),
                    e(TableRow, {}, [
                        e(React.Fragment),
                        e("button", {action: "submit"}, "Add"),
                    ]),
                ]),
            ]),
        ]);
    }
}
CharacterModal.defaultProps = {
    layer: "characters",
    layers: {
        "characters": "Character Tokens",
    },
};
