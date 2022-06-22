export class Event<Fn extends Function> {
	private handlers: Fn[]

	/**
	 * Creates a new EventDelegate object.
	 *
	 * @public
	 * @constructor
	 * @class A delegate class for easily managing custom event handling.
	 * @returns {Event} Returns a new EventDelegate.
	 */
	constructor() {
		this.handlers = [];
	}


	/**
	 * Adds an event handler to this EventDelegate
	 *
	 * @public
	 * @param {function([Object])} handler
	 */
	register(handler: Fn): this {
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
		for (let handler of this.handlers) {
			handler.apply(undefined, args);
		}

		return this;
	}

	/**
	 * Removes an event handler from this EventDelegate.
	 *
	 * @public
	 * @param {function([object])} handler
	 */
	unregister(handler: Fn): this {
		let index = this.handlers.indexOf(handler);
		if (index >= 0)
			this.handlers.splice(index, 1);

		return this;
	}
};
