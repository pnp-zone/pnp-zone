import { EventGroup, EventListener } from "./eventHandler.js";

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
const dragHandler = new EventGroup(
        new EventListener(document, "mousemove", (event) => {
            const pressed_buttons = buttons(event);
            for (let button in dragged_for_button) {
                if (pressed_buttons[button] && dragged_for_button[button]) {
                    dragged_for_button[button].dragMove(event);
                }
            }
        }),
        new EventListener(document, "mouseup", (event) => {
            if (dragged_for_button[event.button]) {
                dragged_for_button[event.button].dragEnd(event);
                dragged_for_button[event.button] = null;
            }
        }),
);
dragHandler.enable();

// Map from target (something an EventListener is added to) to tha actual EventListener
const targetHandler = new Map();
const targetMouseObjects = new Map();

export class Drag {
    constructor(object, target = null, button = LEFT_BUTTON) {
        if (!target) {
            target = object;
        }
        this.object = object;
        this.target = target;
        this.button = button;

        if (!targetHandler.has(target)) {
            targetHandler.set(target, new EventListener(target, "mousedown", (event) => {
                const mouseObjects = targetMouseObjects.get(target);
                if (mouseObjects.has(event.button)) {
                    const objects = mouseObjects.get(event.button);
                    if (objects.length > 0) {
                        if (startDrag(objects[0], event.button)) {
                            objects[0].dragStart(event);
                            event.stopPropagation();
                        }
                    }
                }
            }).enable());
        }

        if (!targetMouseObjects.has(target)) {
            targetMouseObjects.set(target, new Map());
        }
        const mouseObjects = targetMouseObjects.get(target);
        if (!mouseObjects.has(button)) {
            mouseObjects.set(button, []);
        }
    }

    disable() {
        const objects = targetMouseObjects.get(this.target).get(this.button);
        const index = objects.indexOf(this.object);
        if (index !== -1) {
            objects.splice(index, 1);
        }
    }

    enable() {
        targetMouseObjects.get(this.target).get(this.button).unshift(this.object);
    }
}

export function startDrag(obj, button=LEFT_BUTTON) {
    if (dragged_for_button[button]) {
        console.error("You can't start dragging, because there is already something being dragged");
        return false;
    } else {
        dragged_for_button[button] = obj;
        dragHandler.enable();
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
