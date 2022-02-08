import React, {e} from "../../react.js";
import {LEFT_BUTTON} from "../../lib/mouse.js";
import {Drag} from "../drag.js";


const KEY = Symbol("pnp-zone.key");
export class SortableList extends React.Component {
    constructor(props) {
        super(props);

        // Reference to SortableList used inside dragObject
        const list = this;
        this.drag = new Drag();
        this.drag.register(LEFT_BUTTON, {
            startX: 0,
            startY: 0,
            key: null,
            currentIndex: null,
            dragStart(event) {
                this.startX = event.clientX;
                this.startY = event.clientY;
                this.key = event[KEY];
            },
            dragMove(event) {
                const dx = event.clientX - this.startX;
                let dy = event.clientY - this.startY;

                const {children} = list.props.domParent.current;
                const index = list.key2index[this.key];
                const dragged = children[index];
                dragged.style.transform = `translate(${dx}px, ${dy}px)`;

                const sign = dy / Math.abs(dy);
                dy = Math.abs(dy);
                let i = index;
                while (dy > 0) {
                    i += sign;
                    const next = children[i];
                    if (!next)
                        break;
                    if (dy > next.offsetHeight) {
                        if (!next.style.transform)
                            next.style.transform = `translate(0px, ${-sign*dragged.offsetHeight}px)`;
                    } else if (next.style.transform) {
                        next.style.transform = "";
                    }
                    dy -= next.offsetHeight;
                }
                this.currentIndex = i - sign;
            },
            dragEnd(event) {
                this.dragMove(event); // run dragMove once more to update this.currentIndex

                // Reset all transform
                const {children} = list.props.domParent.current;
                for (let i = 0; i < children.length; i++)
                    children[i].style.transform = "";

                const {setKeyList, setIndex} = list.props;
                if (setKeyList) {
                    const keyList = Object.values(list.props.children).map(({key}) => key);

                    // Delete this.key from keyList
                    keyList.splice(keyList.indexOf(this.key), 1);
                    // Insert this.key at this.currentIndex
                    keyList.splice(this.currentIndex, 0, this.key);

                    setKeyList(keyList);
                }
                if (setIndex) {
                    setIndex(this.key, this.currentIndex);
                }
            },
        });
        const {onMouseDown} = this.drag;
        this.drag.onMouseDown = function(key, event) {
            event[KEY] = key;
            onMouseDown(event);
        }

        this.firstChild = null;
        this.setFirstChild = function (obj) {
            console.log(obj);
            if (obj) this.firstChild = obj;
        }.bind(this);

        this.key2index = {};
    }

    render() {
        const {children} = this.props;

        // inject the onMouseDown required for dragging
        for (const child of children) {
            const {onMouseDown} = child.props;
            const injectedOnMouseDown = this.drag.onMouseDown.bind(null, child.key);
            if (onMouseDown) {
                child.props.onMouseDown = function (event) {
                    injectedOnMouseDown(event);
                    onMouseDown(event);
                };
            } else {
                child.props.onMouseDown = injectedOnMouseDown;
            }
        }

        this.key2index = Object.fromEntries(
            Object.entries(children)
                .map(([i, child]) => [child.key, parseInt(i)])
        );

        return e(React.Fragment, {}, children);
    }
}
SortableList.defaultProps = {
    children: [],
    domParent: React.createRef(),
};