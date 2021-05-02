import tags from "./tagFactory.js";
import createEditableStyle from "./style.js";

class ModalController extends HTMLElement {
    static stylesheet = "/static/css/lib/modal.css";

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

        this.hiddenStyle.addEntry("display", "none");
        this.shadowRoot.appendChild(tags.div({
            class: "background",
            onclick: this.hide.bind(this),
            children: [
                tags.div({
                    class: "modal",
                    onclick: (event) => { event.stopPropagation(); },
                    children: [
                        tags.div({
                            class: "close",
                            children: [
                                tags.button({
                                    type: "button",
                                    onclick: this.hide.bind(this),
                                    children: [
                                        tags.img({
                                            src: "/static/img/close.svg",
                                            alt: "Close",
                                        })
                                    ],
                                })
                            ]
                        }),
                        tags.slot({
                            name: "active"
                        })
                    ],
                })
            ]
        }));
        this.activeChild = null;
    }

    show(query) {
        let child;
        if (Number.isInteger(query)) {
            child = this.children[query];
        } else if (typeof query === "string") {
            child = this.querySelector(query);
        }

        if (!child) {
            console.error("No matching child");
            return;
        }

        if (this.activeChild !== null) {
            this.activeChild.removeAttribute("slot", "active");
        }
        child.setAttribute("slot", "active");
        this.activeChild = child;
        this.hiddenStyle.display = "auto";
    }

    hide() {
        this.hiddenStyle.display = "none";
    }
}

window.customElements.define("modal-controller", ModalController);
