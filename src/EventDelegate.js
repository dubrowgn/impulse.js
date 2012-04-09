Impulse.EventDelegate = (function() {
	/**
	 * Creates a new EventDelegate object.
	 * @class A delegate class for easily managing custom event handling.
	 *
	 * @public
	 * @sign {EventDelegate} EventDelegate()
	 * @returns {EventDelegate} Returns a new EventDelegate.
	 */
	var EventDelegate = function() {
		this._handlers = new Array();
		this._removeQueue = new Array();
	}; // class EventDelegate

	EventDelegate.prototype._handlers = undefined;
	EventDelegate.prototype._isLocked = false;
	EventDelegate.prototype._removeQueue = undefined;

	/**
	 * Adds an event handler to this EventDelegate.
	 *
	 * @public
	 * @sign {undefined} add()
	 * @param {Function} handler
	 */
	EventDelegate.prototype.add = function(handler) {
		this._handlers.push(handler);
	}; // add( )

	/**
	 * Dispatches this EventDelegate, calling all the event handlers that have been previously added to this
	 * EventDelegate.
	 *
	 * @public
	 * @sign {undefined} dispatch()
	 */
	EventDelegate.prototype.dispatch = function() {
		this._isLocked = true;
		for (var i = 0; i < this._handlers.length; i++) {
			this._handlers[i].apply(undefined, arguments);
		} // for( i )
		this._isLocked = false;

		// remove any handlers in the remove queue
		for (var i = 0; i < this._removeQueue.length; i++) {
			var index = this._handlers.indexOf(this._removeQueue[i]);
			if (index >= 0)
				this._handlers.splice(index, 1);
		} // for( i )
		this._removeQueue = new Array();
	}; // dispatch( )

	/**
	 * Removes an event handler from this EventDelegate.
	 * @sign {undefined} remove()
	 * @param handler
	 */
	EventDelegate.prototype.remove = function(handler) {
		if (this._isLocked)
			this._removeQueue.push(handler);
		else {
			var index = this._handlers.indexOf(handler);
			if (index >= 0)
				this._handlers.splice(index, 1);
		} // else
	}; // remove( )

	return EventDelegate;
});