import React from "https://cdn.skypack.dev/react";
import ReactDOM from "https://cdn.skypack.dev/react-dom";
const e = React.createElement;


/*
 * Utility
 */
export const LEFT_BUTTON = 0;
export const MIDDLE_BUTTON = 1;
export const RIGHT_BUTTON = 2;

export function buttons(event) {
    return {
        0: event.buttons & 1,  // left
        1: event.buttons & 4,  // middle
        2: event.buttons & 2,  // right
        // back: event.buttons & 8,
        // forward: event.buttons & 16,
    };
}


/*
 * Mouse event extensions
 * ----------------------
 *
 * Using `addMouseExtension` one can register a function to extend mouse events.
 * When a mouse event is fired it will go through this function before propagating through the DOM.
 * The function then can modify/ extend the event object in any way.
 *
 * The event will be given to the function as its first and only parameter and should be modified directly.
 * The function's return value will have no effect.
 */
const mouseEvents = [
    "click",
    "contextmenu",
    "ondbclick",
    "mousedown",
    "mouseenter",
    "mouseleave",
    "mousemove",
    "mouseout",
    "mouseover",
    "mouseup",
    "wheel",
];
const extensions = [];
for (let i = 0; i < mouseEvents.length; i++) {
    document.addEventListener(mouseEvents[i], (event) => {
        for (let i = 0; i < extensions.length; i++) {
            extensions[i](event);
        }
    }, true);
}
export function addMouseExtension(extension) {
    extensions.push(extension);
}


/*
 * Context Menus
 * -------------
 */
export class Menu extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: false,
            children: [],
            x: 0,
            y: 0,
        };
    }

    show() { this.setState({visible: true}); }
    hide() { this.setState({visible: false, children: []}); }

    render() {
        const {visible, children, x, y} = this.state;
        if (!visible) {
            return null;
        } else {
            return e("div", {
                style: {
                    position: "absolute",
                    left: `${x}px`,
                    top: `${y}px`,
                }
            }, children);
        }
    }

    static handler(getItems) {
        return function (event) {
            event.preventDefault();
            menu.setState((state, props) => ({
                visible: true,
                children: [...state.children, ...getItems()],
                x: event.pageX,
                y: event.pageY,
            }));
        };
    }
}
const menu = ReactDOM.render(e(Menu), document.getElementById("context-menu"));

// Close menu on any mouse click or ESC key press
document.addEventListener("keyup", (event) => {
    if (event.key === "Escape") {
        menu.hide();
    }
}, true);
document.addEventListener("mousedown", () => {
    menu.hide();
}, true);
//menu.addEventListener("mousedown", showMenu, true);


/*
 * Dragging API
 * ------------
 *
 * For making something draggable, create a `Drag` object and enable it.
 * Its constructor takes a callback object, a DOM node and a mouse button:
 *     The callback object needs to provide three methods:
 *       `dragStart`, `dragMove`, `dragEnd`
 *
 *     The DOM node is the target for starting the drag.
 *     So the mouse button has to be pressed while the mouse is above this node.
 *     It defaults to the callback object.
 *
 *     The mouse button is specified as an integer.
 *     See constants at beginning of module.
 *     It defaults to the left mouse button.
 * The `Drag` object provides an `enable` and a `disable` method and starts disabled after construction.
 *
 * If you need more control over starting and stopping your dragging,
 * you could use `startDrag` and `endDrag`, however this is discouraged.
 * It takes your callback object and the mouse button.
 */
let dragged_for_button = {};
document.addEventListener("mousemove", (event) => {
    const pressed_buttons = buttons(event);
    for (let button in dragged_for_button) {
        if (pressed_buttons[button] && dragged_for_button[button]) {
            dragged_for_button[button].dragMove(event);
        }
    }
});
document.addEventListener("mouseup", (event) => {
    if (dragged_for_button[event.button]) {
        dragged_for_button[event.button].dragEnd(event);
        dragged_for_button[event.button] = null;
    }
});

export class Drag {
    constructor() {
        this.button2objects = new Map();

        const button2objects = this.button2objects;
        this.onMouseDown = function (event) {
            const objects = button2objects[event.button];
            if (objects && objects.length > 0) {
                if (startDrag(objects[0], event.button)) {
                    objects[0].dragStart(event);
                    event.stopPropagation();
                }
            }
        }
    }

    register(button, object) {
        // Add object to objects list
        if (!this.button2objects.has(button)) {
            this.button2objects[button] = [];
        }
        const objects = this.button2objects[button];
        objects.push(object);

        // Return toggle function
        let enabled = true;
        function toggleFunc() {
            if (!enabled) {
                objects.unshift(object);
            } else {
                const index = objects.indexOf(object);
                if (index !== -1) {
                    objects.splice(index, 1);
                }
            }
            enabled = !enabled;
            return toggleFunc;
        }
        return toggleFunc;
    }
}

export function startDrag(obj, button=LEFT_BUTTON) {
    if (dragged_for_button[button]) {
        console.error("You can't start dragging, because there is already something being dragged");
        return false;
    } else {
        dragged_for_button[button] = obj;
        return true
    }
}
export function endDrag(obj, button=LEFT_BUTTON) {
    if (dragged_for_button[button] === obj) {
        dragged_for_button[button].dragEnd(null);
        dragged_for_button[button] = null;
    } else {
        console.error("The object isn't being dragged.");
    }
}
export function getDragged(button=LEFT_BUTTON) {
    return dragged_for_button[button];
}
