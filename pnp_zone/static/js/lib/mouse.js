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
