import React from "../react.js";
const e = React.createElement;

function Tab(props) {
    const {children, open, isOpen} = props;
    return e("div", {
        className: isOpen ? "active-tab tab" : "tab",
        onClick: open,
    }, children);
}

function Page(props) {
    const {isOpen, children} = props;
    return e("div", {
        style: {
            display: isOpen ? "" : "none",
            backgroundColor: "#16232d",
            height: "100vh",
        },
    }, children);
}

export class TabList extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            open: -1,
            width: "30vw",
        };
    }

    render() {
        const {children} = this.props;
        const {open, width} = this.state;
        return e("div", {
            className: "flex-horizontal",
            style: {
                position: "fixed",
                left: 0,
            }
        }, [
            e("div", {
                key: "pages",
                className: "flex-vertical",
                style: {
                    width: open !== -1 ? width : "",
                },
            }, children.map(
                ([tab, content], index) => e(Page, {
                    isOpen: open === index
                }, content),
            )),
            e("div", {
                key: "tabs",
                className: "flex-vertical",
            }, children.map(
                ([tab, content], index) => e(Tab, {
                    isOpen: open === index,
                    open: function () {this.setState({open: open === index ? -1 : index})}.bind(this)
                }, tab)
            )),
        ]);
    }
}