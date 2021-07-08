import React from "https://cdn.skypack.dev/react";
const e = React.createElement;

export default function TextInput(props) {
    const {value, setValue, ...otherProps} = props;

    return e("input", {
        value,
        onChange: (event) => {setValue(event.target.value);},
        ...otherProps,
    });
}

export function StatefulTextInput(props) {
    const [value, setValue] = React.useState("");

    return e(TextInput, {
        value, setValue,
    });
}
