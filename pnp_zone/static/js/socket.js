class Socket {
    constructor() {
        this.open();
        this.event_handlers = new Map();
    }

    open() {
        this.socket = new WebSocket(this.get_endpoint());

        this.socket.onopen = (event) => {
        };

        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (this.event_handlers.has(message.type)) {
                this.event_handlers.get(message.type)(message);
            } else {
                console.error("Unknown message type:", message.type);
            }
        };

        this.socket.onerror = (event) => {
            console.error(event);
        };

        this.socket.onclose = (event) => {
            setTimeout(this.open, 1000);
        };
    }

    register_event(type, handler) {
        this.event_handlers.set(type, handler);
    }

    send(obj) {
        this.socket.send(JSON.stringify(obj))
    }

    get_endpoint() {
        const url = window.location;
        return "ws://" + url.host + url.pathname;
    }
}