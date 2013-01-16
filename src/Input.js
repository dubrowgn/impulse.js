/**
 * @namespace
 */
Impulse.Input = (function() {
	var Input = {};

	// imports
	var EventDelegate = Impulse.Util.EventDelegate;

	Input.MouseAdapter = (function() {
		var MouseAdapter = function(camera) {
			this._buttons = { left:false, middle:false, right:false };
			this._camera = camera;

			// initialize mouse delegates
			this.click = new EventDelegate();
			this.doubleClick = new EventDelegate();
			this.down = new EventDelegate();
			this.move = new EventDelegate();
			this.up = new EventDelegate();
			this.wheel = new EventDelegate();

			// initialize custom event handlers for this instance
			var maThis = this;

			this._onClick = function(e) {
				e = maThis._normalizeMouseEvent(e);
				maThis._buttons.left = maThis._buttons.left && !e.buttons.left;
				maThis._buttons.middle = maThis._buttons.middle && !e.buttons.middle;
				maThis._buttons.right = maThis._buttons.right && !e.buttons.right;
				maThis.click.dispatch(e);
			};

			MouseAdapter.prototype._onDoubleClick = function(e) {
				e = maThis._normalizeMouseEvent(e);
				maThis._buttons.left = maThis._buttons.left && !e.buttons.left;
				maThis._buttons.middle = maThis._buttons.middle && !e.buttons.middle;
				maThis._buttons.right = maThis._buttons.right && !e.buttons.right;
				maThis.doubleClick.dispatch(e);
			};

			MouseAdapter.prototype._onDown = function(e) {
				e.preventDefault();
				e = maThis._normalizeMouseEvent(e);
				maThis._buttons.left = maThis._buttons.left || e.buttons.left;
				maThis._buttons.middle = maThis._buttons.middle || e.buttons.middle;
				maThis._buttons.right = maThis._buttons.right || e.buttons.right;
				maThis.down.dispatch(e);
			};

			MouseAdapter.prototype._onMove = function(e) {
				e = maThis._normalizeMouseEvent(e);
				maThis._position = e.position.clone();
				maThis.move.dispatch(e);
			};

			MouseAdapter.prototype._onUp = function(e) {
				e = maThis._normalizeMouseEvent(e);
				maThis._buttons.left = maThis._buttons.left && !e.buttons.left;
				maThis._buttons.middle = maThis._buttons.middle && !e.buttons.middle;
				maThis._buttons.right = maThis._buttons.right && !e.buttons.right;
				maThis.up.dispatch(e);
			};

			MouseAdapter.prototype._onWheel = function(e) {
				maThis.wheel.dispatch(maThis._normalizeMouseEvent(e));
			};

			// attach mouse delegates to the canvas object
			var canvas = this._camera.getCanvas();
			canvas.addEventListener('click', this._onClick, false);
			canvas.addEventListener('contextmenu', this._onContextMenu, false);
			canvas.addEventListener('dblclick', this._onDoubleClick, false);
			canvas.addEventListener('mousedown', this._onDown, false);
			canvas.addEventListener('mousemove', this._onMove, false);
			canvas.addEventListener('mouseup', this._onUp, false);
			canvas.addEventListener('mousewheel', this._onWheel, false);
			canvas.addEventListener('DOMMouseScroll', this._onWheel, false); // firefox >= 3.5
		}; // class MouseAdapter

		MouseAdapter.prototype._camera = undefined;
		MouseAdapter.prototype._buttons = undefined;
		MouseAdapter.prototype.click = undefined;
		MouseAdapter.prototype.doubleClick = undefined;
		MouseAdapter.prototype.down = undefined;
		MouseAdapter.prototype.move = undefined;
		MouseAdapter.prototype._onClick = undefined;
		MouseAdapter.prototype._onDoubleClick = undefined;
		MouseAdapter.prototype._onDown = undefined;
		MouseAdapter.prototype._onMove = undefined;
		MouseAdapter.prototype._onUp = undefined;
		MouseAdapter.prototype._onWheel = undefined;
		MouseAdapter.prototype._position = undefined;
		MouseAdapter.prototype.up = undefined;
		MouseAdapter.prototype.wheel = undefined;


		MouseAdapter.prototype.destroy = function() {
			// detach mouse delegates from the canvas object
			var canvas = this._camera.getCanvas();
			canvas.removeEventListener('click', this._onClick, false);
			canvas.removeEventListener('contextmenu', this._onContextMenu, false);
			canvas.removeEventListener('dblclick', this._onDoubleClick, false);
			canvas.removeEventListener('mousedown', this._onDown, false);
			canvas.removeEventListener('mousemove', this._onMove, false);
			canvas.removeEventListener('mouseup', this._onUp, false);
			canvas.removeEventListener('mousewheel', this._onWheel, false);
			canvas.removeEventListener('DOMMouseScroll', this._onWheel, false); // firefox >= 3.5
		}; // destroy( )

		MouseAdapter.prototype.getButtons = function() {
			return this._buttons;
		}; // getButtons( )

		MouseAdapter.prototype.getPosition = function() {
			return this._position;
		}; // getPosition( )

		MouseAdapter.prototype._normalizeMouseEvent = function(e) {
			// build and return normalized event object
			return {
				buttons: {
					left: e.which === 1,
					middle: e.which === 2,
					right: e.which === 3
				},
				position: this._camera.canvasToWorld(
					e.offsetX !== undefined ? e.offsetX : e.pageX - e.currentTarget.offsetLeft,
					e.offsetY !== undefined ? e.offsetY : e.pageY - e.currentTarget.offsetTop
				),
				wheel: e.wheelDelta !== undefined ? e.wheelDelta / 40 : e.detail !== undefined ? -e.detail : 0
			};
		}; // _normalizeMouseEvent( )

		MouseAdapter.prototype._onContextMenu = function (e) {
			e.preventDefault();
		}; // _onContextMenu( )

		return MouseAdapter;
	})();

	return Input;
});