import { Vector } from "Shape2D"
import { EventDelegate } from "Util"

const { MouseButtons, MouseState, MouseAdapter } = (function() {
	var Input = {};

	Input.MouseAdapter = (function() {
		var MouseButtons = Input.MouseButtons;
		var MouseState = Input.MouseState;

		var MouseAdapter = function(camera) {
			this._buttons = new MouseButtons();
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

			this._onDoubleClick = function(e) {
				e = maThis._normalizeMouseEvent(e);
				maThis._buttons.left = maThis._buttons.left && !e.buttons.left;
				maThis._buttons.middle = maThis._buttons.middle && !e.buttons.middle;
				maThis._buttons.right = maThis._buttons.right && !e.buttons.right;
				maThis.doubleClick.dispatch(e);
			};

			this._onDown = function(e) {
				e.preventDefault();
				e = maThis._normalizeMouseEvent(e);
				maThis._buttons.left = maThis._buttons.left || e.buttons.left;
				maThis._buttons.middle = maThis._buttons.middle || e.buttons.middle;
				maThis._buttons.right = maThis._buttons.right || e.buttons.right;
				maThis.down.dispatch(e);
			};

			this._onMove = function(e) {
				maThis._updateRawPosition(e);
				e = maThis._normalizeMouseEvent(e);
				maThis._position = e.position.clone();
				maThis.move.dispatch(e);
			};

			this._onUp = function(e) {
				e = maThis._normalizeMouseEvent(e);
				maThis._buttons.left = maThis._buttons.left && !e.buttons.left;
				maThis._buttons.middle = maThis._buttons.middle && !e.buttons.middle;
				maThis._buttons.right = maThis._buttons.right && !e.buttons.right;
				maThis.up.dispatch(e);
			};

			this._onWheel = function(e) {
				maThis.wheel.dispatch(maThis._normalizeMouseEvent(e));
			};

			// attach to camera events
			this._onCameraEvent = function(source) {
				if (maThis._rawPosition !== undefined)
					maThis._position = maThis._camera.canvasToWorld(maThis._rawPosition);
			};

			camera.moved.add(this._onCameraEvent);
			camera.rotated.add(this._onCameraEvent);
			camera.zoomed.add(this._onCameraEvent);

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
		MouseAdapter.prototype._onCameraEvent = undefined;
		MouseAdapter.prototype._onClick = undefined;
		MouseAdapter.prototype._onDoubleClick = undefined;
		MouseAdapter.prototype._onDown = undefined;
		MouseAdapter.prototype._onMove = undefined;
		MouseAdapter.prototype._onUp = undefined;
		MouseAdapter.prototype._onWheel = undefined;
		MouseAdapter.prototype._position = undefined;
		MouseAdapter.prototype._rawPosition = undefined;
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

			// detach camera delegates
			camera.moved.remove(this._onCameraEvent);
			camera.rotated.remove(this._onCameraEvent);
			camera.zoomed.remove(this._onCameraEvent);
		}; // destroy( )

		MouseAdapter.prototype.getButtons = function() {
			return this._buttons;
		}; // getButtons( )

		MouseAdapter.prototype.getPosition = function() {
			return this._position;
		}; // getPosition( )

		MouseAdapter.prototype._normalizeMouseEvent = function(e) {
			// build and return normalized event object
			return new MouseState(
				this._camera.canvasToWorld(
					e.offsetX !== undefined ? e.offsetX : e.pageX - e.currentTarget.offsetLeft,
					e.offsetY !== undefined ? e.offsetY : e.pageY - e.currentTarget.offsetTop
				),
				new MouseButtons(
					e.which === 1,
					e.which === 2,
					e.which === 3
				),
				e.wheelDelta !== undefined ? e.wheelDelta / 40 : e.detail !== undefined ? -e.detail : 0
			);
		}; // _normalizeMouseEvent( )

		MouseAdapter.prototype._onContextMenu = function (e) {
			e.preventDefault();
		}; // _onContextMenu( )

		MouseAdapter.prototype._updateRawPosition = function(e) {
			this._rawPosition = new Vector(
				e.offsetX !== undefined ? e.offsetX : e.pageX - e.currentTarget.offsetLeft,
				e.offsetY !== undefined ? e.offsetY : e.pageY - e.currentTarget.offsetTop
			);
		};

		return MouseAdapter;
	});

	Input.MouseButtons = (function() {
		var MouseButtons = function(left, middle, right) {
			this.left = left === undefined ? false : left;
			this.middle = middle === undefined ? false : middle;
			this.right = right === undefined ? false : right;
		}; // class

		MouseButtons.prototype.left = false;
		MouseButtons.prototype.middle = false;
		MouseButtons.prototype.right = false;

		return MouseButtons;
	});

	Input.MouseState = (function() {
		var MouseButtons = Input.MouseButtons;

		var MouseState = function(position, buttons, wheel) {
			this.buttons = buttons === undefined ? new MouseButtons() : buttons;
			this.position = position === undefined ? new Vector() : position;
			this.wheel = wheel === undefined ? 0 : wheel;
		}; // class

		MouseState.prototype.buttons = undefined;
		MouseState.prototype.position = undefined;
		MouseState.prototype.wheel = 0;

		return MouseState;
	});

	// init in correct order
	Input.MouseButtons = Input.MouseButtons();
	Input.MouseState = Input.MouseState(); // requires MouseButtons
	Input.MouseAdapter = Input.MouseAdapter(); // requires MouseButtons, MouseState

	return Input;
})();

export { MouseButtons, MouseState, MouseAdapter };
