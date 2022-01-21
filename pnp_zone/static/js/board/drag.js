import {buttons, LEFT_BUTTON, MIDDLE_BUTTON, RIGHT_BUTTON} from "../lib/mouse.js";
import React from "../react.js";
const e = React.createElement;

const DragTarget = React.createContext();
export default DragTarget;

export class DragController extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            [LEFT_BUTTON]: [],
            [MIDDLE_BUTTON]: [],
            [RIGHT_BUTTON]: [],
        }
    }

    render() {
        const {children} = this.props;
        const addHandler = function (handler, button=LEFT_BUTTON) {
            this.setState((state) => ({[button]: [handler, ...state[button]]}));
        }.bind(this);
        const removeHandler = function (handler, button=LEFT_BUTTON) {
            this.setState((state) => ({[button]: state[button].filter((item) => item !== handler)}));
        }.bind(this);
        const onMouseDown = function (event) {
            const handlers = this.state[event.button];
            if (handlers.length > 0) {
                handlers[0](event);
            }
        }.bind(this);

        return e(DragTarget.Provider, {
            value: {
                addHandler,
                removeHandler,
                onMouseDown,
            },
        }, ...children);
    }
}

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
    // While holding a mouse button, the browser will fire events even if the cursor is outside the browser window.
    // Because these events happen outside the rendered html, the target is always the toplevel document object.
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
