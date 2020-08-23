type handler_fn = (...args: any[]) => void;

export class EventDelegate {
	private handlers: handler_fn[]
	private isLocked: boolean = false;
	private removeQueue: handler_fn[];

	/**
	 * Creates a new EventDelegate object.
	 *
	 * @public
	 * @constructor
	 * @class A delegate class for easily managing custom event handling.
	 * @returns {EventDelegate} Returns a new EventDelegate.
	 */
	constructor() {
		this.handlers = [];
		this.removeQueue = [];
	}


	/**
	 * Adds an event handler to this EventDelegate
	 *
	 * @public
	 * @param {function([Object])} handler
	 */
	add(handler: handler_fn): this {
		this.handlers.push(handler);
		return this;
	}

	/**
	 * Dispatches this EventDelegate, calling all the event handlers that have been
	 * previously added to this EventDelegate.
	 *
	 * @public
	 */
	dispatch(...args: any[]): this {
		this.isLocked = true;
		for (let handler of this.handlers) {
			handler.apply(undefined, args);
		}
		this.isLocked = false;

		// remove any handlers in the remove queue
		for (let i = 0; i < this.removeQueue.length; i++) {
			let index = this.handlers.indexOf(this.removeQueue[i]);
			if (index >= 0)
				this.handlers.splice(index, 1);
		}
		this.removeQueue = [];

		return this;
	}

	/**
	 * Removes an event handler from this EventDelegate.
	 *
	 * @public
	 * @param {function([object])} handler
	 */
	remove(handler: handler_fn): this {
		if (this.isLocked) {
			this.removeQueue.push(handler);
		} else {
			let index = this.handlers.indexOf(handler);
			if (index >= 0)
				this.handlers.splice(index, 1);
		}

		return this;
	}
};
