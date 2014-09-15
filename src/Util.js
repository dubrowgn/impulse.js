Impulse.Util = (function() {
	var Util = {};

	Util.Collection = (function() {
		var Collection = function() {
			this._arr = Array.prototype.slice.call(arguments);
		}; // class Collection

		Collection.prototype._arr = undefined;

		Collection.prototype.add = function(item) {
			this._arr.push(item);
		};

		Collection.prototype.at = function(index) {
			return this._arr[index];
		}; // at( )

		Collection.prototype.clear = function() {
			this._arr.splice(0, this._arr.length);
		}; // clear( )

		Collection.prototype.contains = function(item) {
			return this._arr.indexOf(item) >=0;
		}; // contains( )

		Collection.prototype.insert = function(index, item) {
			this._arr.splice(index, 0, item);
		}; // insert( )

		Collection.prototype.length = function() {
			return this._arr.length;
		}; // length( )

		Collection.prototype.remove = function(item) {
			var index = this._arr.indexOf(item);
			if (index >= 0)
				this._arr.splice(index, 1);
		}; // remove( )

		Collection.prototype.removeAt = function(index) {
			this._arr.splice(index, 1);
		}; // removeAt( )

		Collection.prototype.toString = function() {
			return this._arr.toString();
		}; // toString( )

		return Collection;
	})();

	Util.EventDelegate = (function() {
		/**
		 * Creates a new EventDelegate object.
		 *
		 * @public
		 * @constructor
		 * @class A delegate class for easily managing custom event handling.
		 * @returns {EventDelegate} Returns a new EventDelegate.
		 */
		var EventDelegate = function() {
			this._handlers = [];
			this._removeQueue = [];
		}; // class EventDelegate

		EventDelegate.prototype._handlers = undefined;
		EventDelegate.prototype._isLocked = false;
		EventDelegate.prototype._removeQueue = undefined;

		/**
		 * Adds an event handler to this EventDelegate
		 *
		 * @public
		 * @param {function([Object])} handler
		 */
		EventDelegate.prototype.add = function(handler) {
			this._handlers.push(handler);
		}; // add( )

		/**
		 * Dispatches this EventDelegate, calling all the event handlers that have been previously added to this
		 * EventDelegate.
		 *
		 * @public
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
			this._removeQueue = [];
		}; // dispatch( )

		/**
		 * Removes an event handler from this EventDelegate.
		 *
		 * @public
		 * @param {function([object])} handler
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
	})();

	Util.EventedCollection = (function() {
		var Collection = Util.Collection;
		var EventDelegate = Util.EventDelegate;

		var EventedCollection = function() {
			Collection.apply(this, arguments);
			this.added = new EventDelegate();
			this.removed = new EventDelegate();
		};

		EventedCollection.prototype = new Collection();

		EventedCollection.prototype.added = undefined;
		EventedCollection.prototype.removed = undefined;

		EventedCollection.prototype.add = function(item) {
			this._arr.push(item);
			this.added.dispatch(this, item);
		}; // add( )

		EventedCollection.prototype.clear = function() {
			var arr = this._arr.splice(0, this._arr.length);
			for (var i = 0; i < arr.length; i++) {
				this.removed.dispatch(this, arr[i]);
			} // for( i )
		}; // clear( )

		EventedCollection.prototype.insert = function(index, item) {
			this._arr.splice(index, 0, item);
			this.added.dispatch(this, item);
		}; // insert( )

		EventedCollection.prototype.remove = function(item) {
			var index = this._arr.indexOf(item);
			if (index >= 0)
			{
				this._arr.splice(index, 1);
				this.removed.dispatch(this, item);
			} // if
		}; // remove( )

		EventedCollection.prototype.removeAt = function(index) {
			var dispatch = this._arr.length > 0;
			var item = this._arr.splice(index, 1);
			if (dispatch)
				this.removed.dispatch(this, item);
		}; // removeAt( )

		return EventedCollection;
	})();

	Util.Timing = (function() {
		var Timing = {
			isHighResolution: false,
			now: undefined
		};

		// IE 9 has performance, but not performance.now
		if (window.performance !== undefined && performance.now !== undefined) {
			Timing.isHighResolution = true;
			Timing.now = function() {
				return performance.now();
			};
		} // if
		else {
			var start = Date.now();
			Timing.now = function() { return Date.now() - start; };
		} // else

		return Timing;
	})();

	return Util;
});
