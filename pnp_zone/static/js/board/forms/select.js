import React from "../../react.js";
const e = React.createElement;

export default function Select({options, value, setValue, ...restProps}) {
    return e("select", {
        onChange(event) {
            setValue(event.target.value);
        },
        ...restProps,
    }, Object.entries(options).map(
        ([id, name]) => e("option", {selected: id === value, value: id}, name)
    ));
}
Select.defaultProps = {
    options: {
        id: "name",
    },
    selected: "",
};
