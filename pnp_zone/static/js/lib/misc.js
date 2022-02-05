import React, {e} from "../react.js";

export function TableRow(props) {
    const {children, ...restProps} = props;
    return e("tr", {...restProps}, children.map((element) => e("td", {key: element.key}, [element])));
}
