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
        onChange(event) {
            let newValue = event.target.value;
            if (newValue.length > maxLength) newValue = newValue.substr(0, maxLength);
            setValue(newValue);
        },
        ref: callback,
        ...otherProps,
    });
}
TextInput.defaultProps = {
    value: "",
    setValue(value) {},
    autoFocus: false,
    maxLength: Infinity,
};

/**
 *  A lazy TextInput behaves like a TextInput with two changes:
 *  - setValue is only called when the user hits enter or leaves the input
 *  - the input's value is only set to props.value when it changes
 *
 *  The resulting behaviour is a TextInput who can perform conversions in setValue
 *  while still allowing the user to type uninterrupted.
 *
 *  Example of solved problem:
 *  ```
 *  const [n, setN] = React.useState(0);
 *  return e(TextInput, {value: n, setValue(value) {setN(parseFloat(value))}});
 *  ```
 *  This code would render an input whose value is always stored as internally as number instead of string.
 *  But now parseFloat is called after every character. So when trying to type something like `1e3`, the e couldn't be
 *  typed because the intermediate string `1e` would convert to `1`.
 *
 *  LazyInput solves this by only calling setValue, when the user is expected to have finished typing.
 */
export function LazyInput(props) {
    const {value, setValue, ...otherProps} = props;
    const [v, setV] = React.useState(value);
    React.useEffect(() => {
        setV(value);
    }, [value]);
    return e("form", {
        onSubmit(event) {
            event.preventDefault();
            setValue(v);
        },
    }, [
        e(TextInput, {
            value: v,
            setValue: setV,
            onBlur() {
                setValue(v);
            },
            ...otherProps,
        }),
    ]);
}
