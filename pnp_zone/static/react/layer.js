import React from "https://cdn.skypack.dev/react";
const e = React.createElement;

export default class Layer extends React.Component {
    render() {
        const {childrenData, childrenComponent, id, commonProps, filter} = this.props;

        const children = [];
        for (const key in childrenData) {
            if (childrenData.hasOwnProperty(key)) {
                const child = childrenData[key];
                if (!filter || filter(child)) {
                    children.push(e(childrenComponent, {key: key, ...commonProps, ...childrenData[key]}));
                }
            }
        }

        return e("div", {id}, children);
    }
}
