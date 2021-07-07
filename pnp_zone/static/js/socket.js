class Socket {
    constructor() {
        this.event_handlers = new Map();
    }

    open() {
        this.socket = new WebSocket(this.getEndpoint());

        this.socket.onopen = () => {
        };

        this.socket.onmessage = (event) => {
            const {type, ...message} = JSON.parse(event.data);
            if (this.event_handlers.has(type)) {
                this.event_handlers.get(type)(message);
            } else {
                console.error("Unknown message type:", type);
            }
        };

        this.socket.onerror = (event) => {
            console.error(event);
        };

        this.socket.onclose = () => {
            setTimeout(this.open.bind(this), 1000);
        };
    }

    registerEvent(type, handler) {
        this.event_handlers.set(type, handler);
    }

    send(obj) {
        this.socket.send(JSON.stringify(obj))
    }

    getEndpoint() {
        const url = window.location;
        return url.protocol.replace("http", "ws") + "//" + url.host + url.pathname;
    }
}

const socket = new Socket();
export default socket;