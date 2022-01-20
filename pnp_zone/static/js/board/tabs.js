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

export function TabList(props) {
    const {children, open, setOpen, ...leftProps} = props;
    const [width, setWidth] = React.useState("30vw");

    if (children === undefined || children.length === 0) {
        return null;
    }

    const resize = React.useMemo(() => {
        const resize = new Drag();
        resize.register(LEFT_BUTTON, {
            dragStart() {},
            dragMove(event) { setWidth(`${event.clientX / window.innerWidth * 100}vw`); },
            dragEnd() {},
        });
        return resize;
    }, [setWidth]);

    return e("div", {
        className: "flex-horizontal",
        style: {
            position: "fixed",
            left: open === -1 ? `calc(-${width} - 0.5em)` : "0",
            transition: "left 0.5s",
        },
        ...leftProps,
    }, [
        e("div", {
            key: "pages",
            className: "flex-vertical moderator",
            style: {
                height: "100vh",
                width,
                overflow: "hidden",
            },
        }, children.map(
            ([tab, content], index) => e(Page, {
                isOpen: open === index
            }, content),
        )),
        e("div", {
            className: "moderator",
            style: {
                width: "0.5em",
                height: "100vh",
                cursor: "ew-resize",
            },
            onMouseDown: resize.onMouseDown,
        }, []),
        e("div", {
            key: "tabs",
            className: "flex-vertical",
        }, children.map(
            ([tab, content], index) => e(Tab, {
                isOpen: open === index,
                open: function () { setOpen(open === index ? -1 : index); },
            }, tab)
        )),
    ]);
}