/*
 This class wraps the addEventListener function to allow easy toggling of an event listener.

 If you just want to add an event listener without the possibility to disable it, use:
    `new EventListener(obj, event, function).enable();`
 */
export class EventListener {
    constructor(target, event, handler, capturing=false) {
        this.target = target;
        this.event = event;
        this.handler = handler;

        this.active = false;
        this.outer_handler = (event) => {
            if (this.active) {
                return this.handler(event);
            }
        };
        this.outer_handler = this.outer_handler.bind(this);

        this.target.addEventListener(this.event, this.outer_handler, capturing);
    }

    enable() {
        this.active = true;
        return this;
    }

    disable() {
        this.active = false;
        return this;
    }
}

/*
 Group EventListener together using this array and toggle them all with one command.
 */
export class EventGroup extends Array {
    enable() {
        for (let i = 0; i < this.length; i++) {
            this[i].enable();
        }
    }
    disable() {
        for (let i = 0; i < this.length; i++) {
            this[i].disable();
        }
    }
}