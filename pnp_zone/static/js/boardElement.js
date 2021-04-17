export function getNumericStyle(node, property, unit="px") {
    return parseFloat(node.style[property].replace(unit, ""));
}

export function setNumericStyle(node, property, value, unit="px") {
    node.style[property] = "" + value + unit;
}

export class NodeWrapper {

    static unit = "px"
    static nodeName = "node"

    get x() { return this._getNumericStyle("left") }
    get y() { return this._getNumericStyle("top") }
    set x(value) { this._setNumericStyle("left", value) }
    set y(value) { this._setNumericStyle("top", value) }

    _getNumericStyle(property) {
        return getNumericStyle(this[this.constructor.nodeName], property, this.constructor.unit);
    }
    _setNumericStyle(property, value) {
        setNumericStyle(this[this.constructor.nodeName], property, value, this.constructor.unit);
    }
}