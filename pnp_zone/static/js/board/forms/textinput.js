import React from "../../react.js";
const e = React.createElement;

export default function TextInput(props) {
    const {value, setValue, autoFocus, ...otherProps} = props;
    const callback = React.useCallback((element) => {
        if (element && autoFocus) {
            setTimeout(function () {element.focus();}, 10);
        }
    }, []);

    return e("input", {
        value,
        onChange: (event) => {setValue(event.target.value);},
        ref: callback,
        ...otherProps,
    });
}

export function StatefulTextInput(props) {
    const [value, setValue] = React.useState("");

    return e(TextInput, {
        value, setValue,
    });
}
