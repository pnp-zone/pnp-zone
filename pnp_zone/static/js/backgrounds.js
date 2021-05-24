import tags from "./lib/tagFactory.js";
import {registerContextMenu} from "./lib/mouse.js";
import socket from "./socket.js";
import "./customElements/hitbox-hitbox.js";

const CONTAINER = document.getElementById("backgrounds");
const HITBOXES = document.getElementById("backgroundHitboxes");

const is_moderator = document.getElementById("moderator") !== null;

const backgrounds = {};

// Add submit action to add background form
const addBackground = document.forms["addBackground"];
if (addBackground) {
    addBackground.onsubmit = () => {
        socket.send({type: "background.new",
            url: addBackground["url"].value,
        });
        return false;
    }
}

function getNumericStyle(node, property, unit="px") {
    return parseFloat(node.style[property].replace(unit, ""));
}

function setNumericStyle(node, property, value, unit="px") {
    node.style[property] = "" + value + unit;
}

export function updateBackground(event) {
    const { id, url, x, y, width, height } = event;

    let background = backgrounds[id];
    if (!background) {
        background = document.createElement("img", {is: "background-image"});
        background.id = id;
        background.src = url;
        CONTAINER.appendChild(background);
        backgrounds[id] = background;
    }

    background.src = url;
    background.x = x;
    background.y = y;
    background.width = width;
    background.height = height;
}
export function deleteBackground(event) {
    const { id } = event;

    let background = backgrounds[id];
    if (is_moderator) {
        background.hitbox.remove();
    }
    background.remove();
    delete backgrounds[id];
}

class Background extends HTMLImageElement {
    static observedAttributes = ["x", "y", "width", "height"];

    constructor() {
        super();
        if (is_moderator) {
            this.hitbox = document.createElement("hitbox-hitbox");
            HITBOXES.appendChild(this.hitbox);

            // Receive size changes
            this.hitbox.owner = this;

            // Send new size over socket
            this.hitbox.sizeChangedCallback = function() {
                socket.send({type: "background.move", id: this.id, url: this.url,
                    x: this.x, y: this.y, width: this.width, height: this.height});
            }.bind(this);
        }
        this.style.left = "0px";
        this.style.right = "0px";
        this.classList.add("board-element");
    }

    connectedCallback() {
        if (is_moderator) {
            registerContextMenu(this.hitbox, () => {
                return [
                    tags.button({
                        onclick: (event) => {
                            socket.send({type: "background.delete", id: this.id});
                        },
                        innerText: "Delete background"
                    }),
                ];
            }).enable();
        }
    }

    attributeChangedCallback(attr, oldValue, newValue) {
        switch (attr) {
            case "width":
                if (newValue === "0") {
                    newValue = this.naturalWidth;
                    this.width = this.naturalWidth;
                }
                if (is_moderator) {
                    this.hitbox.width = parseInt(newValue);
                }
                break;
            case "height":
                if (newValue === "0") {
                    newValue = this.naturalHeight;
                    this.height = this.naturalHeight;
                }
                if (is_moderator) {
                    this.hitbox.height = parseInt(newValue);
                }
                break;
            case "x":
                setNumericStyle(this, "left", newValue, "px");
                if (is_moderator) {
                    this.hitbox.x = newValue;
                }
                break;
            case "y":
                setNumericStyle(this, "top", newValue, "px");
                if (is_moderator) {
                    this.hitbox.y = newValue;
                }
                break;
        }
    }

    get x() { return parseInt(this.getAttribute("x")); }
    get y() { return parseInt(this.getAttribute("y")); }
    set x(value) { this.setAttribute("x", value); }
    set y(value) { this.setAttribute("y", value); }
}

window.customElements.define("background-image", Background, {extends: "img"});
