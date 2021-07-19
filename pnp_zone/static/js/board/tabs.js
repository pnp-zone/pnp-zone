import React from "../react.js";
import {LEFT_BUTTON} from "../lib/mouse.js";
import {Drag} from "./drag.js";
const e = React.createElement;

function Tab(props) {
    const {children, open, isOpen} = props;
    return e("div", {
        className: isOpen ? "active-tab tab" : "tab",
        onClick: open,
    }, children);
}

function Page(props) {
    const {isOpen, children} = props;
    return e("div", {
        style: {
            display: isOpen ? "" : "none",
        },
    }, children);
}

export class TabList extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            open: -1,
            width: "30vw",
        };

        const setState = this.setState.bind(this);
        this.resize = new Drag();
        this.resize.register(LEFT_BUTTON, {
            dragStart() {},
            dragMove(event) {
                setState({width: `${event.clientX / window.innerWidth * 100}vw`});
            },
            dragEnd() {},
        });
    }

    render() {
        const {children} = this.props;
        const {open, width} = this.state;
        return e("div", {
            className: "flex-horizontal",
            style: {
                position: "fixed",
                left: open === -1 ? `calc(-${width} - 0.5em)` : "0",
                transition: "left 0.5s",
            }
        }, [
            e("div", {
                key: "pages",
                className: "flex-vertical",
                style: {
                    height: "100vh",
                    backgroundColor: "#16232d",
                    width,
                    overflow: "hidden",
                },
            }, children.map(
                ([tab, content], index) => e(Page, {
                    isOpen: open === index
                }, content),
            )),
            e("div", {
                style: {
                    width: "0.5em",
                    height: "100vh",
                    backgroundColor: "#16232d",
                    cursor: "ew-resize",
                },
                onMouseDown: this.resize.onMouseDown,
            }, []),
            e("div", {
                key: "tabs",
                className: "flex-vertical",
            }, children.map(
                ([tab, content], index) => e(Tab, {
                    isOpen: open === index,
                    open: function () {this.setState({open: open === index ? -1 : index})}.bind(this)
                }, tab)
            )),
        ]);
    }
}