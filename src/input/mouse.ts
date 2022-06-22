import { Camera } from "../scene-2d/camera";
import { Event } from "../util/event";
import { Vector } from "../shape-2d/vector";

export class MouseButtons {
	left: boolean;
	middle: boolean;
	right: boolean;
	back: boolean;
	forward: boolean;

	constructor(
		left: boolean = false,
		middle: boolean = false,
		right: boolean = false,
		back: boolean = false,
		forward: boolean = false,
	) {
		this.left = left;
		this.middle = middle;
		this.right = right;
		this.back = back;
		this.forward = forward;
	}
};

export class MouseState {
	buttons: MouseButtons;
	position: Vector;
	wheelX: number;
	wheelY: number;
	wheelZ: number;

	constructor(
		position: Vector = new Vector(),
		buttons: MouseButtons = new MouseButtons(),
		wheelX: number = 0,
		wheelY: number = 0,
		wheelZ: number = 0,
	) {
		this.buttons = buttons;
		this.position = position;
		this.wheelX = wheelX;
		this.wheelY = wheelY;
		this.wheelZ = wheelZ;
	}
};

type MouseEventHandler = (event: MouseEvent) => void;
type MouseWheelHandler = (event: WheelEvent) => void;

type MouseStateHandler = (state: MouseState) => void;

export class MouseAdapter {
	protected camera: Camera;
	protected buttons: MouseButtons;
	protected onCameraEvent: (source: any) => void;
	protected onClick: MouseEventHandler;
	protected onDoubleClick: MouseEventHandler;
	protected onDown: MouseEventHandler;
	protected onMove: MouseEventHandler;
	protected onUp: MouseEventHandler;
	protected onWheel: MouseWheelHandler;
	protected position: Vector = new Vector();
	protected rawPosition: Vector = new Vector();

	click: Event<MouseStateHandler>;
	doubleClick: Event<MouseStateHandler>;
	down: Event<MouseStateHandler>;
	move: Event<MouseStateHandler>;
	up: Event<MouseStateHandler>;
	wheel: Event<MouseStateHandler>;

	constructor(camera: Camera) {
		this.buttons = new MouseButtons();
		this.camera = camera;

		// initialize mouse delegates
		this.click = new Event();
		this.doubleClick = new Event();
		this.down = new Event();
		this.move = new Event();
		this.up = new Event();
		this.wheel = new Event();

		// initialize custom event handlers for this instance

		this.onClick = (event: MouseEvent) => {
			let e = this.normalizeMouseEvent(event);
			this.buttons.left = this.buttons.left && !e.buttons.left;
			this.buttons.middle = this.buttons.middle && !e.buttons.middle;
			this.buttons.right = this.buttons.right && !e.buttons.right;
			this.click.dispatch(e);
		};

		this.onDoubleClick = (event: MouseEvent) => {
			let e = this.normalizeMouseEvent(event);
			this.buttons.left = this.buttons.left && !e.buttons.left;
			this.buttons.middle = this.buttons.middle && !e.buttons.middle;
			this.buttons.right = this.buttons.right && !e.buttons.right;
			this.doubleClick.dispatch(e);
		};

		this.onDown = (event: MouseEvent) => {
			event.preventDefault();
			let e = this.normalizeMouseEvent(event);
			this.buttons.left = this.buttons.left || e.buttons.left;
			this.buttons.middle = this.buttons.middle || e.buttons.middle;
			this.buttons.right = this.buttons.right || e.buttons.right;
			this.down.dispatch(e);
		};

		this.onMove = (event: MouseEvent) => {
			this.updateRawPosition(event);
			let e = this.normalizeMouseEvent(event);
			this.position = e.position.clone();
			this.move.dispatch(e);
		};

		this.onUp = (event: MouseEvent) => {
			let e = this.normalizeMouseEvent(event);
			this.buttons.left = this.buttons.left && !e.buttons.left;
			this.buttons.middle = this.buttons.middle && !e.buttons.middle;
			this.buttons.right = this.buttons.right && !e.buttons.right;
			this.up.dispatch(e);
		};

		this.onWheel = (event: WheelEvent) => {
			this.wheel.dispatch(this.normalizeWheelEvent(event));
		};

		// attach to camera events
		this.onCameraEvent = (_source) => {
			if (this.rawPosition !== undefined)
				this.position = this.camera.canvasToWorld(this.rawPosition);
		};

		camera.moved.register(this.onCameraEvent);
		camera.rotated.register(this.onCameraEvent);
		camera.zoomed.register(this.onCameraEvent);

		// attach mouse delegates to the canvas object
		let canvas = this.camera.getCanvas();
		canvas.addEventListener('click', this.onClick, false);
		canvas.addEventListener('contextmenu', this.onContextMenu, false);
		canvas.addEventListener('dblclick', this.onDoubleClick, false);
		canvas.addEventListener('mousedown', this.onDown, false);
		canvas.addEventListener('mousemove', this.onMove, false);
		canvas.addEventListener('mouseup', this.onUp, false);
		canvas.addEventListener('wheel', this.onWheel, false);
	}

	destroy() {
		// detach mouse delegates from the canvas object
		let canvas = this.camera.getCanvas();
		canvas.removeEventListener('click', this.onClick, false);
		canvas.removeEventListener('contextmenu', this.onContextMenu, false);
		canvas.removeEventListener('dblclick', this.onDoubleClick, false);
		canvas.removeEventListener('mousedown', this.onDown, false);
		canvas.removeEventListener('mousemove', this.onMove, false);
		canvas.removeEventListener('mouseup', this.onUp, false);
		canvas.removeEventListener('wheel', this.onWheel, false);

		// detach camera delegates
		this.camera.moved.unregister(this.onCameraEvent);
		this.camera.rotated.unregister(this.onCameraEvent);
		this.camera.zoomed.unregister(this.onCameraEvent);
	}

	getButtons(): MouseButtons {
		return this.buttons;
	}

	getPosition(): Vector {
		return this.position;
	}

	protected normalizeMouseEvent(e: MouseEvent): MouseState {
		return new MouseState(
			this.camera.canvasToWorld(this.normalizeOffset(e)),
			new MouseButtons(
				e.button === 0,
				e.button === 1,
				e.button === 2,
				e.button === 3,
				e.button === 4,
			),
		);
	}

	protected normalizeOffset(e: MouseEvent): Vector {
		let target = e.currentTarget as HTMLElement;

		return new Vector(
			e.offsetX !== undefined ? e.offsetX : e.pageX - target.offsetLeft,
			e.offsetY !== undefined ? e.offsetY : e.pageY - target.offsetTop,
		);
	}

	protected normalizeWheelEvent(e: WheelEvent): MouseState {
		let state = this.normalizeMouseEvent(e);

		if (e.deltaX !== 0)
			state.wheelX = e.deltaX / Math.abs(e.deltaX)

		if (e.deltaY !== 0)
			state.wheelY = e.deltaY / Math.abs(e.deltaY)

		if (e.deltaZ !== 0)
			state.wheelZ = e.deltaZ / Math.abs(e.deltaZ)

		return state;
	}

	protected onContextMenu(e: MouseEvent) {
		e.preventDefault();
	}

	protected updateRawPosition(e: MouseEvent) {
		this.rawPosition = this.normalizeOffset(e);
	}
};
