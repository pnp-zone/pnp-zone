import React from "./react.js";
import ReactDOM from "./react-dom.js";

const e = React.createElement;


const modalsDiv = document.getElementById("modals");
export class BaseModal extends React.Component {
    constructor(props) {
        super(props);
        this.root = document.createElement("div");
    }

    componentDidMount() {
        modalsDiv.appendChild(this.root);
    }

    componentWillUnmount() {
        modalsDiv.removeChild(this.root);
    }

    render() {
        return ReactDOM.createPortal(this.props.children, this.root);
    }
}

export default function Modal(props) {
    const {hideModal, children} = props;

    return e(BaseModal, {}, [
        e("div", {
            className: "background",
            onClick: hideModal,
        }, [
            e("div", {
                className: "modal",
                onClick(event) {event.stopPropagation();},
            }, [
                e("div", {key: "modalCloseButton", className: "close"}, [
                    e("button", {
                        onClick: hideModal,
                    }, [
                        e("img", {src: "/static/img/close.svg", alt: "Close"}),
                    ]),
                ]),
                ...children,
            ]),
        ]),
    ])
}
