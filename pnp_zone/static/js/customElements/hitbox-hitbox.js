import {Drag} from "../lib/mouse.js";
import tags from "../lib/tagFactory.js";
import {BoardElement} from "../boardElement.js";


class ResizingBobble extends BoardElement {
    static observedAttributes = ["pos"];
    static size = 16;
    static stylesheet = "/static/css/lib/hitbox.css";

    _prevX;
    _prevY;

    constructor() {
        super();
        this.hiddenStyle.addEntry("left","50%");
        this.hiddenStyle.addEntry("top","50%");
        this.hiddenStyle.addEntry("right","auto");
        this.hiddenStyle.addEntry("bottom","auto");
        this.hiddenStyle.addEntry("cursor", "auto");

        this.shadowRoot.appendChild(tags.div({
            class: "bobble",
        }));
    }

    connectedCallback() {
        this.parent = this.getRootNode().host;
        new Drag(this).enable();
    }

    attributeChangedCallback(attr, oldValue, newValue) {
        switch (attr) {
            case "pos":
                const pos = newValue;

                // Simple input checking
                if ((pos.length !== 1) && (pos.length !== 2)) {
                    break;
                }

                let ns = pos.match(/[NS]/);
                if (ns !== null) {
                    ns = ns[0];
                } else {
                    ns = "";
                }
                this.ns = ns;

                let we = pos.match(/[WE]/);
                if (we !== null) {
                    we = we[0];
                } else {
                    we = "";
                }
                this.we = we;

                // position
                if (ns === "N") {
                    this.hiddenStyle.top = "-0.025vw";
                }
                if (ns === "S") {
                    this.hiddenStyle.top = "auto";
                    this.hiddenStyle.bottom = "-0.025vw";
                }
                if (we === "W") {
                    this.hiddenStyle.left = "-0.025vw";
                }
                if (we === "E") {
                    this.hiddenStyle.left = "auto";
                    this.hiddenStyle.right = "-0.025vw";
                }

                if (pos.length === 1) {
                    switch (pos) {
                        case "N":
                        case "S":
                            this.hiddenStyle.cursor = "ns-resize";
                            break;
                        case "W":
                        case "E":
                            this.hiddenStyle.cursor = "ew-resize";
                            break;
                    }
                } else {
                    switch (ns + we) {
                        case "NW":
                        case "SE":
                            this.hiddenStyle.cursor = "nwse-resize";
                            break;
                        case "NE":
                        case "SW":
                            this.hiddenStyle.cursor = "nesw-resize";
                            break;
                    }
                }

                break;
        }
    }

    dragStart(event) {
        this._prevX = event.boardX;
        this._prevY = event.boardY;
    }

    dragMove(event) {
        const dx = event.boardX - this._prevX;
        const dy = event.boardY - this._prevY;
        this._prevX = event.boardX;
        this._prevY = event.boardY;

        if ((this.ns !== "") && (this.we !== "")) {
            // corner the drag started from
            const cornerX = this.parent.x + (this.we === "E" ? this.parent.width : 0);
            const cornerY = this.parent.y + (this.ns === "S" ? this.parent.height : 0);

            // slope of the diagonal through that corner
            let m;
            if (((this.ns === "N") && (this.we === "W")) || ((this.ns === "S") && (this.we === "E"))) {
                m = this.ratio;
            } else {
                m = -this.ratio;
            }

            // is the cursor above that diagonal
            const above = m * (event.boardX - cornerX) > event.boardY - cornerY;

            let height, width;
            if ((this.ns === "N" && !above) || (this.ns === "S" && above)) {
                width = this.we === "W" ? this.parent.width - dx : this.parent.width + dx;
                height = width * this.ratio;
            } else {
                height = this.ns === "N" ? this.parent.height - dy : this.parent.height + dy;
                width = height / this.ratio;
            }

            this.parent.resize(this.ns, this.ns === "N" ? this.parent.height - height : height - this.parent.height);
            this.parent.resize(this.we, this.we === "W" ? this.parent.width - width : width - this.parent.width);
        }
        else if (this.ns !== "") {
            this.parent.resize(this.ns, dy);
        } else {
            this.parent.resize(this.we, dx);
        }
    }

    dragEnd(event) {
        if (this.parent.sizeChangedCallback !== undefined) {
            this.parent.sizeChangedCallback();
        }
    }

    get ratio() {
        return this.parent.height / this.parent.width;
    }
}

class Hitbox extends BoardElement {
    static stylesheet = "/static/css/lib/hitbox.css";
    static observedAttributes = ["visible"];

    _prevX;
    _prevY;
    owner;

