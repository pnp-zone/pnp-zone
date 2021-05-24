import createEditableStyle from "./customElements/editable-style.js";
import tags from "./lib/tagFactory.js";


export function getNumericStyle(node, property, unit="px") {
    return parseFloat(node.style[property].replace(unit, ""));
}

export function setNumericStyle(node, property, value, unit="px") {
    node.style[property] = "" + value + unit;
}

export class BoardElement extends HTMLElement {
    static stylesheet = "";

    constructor() {
        super();
        this.attachShadow({mode: "open"});

        if (this.constructor.stylesheet !== "") {
            this.shadowRoot.appendChild(tags.link({
                rel: "stylesheet",
                href: this.constructor.stylesheet,
            }));
        }

        this.hiddenStyle = createEditableStyle();
        this.hiddenStyle.setSelector(":host");
        this.shadowRoot.appendChild(this.hiddenStyle);
    }
}