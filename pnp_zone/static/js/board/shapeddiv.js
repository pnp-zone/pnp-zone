import React from "../react.js";
import Hexagon from "./hexagon.js";
const e = React.createElement;

function mouseEventHandler(shape) {
    return function (event) {
        const div = event.currentTarget;
        const rect = div.getBoundingClientRect();
        const x = event.clientX;
        const y = event.clientY;
        if (!shape(x, y, rect)) {
            // Kill old event
            event.preventDefault();
            event.stopPropagation();

            // Dispatch new event on element below
            const elems = document.elementsFromPoint(x, y);
            for (let i = 0; i < elems.length; i++) {
                if (elems[i] === div && i + 1 < elems.length) {
                    const oldEvent = event.nativeEvent;
                    const newEvent = new MouseEvent(oldEvent.type, oldEvent);
                    elems[i+1].dispatchEvent(newEvent);
                }
            }
        }
    };
}

/*
 * A ShapedDiv is a div which uses a shape property to determine whether it was actually clicked on or not.
 *
 * A shape is a function which takes a x, y and a rect containing both and returns whether the x, y lie in the shape.
 */
export function ShapedDiv(props) {
    const {shape, children, ...rest} = props;
    const mouseHandler = React.useMemo(() => mouseEventHandler(shape), shape);

    return e("div", {
        onClickCapture: mouseHandler,
        ...rest,
    }, children);
}


export function HexagonDiv(props) {
    const {width, children, ...rest} = props;

    const shape = React.useMemo(() => {
        const hexagon = new Hexagon(width);
        return function (x, y, rect) {
            const nx = x - rect.x - rect.width/2;
            const ny = y - rect.y - rect.height/2;
            return hexagon.contains(nx, ny);
        };
    }, [width]);

    return e(ShapedDiv, {
        shape,
        ...rest,
    }, children);
}
