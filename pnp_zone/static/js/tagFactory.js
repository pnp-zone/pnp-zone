class TagFactory {

    createElement(tag, kwargs) {
        const elem = document.createElement(tag);
        for (let key in kwargs) {
            if (!kwargs.hasOwnProperty(key)) {
                continue;
            }
            let value = kwargs[key];

            switch (key) {
                case "class":
                    elem.className = value;
                    break;

                case "children":
                    for (let i = 0; i < value.length; i++) {
                        elem.appendChild(value[i]);
                    }
                    break;

                case "style":
                    if (typeof value === "string") {
                        const rows = value.split(/[,;] ?/);
                        for (let i = 0; i < rows.length; i++) {
                            const row = rows[i].trim().split(/: ?/);
                            const styleKey = row[0].trim();
                            const styleValue = row[1].trim();

                            elem.style[styleKey] = styleValue;
                        }
                    } else if (typeof value === "object") {
                        for (let styleKey in value) {
                            const styleValue = value[styleKey];

                            elem.style[styleKey] = styleValue;
                        }
                    } else {
                        throw TypeError("style must be a string or object");
                    }
                    break;

                default:
                    elem[key] = value;
            }
        }
        return elem;
    }

    forTag(tag) {
        const createElement = this.createElement.bind(this);
        return function(kwargs) {
            return createElement(tag, kwargs);
        };
    }
}

// Syntactic sugar
const tags = new Proxy(new TagFactory(), {
    get(target, prop) {
        return target.forTag(prop);
    }
});

export default tags;