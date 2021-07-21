import React from "../react.js";
import Hexagon from "./hexagon.js";
const e = React.createElement;

export class ShapedDiv extends React.Component {

    constructor(props) {
        super(props);
        this.eventHandler = this.eventHandler.bind(this);
        this.moveHandler = this.moveHandler.bind(this);
        this.outHandler = this.outHandler.bind(this);
        this.overHandler = this.overHandler.bind(this);
        this.enterHandler = this.enterHandler.bind(this);
        this.leaveHandler = this.leaveHandler.bind(this);
        this.hovered = false;
        this.leaving = false;
    }

    inShape(event) {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX;
        const y = event.clientY;
        return this.props.shape(x, y, rect);
    }

    redispatch(event) {
        // Kill old event
        event.preventDefault();
        event.stopPropagation();

        // Dispatch new event on element below
        const elems = document.elementsFromPoint(event.clientX, event.clientY);
        for (let i = 0; i < elems.length; i++) {
            if (elems[i] === event.currentTarget && i + 1 < elems.length) {
                const oldEvent = event.nativeEvent;
                const newEvent = new MouseEvent(oldEvent.type, oldEvent);
                elems[i+1].dispatchEvent(newEvent);
            }
        }
    }

    eventHandler(event) {
        if (!this.inShape(event)) {
            this.redispatch(event)
        }
    }

    moveHandler(event) {
        const inShape = this.inShape(event)
        if (this.hovered && !inShape) {
            this.hovered = false;
            this.leaving = true;
            const oldEvent = event.nativeEvent;
            const newEvent = new MouseEvent("mouseout", oldEvent);
            event.currentTarget.dispatchEvent(newEvent);
        } else if (inShape && !this.hovered) {
            this.hovered = true;
            const oldEvent = event.nativeEvent;
            const newEvent = new MouseEvent("mouseover", oldEvent);
            event.currentTarget.dispatchEvent(newEvent);
        }
        if (!inShape) {
            this.redispatch(event);
        }
    }

    overHandler(event) {
        const inShape = this.inShape(event);
        if (inShape && !this.hovered) {
            this.hovered = true;
        }
        if (!inShape) {
            this.redispatch(event);
        }
    }

    outHandler(event) {
        const inShape = this.inShape(event)
        if (this.hovered && !inShape) {
            this.hovered = false;
            this.leaving = true;
        }
    }

    enterHandler(event) {
        const inShape = this.inShape(event)
        if (!inShape) {
            event.preventDefault();
            event.stopPropagation();
        } else {
            const {onMouseEnter} = this.props;
            if (onMouseEnter) {
                onMouseEnter(event);
            }
        }
    }

    leaveHandler(event) {
        if (!this.leaving) {
            event.preventDefault();
            event.stopPropagation();
        } else {
            this.leaving = false;
            const {onMouseLeave} = this.props;
            if (onMouseLeave) {
                onMouseLeave(event);
            }
        }
    }

    render() {
        const {shape, children, ...rest} = this.props;

        return e("div", {
            // every non drag related mouse event
            onClickCapture: this.eventHandler,
            onContextMenuCapture: this.eventHandler,
            onDoubleClickCapture: this.eventHandler,
            onMouseDownCapture: this.eventHandler,
            onMouseUpCapture: this.eventHandler,
            onMouseMoveCapture: this.moveHandler,
            onMouseOutCapture: this.outHandler,
            onMouseOverCapture: this.overHandler,
            ...rest,
            onMouseEnter: this.enterHandler,
            onMouseLeave: this.leaveHandler,
        }, children);
    }
}

export function HexagonDiv(props) {
    const {width, children, ...rest} = props;

    const shape = React.useMemo(() => {
        if (width) {
            const hexagon = new Hexagon(width);
            return function (x, y, rect) {
                const nx = x - rect.x - rect.width/2;
                const ny = y - rect.y - rect.height/2;
                return hexagon.contains(nx, ny);
            };
        } else {
            return function (x, y, rect) {
                const nx = x - rect.x - rect.width/2;
                const ny = y - rect.y - rect.height/2;
                return new Hexagon(rect.width).contains(nx, ny);
            };
        }
    }, [width]);

    return e(ShapedDiv, {
        shape,
        ...rest,
    }, children);
}
