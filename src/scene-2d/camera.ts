import { Entity } from "./entity";
import { Event } from "../util/event";
import { Matrix } from "../shape-2d/matrix";
import { Polygon } from "../shape-2d/polygon";
import { Vector } from "../shape-2d/vector";

type CameraHandler = (camera: Camera) => void;

export class Camera {
	protected cameraMatrix: Matrix;
	protected canvas: HTMLCanvasElement;
	protected canvasMatrix!: Matrix;
	protected ctx: CanvasRenderingContext2D;
	protected h!: number;
	protected _pixelRatio: number = window.devicePixelRatio || 1;
	protected resizeHandler: () => void;
	protected targetH: number;
	protected targetW: number;
	protected viewportMargin: number;
	protected w!: number;
	protected scale: number = 1;

	moved: Event<CameraHandler>;
	resized: Event<CameraHandler>;
	rotated: Event<CameraHandler>;
	zoomed: Event<CameraHandler>;

	constructor(
		canvas: HTMLCanvasElement, x: number, y: number,
		w: number, h: number, viewportMargin: number = 0
	) {
		let ctx = canvas.getContext("2d");
		if (ctx == null)
			throw "Failed to initialize 2d canvas context";

		this.cameraMatrix = new Matrix(1, 0, 0, 1, -x, -y);
		this.canvas = canvas;
		this.ctx = ctx;
		this.moved = new Event();
		this.resized = new Event();
		this.rotated = new Event();
		this.targetH = h;
		this.targetW = w;
		this.viewportMargin = viewportMargin;
		this.zoomed = new Event();

		// hook into the window resize event handler
		this.resizeHandler = () => this.updateCanvasValues();
		window.addEventListener('resize', this.resizeHandler, false);

		// init the canvas related values for this camera
		this.updateCanvasValues();
	}

	canvasToWorld(vect: Vector): Vector;
	canvasToWorld(x: number, y: number): Vector;
	canvasToWorld(x: any, y?: number): Vector {
		let vect = x instanceof Vector ? x.clone() : new Vector(x, y as number);

		vect.scale(this._pixelRatio);

		return vect.transform(this.getRenderMatrix().invert());
	}

	get drawContext() { return this.ctx; }

	destroy() {
		window.removeEventListener("resize", this.resizeHandler, false);
	}

	getCanvas(): HTMLCanvasElement {
		return this.canvas;
	}

	getMatrix(): Matrix {
		return this.cameraMatrix;
	}

	getPosition(): Vector {
		return new Vector(-this.cameraMatrix.e, -this.cameraMatrix.e);
	}

	getRenderMatrix(): Matrix {
		return this.cameraMatrix.clone().combine(this.canvasMatrix);
	}

	getViewport(useMargin: boolean = false) {
		let hh = this.h / 2 + (useMargin ? this.viewportMargin : 0);
		let hw = this.w / 2 + (useMargin ? this.viewportMargin : 0);
		let vp = new Polygon([
			new Vector(-hw, hh),
			new Vector(hw, hh),
			new Vector(hw, -hh),
			new Vector(-hw, -hh),
		]);

		return vp.transform(this.cameraMatrix.clone().invert());
	}

	rotate(rads: number): this {
		this.cameraMatrix.rotate(rads);

		return this;
	};

	get pixelRatio() { return this._pixelRatio; }
	set pixelRatio(ratio: number) {
		this._pixelRatio = ratio;
		this.updateCanvasValues();
	}

	setPosition(ent: Entity): this;
	setPosition(vect: Vector): this;
	setPosition(x: number, y: number): this;
	setPosition(x: any, y?: number): this {
		if (x instanceof Entity) {
			let pos = x.getPosition();
			this.cameraMatrix.e = -pos.x;
			this.cameraMatrix.f = -pos.y;
		} else if (x instanceof Vector) {
			this.cameraMatrix.e = -x.x;
			this.cameraMatrix.f = -x.y;
		} else {
			this.cameraMatrix.e = -x;
			this.cameraMatrix.f = -(y as number);
		}

		this.moved.dispatch(this);

		return this;
	}

	setRotation(rads: number): this {
		this.cameraMatrix.rotate(rads - this.cameraMatrix.getRotation());
		this.rotated.dispatch(this);

		return this;
	}

	setZoom(zoom: number): this {
		this.cameraMatrix.preScale(zoom / this.scale);
		this.scale = zoom;

		this.zoomed.dispatch(this);

		return this;
	}

	translate(vect: Vector): this;
	translate(x: number, y: number): this;
	translate(x: any, y?: number): this {
		if (x instanceof Vector)
			this.cameraMatrix.preTranslate(-x.x, -x.y);
		else
			this.cameraMatrix.preTranslate(-x, -(y as number));

		this.moved.dispatch(this);

		return this;
	}

	protected canvasScreenDims(canvas: HTMLCanvasElement): Vector {
		let style = window.getComputedStyle(canvas);
		let l = parseFloat(style.paddingLeft);
		let b = parseFloat(style.paddingBottom);
		let r = parseFloat(style.paddingRight);
		let t = parseFloat(style.paddingTop);

		return new Vector(canvas.clientWidth - l - r, canvas.clientHeight - b - t);
	}

	protected updateCanvasValues() {
		let c = this.canvas;
		let dims = this.canvasScreenDims(c);
		c.width = dims.x * this._pixelRatio;
		c.height = dims.y * this._pixelRatio;

		// calculate zoom factor
		let zoom = Math.min(
			c.width / this.targetW,
			c.height / this.targetH
		);

		// update width/height values
		this.w = c.width / zoom;
		this.h = c.height / zoom;

		// rebuild the transformation matrix
		this.canvasMatrix = new Matrix(zoom, 0, 0, -zoom, c.width / 2, c.height / 2);

		// dispatch events
		this.resized.dispatch(this);
		this.zoomed.dispatch(this);
	}

	worldToCanvas(vect: Vector): Vector;
	worldToCanvas(x: number, y: number): Vector;
	worldToCanvas(x: any, y?: number): Vector {
		let vect = x instanceof Vector ? x.clone() : new Vector(x, y as number);

		return vect.transform(this.getRenderMatrix());
	};

	zoom(zoom: number): this {
		this.cameraMatrix.preScale(zoom);
		this.scale *= zoom;

		this.zoomed.dispatch(this);

		return this;
	}
};
