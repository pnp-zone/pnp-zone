import createEditableStyle from "./lib/style.js";


export function getNumericStyle(node, property, unit="px") {
    return parseFloat(node.style[property].replace(unit, ""));
}

export function setNumericStyle(node, property, value, unit="px") {
    node.style[property] = "" + value + unit;
}

export class BoardElement extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: "open"});

        this.hiddenStyle = createEditableStyle();
        this.hiddenStyle.setSelector(":host");
        this.shadowRoot.appendChild(this.hiddenStyle);
    }
}