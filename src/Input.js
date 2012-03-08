/**
 * @namespace
 */
Impulse.Input = (function() {
	var Input = {};

	Input.Mouse = (function() {

		// -------------------------------------

		var downEvents = new Array();
		var moveEvents = new Array();
		var upEvents = new Array();

		// -------------------------------------

		function FixMouseEvent(_e) {
			// calculate _e.offsetX/Y if they don't exist (Firefox)
			if (typeof _e.offsetX == "undefined") {
				_e.offsetX = _e.pageX - _e.currentTarget.offsetLeft;
				_e.offsetY = _e.pageY - _e.currentTarget.offsetTop;
			} // if
			return _e;
		} // FixMouseEvent( )

		// -------------------------------------

		// calls all the event handlers in _register, passing event args _e
		function OnMouseEvent(_register, _e) {
			_e = FixMouseEvent(_e);
			var lng = _register.length;
			for (var i = 0; i < lng; i++) {
				if (_register[i] != null)
					_register[i](_e);
			} // for( i )
			CleanRegister(_register);
		} // OnMouseEvent( )

		// -------------------------------------

		function OnMouseDown(_e) {
			OnMouseEvent(downEvents, _e);
		} // OnMouseDown( )

		// -------------------------------------

		function OnMouseMove(_e) {
			OnMouseEvent(moveEvents, _e);
		} // OnMouseMove( )

		// -------------------------------------

		function OnMouseUp(_e) {
			OnMouseEvent(upEvents, _e);
		} // OnMouseUp( )

		// -------------------------------------

		function AddDownHandler(_handler) {
			downEvents.push(_handler);
		} // AddDownHandler( )

		// -------------------------------------

		function AddMoveHandler(_handler) {
			moveEvents.push(_handler);
		} // AddMoveHandler( )

		// -------------------------------------

		function AddUpHandler(_handler) {
			upEvents.push(_handler);
		} // AddUpHandler( )

		// -------------------------------------

		// Removes null handlers from a register. Call after handling an event to avoid
		// problems with removing items from an array being iterated over
		function CleanRegister(_register) {
			var lng = _register.length;
			for (var i = 0; i < lng; i++) {
				if (_register[i] == null) {
					_register.splice(i, 1);
					lng--;
					i--;
					return;
				} // if
			} // for( i )
		} // CleanRegister( )

		// -------------------------------------

		// removes the handler only once
		function RemoveHandler(_register, _handler) {
			var lng = _register.length;
			for (var i = 0; i < lng; i++) {
				if (_register[i] == _handler) {
					//_register.splice(i, 1);
					_register[i] = null;
					return;
				} // if
			} // for( i )
		} // RemoveHandler( )

		// -------------------------------------

		function RemoveDownHandler(_handler) {
			RemoveHandler(downEvents, _handler);
		} // RemoveDownHandler( )

		// -------------------------------------

		function RemoveMoveHandler(_handler) {
			RemoveHandler(moveEvents, _handler);
		} // RemoveMoveHandler( )

		// -------------------------------------

		function RemoveUpHandler(_handler) {
			RemoveHandler(upEvents, _handler);
		} // RemoveDownHandler( )

		// -------------------------------------

		// Public Members
		return {
			OnMouseDown:OnMouseDown,
			OnMouseMove:OnMouseMove,
			OnMouseUp:OnMouseUp,
			AddDownHandler:AddDownHandler,
			AddMoveHandler:AddMoveHandler,
			AddUpHandler:AddUpHandler,
			RemoveDownHandler:RemoveDownHandler,
			RemoveMoveHandler:RemoveMoveHandler,
			RemoveUpHandler:RemoveUpHandler
		}; // public members
	})();

	return Input;
});