import React from "../../react.js";
const e = React.createElement;

export default function CheckBox(props) {
    const {value, setValue, ...otherProps} = props;

    return e("input", {
        type: "checkbox",
        checked: value,
        onChange: (event) => {setValue(event.target.checked);},
        ...otherProps,
    });
}

export function StatefulCheckBox(props) {
    const [value, setValue] = React.useState(false);

    return e(CheckBox, {
        value, setValue
    });
}