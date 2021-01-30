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
                    const rows = value.split(",");
                    for (let i = 0; i < rows.length; i++) {
                        let row = rows[i].trim().split(":");
                        elem.style[row[0].trim()] = row[1].trim();
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
