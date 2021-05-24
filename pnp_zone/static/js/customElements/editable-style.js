class EditableStyle extends HTMLStyleElement {
    constructor() {
        super();
        this.textContent = "{}";
    }

    setSelector(cssSelector) {
        let css = this.textContent;
        css = css.replace(/.*({.+)/, cssSelector + "$1");
        this.textContent = css;
    }

    addEntry(prop, value) {
        let css = this.textContent;
        css = css.replace(/(.+)}/, "$1"+prop+":"+value+";}");
        this.textContent = css;

        Object.defineProperty(this, prop, {
            get: function () {
                return this.textContent.match(new RegExp(prop+":([^;]*);"))[1];
            },
            set: function (value) {
                this.textContent = this.textContent.replace(new RegExp(prop+":[^;]*;"), prop+":"+value+";");
            },
        });
    }
}

window.customElements.define("editable-style", EditableStyle, {extends: "style"});

export default function() {
    return document.createElement("style", {is: "editable-style"});
}
