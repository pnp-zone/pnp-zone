import React from "../react.js";
import ReactDOM from "../react-dom.js";
const e = React.createElement;

const ContextMenu = React.createContext();
ContextMenu.displayName = "ContextMenu";
export default ContextMenu;

export class ContextMenuController extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            visible: false,
            defaultChildren: {},
            children: [],
            x: 0,
            y: 0,
        };
        this.container = document.getElementById(this.props.containerId);
        const setState = this.setState.bind(this);
        this.controls = {
            close () {
                setState({visible: false, children: []});
            },
            setPos({x, y}) {
                setState({x, y});
            },
            handler(getItems) {
                return function (event) {
                    if (!event.defaultPrevented) {
                        event.preventDefault();
                        setState((state) => {
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
                                visible: true,
                            };
                        });
                    }

                    setState((state) => ({
                        children: [...state.children, e("hr"), getItems(event)],
                    }));
                };
            },
            addDefaultItems(key, getItems) {
                setState((state) => ({
                    defaultChildren: {...state.defaultChildren, [key]: getItems}
                }));
            }
        };
    }

    componentWillUpdate(prevProps) {
        if (prevProps.containerId !== this.props.containerId) {
            this.container = document.getElementById(this.props.containerId);
        }
    }

    render() {
        const {children} = this.props;
        const {visible} = this.state;

        return e(ContextMenu.Provider, {
            value: this.controls,
            onContextMenu: function (event) {
                event.preventDefault();
            }.bind(this),
        }, [
            ReactDOM.createPortal(
                visible ? e(ContextMenuComponent, this.state) : e(React.Fragment),
                this.container,
            ),
            ...children
        ]);
    }
}

export class ContextMenuComponent extends React.Component {
    static contextType = ContextMenu;

    constructor(props) {
        super(props);

        this.div = React.createRef();
    }

    componentDidMount() {
        const div = this.div.current;
        div.focus();

        const {x, y, width, height} = div.getBoundingClientRect();
        const maxWidth = window.innerWidth;
        const maxHeight = window.innerHeight;

        const newPos = {};
        if (y + height > maxHeight) {
            newPos.y = maxHeight - height;
        }
        if (x + width > maxWidth) {
            newPos.x = maxWidth - width;
        }

        if (newPos.x || newPos.y) {
            this.context.setPos(newPos);
        }
    }

    render() {
        const {children, x, y} = this.props;
        return e("div", {
            ref: this.div,
            style: {
                position: "fixed",
                left: `${x}px`,
                top: `${y}px`,
            },
            tabIndex: -1,
            onBlur: function (event) {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                    this.context.close();
                }
            }.bind(this),
            onKeyDown: (event) => {
                if (event.key === "Escape") {
                    this.context.close();
                }
            },
        }, children);
    }
}