    constructor() {
        super();
        this.shadowRoot.appendChild(tags.div({
            class: "view-port",
            children: [tags.slot({})],
        }));

        this.shadowRoot.appendChild(tags.div({
            class: "frame",
            children: [
                tags.createElement("hitbox-bobble", {pos: "N"}),
                tags.createElement("hitbox-bobble", {pos: "NE"}),
                tags.createElement("hitbox-bobble", {pos: "E"}),
                tags.createElement("hitbox-bobble", {pos: "SE"}),
                tags.createElement("hitbox-bobble", {pos: "S"}),
                tags.createElement("hitbox-bobble", {pos: "SW"}),
                tags.createElement("hitbox-bobble", {pos: "W"}),
                tags.createElement("hitbox-bobble", {pos: "NW"}),
            ],
        }));

        this.hiddenStyle.addEntry("left", "auto");
        this.hiddenStyle.addEntry("top", "auto");
        this.hiddenStyle.addEntry("width", "auto");
        this.hiddenStyle.addEntry("height", "auto");
        this.hiddenStyle.addEntry("z-index", "0");
    }

    get x() { return parseFloat(this.hiddenStyle.left.replace("px", "")); }
    get y() { return parseFloat(this.hiddenStyle.top.replace("px", "")); }
    get width() { return parseFloat(this.hiddenStyle.width.replace("px", "")); }
    get height() { return parseFloat(this.hiddenStyle.height.replace("px", "")); }
    set x(value) { this.hiddenStyle.left = "" + value + "px"; }
    set y(value) { this.hiddenStyle.top = "" + value + "px"; }
    set width(value) { this.hiddenStyle.width = "" + value + "px"; }
    set height(value) { this.hiddenStyle.height = "" + value + "px"; }

    attributeChangedCallback(attr, oldValue, newValue) {
        if (newValue === "false") {
            this.shadowRoot.querySelector(".frame").style.display = "none";
            this.hiddenStyle["z-index"] = 0;
        } else if (oldValue === "false") {
            this.shadowRoot.querySelector(".frame").style.display = "";
            this.hiddenStyle["z-index"] = 999;
        }
    }

    connectedCallback() {
        this.x = this.offsetLeft;
        this.y = this.offsetTop;
        this.width = this.offsetWidth;
        this.height = this.offsetHeight;
        new Drag(this, this.shadowRoot.querySelector(".frame")).enable();
        this.shadowRoot.querySelector(".view-port").addEventListener("mousedown", () => {
            this.focus();
        });

        // Make focusable, hide by default and show no focus
        this.tabIndex = 0;
        this.setAttribute("visible", "false");
        this.addEventListener("focus", () => {
            this.setAttribute("visible", "true");
        });
        this.addEventListener("blur", () => {
            this.setAttribute("visible", "false");
        });

        if (this.children.length > 0) {
            this.owner = this.children[0];
            this.width = this.owner.offsetWidth;
            this.height = this.owner.offsetHeight;
            this.owner.addEventListener("focus", () => {
                this.setAttribute("visible", "true");
            });
            this.owner.addEventListener("blur", () => {
                this.setAttribute("visible", "false");
            });
        }
    }

    dragStart(event) {
        this._prevX = event.boardX;
        this._prevY = event.boardY;
    }

    dragMove(event) {
        this.x += event.boardX - this._prevX;
        this.y += event.boardY - this._prevY;
        if (this.owner) {
            this.owner.x += event.boardX - this._prevX;
            this.owner.y += event.boardY - this._prevY;
        }
        this._prevX = event.boardX;
        this._prevY = event.boardY;
    }

    dragEnd(event) {
        this.sizeChangedCallback();
    }

    sizeChangedCallback() {
        // To be overwritten
        console.debug("Size or Position changed:", {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
        });
    }

    resize(direction, amount) {
        switch (direction) {
            case "N":
                this.y += amount;
                this.height -= amount;
                break;
            case "S":
                this.height += amount;
                break;
            case "W":
                this.x += amount;
                this.width -= amount;
                break;
            case "E":
                this.width += amount;
                break;
        }
        if (this.owner) {
            switch (direction) {
                case "N":
                    this.owner.y += amount;
                    this.owner.height -= amount;
                    break;
                case "S":
                    this.owner.height += amount;
                    break;
                case "W":
                    this.owner.x += amount;
                    this.owner.width -= amount;
                    break;
                case "E":
                    this.owner.width += amount;
                    break;
            }
        }
    }
}

window.customElements.define("hitbox-bobble", ResizingBobble);
window.customElements.define("hitbox-hitbox", Hitbox);
