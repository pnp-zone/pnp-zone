import React from "https://cdn.skypack.dev/react";
import ReactDOM from "https://cdn.skypack.dev/react-dom";
const e = React.createElement;


export class Contextmenu extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: false,
            defaultChildren: {},
            children: [],
            x: 0,
            y: 0,
        };
        this.div = React.createRef(null);
    }

    render() {
        const {visible, children, x, y} = this.state;
        return e("div", {
            ref: this.div,
            style: {
                position: "fixed",
                left: `${x}px`,
                top: `${y}px`,
            },
            tabIndex: -1,
            onFocus: function () { this.setState({visible: true}); }.bind(this),
            onBlur: function (event) {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                    // Not triggered when swapping focus between children or moving it to a child
                    this.setState({visible: false, children: []});
                }
            }.bind(this),
            onKeyDown: (event) => {
                if (event.key === "Escape") {
                    Menu.close();
                }
            },
        }, visible ? children : []);
    }

    static close() {
        document.activeElement.blur();
    }

    static addDefaultItems(key, getItems) {
        menu.setState((state) => ({
            defaultChildren: {...state.defaultChildren, [key]: getItems}
        }));
    }

    static handler(getItems) {
        return function (event) {
            if (!event.defaultPrevented) {
                event.preventDefault();
                menu.setState((state) => {
                    const initialChildren = [];
                    for (const key in state.defaultChildren) {
                        if (state.defaultChildren.hasOwnProperty(key)) {
                            initialChildren.push(state.defaultChildren[key](event));
                        }
                    }

                    return {
                        children: initialChildren,
                        x: event.clientX,
                        y: event.clientY,
                    };
                });
            }

            menu.setState((state) => ({
                children: [...state.children, e("hr"), getItems(event)],
            }));
            menu.div.current.focus();
        };
    }
}
const menu = ReactDOM.render(e(Contextmenu), document.getElementById("context-menu"));
