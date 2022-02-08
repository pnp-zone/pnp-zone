import React, {e} from "../react.js";

export function TableRow(props) {
    const {children, colspans, ...restProps} = props;
    return e("tr", {...restProps}, children.map((element, i) =>
        e("td", {key: element.key, colspan: colspans[i]}, [element]))
    );
}
TableRow.defaultProps = {
    children: [],
    colspans: {},
};
