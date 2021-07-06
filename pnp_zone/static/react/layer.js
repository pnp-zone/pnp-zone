import React from "https://cdn.skypack.dev/react";
const e = React.createElement;

export default class Layer extends React.Component {
    render() {
        const {childrenData, childrenComponent, id} = this.props;

        const children = [];
        for (const key in childrenData) {
            if (childrenData.hasOwnProperty(key)) {
                children.push(e(childrenComponent, {key: key, ...childrenData[key]}));
            }
        }

        return e("div", {id}, children);
    }
}
