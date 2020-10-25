import { Entity } from "./entity";
import { EventDelegate } from "../util/event-delegate";
import { Matrix } from "../shape-2d/matrix";
import { Polygon } from "../shape-2d/polygon";
import { Vector } from "../shape-2d/vector";

export class Camera {
	protected cameraMatrix: Matrix;
	protected canvas: HTMLCanvasElement;
	protected canvasMatrix!: Matrix;
	protected h!: number;
	protected resizeHandler: () => void;
	protected targetH: number;
	protected targetW: number;
	protected viewportMargin: number;
	protected w!: number;

	moved: EventDelegate;
	rotated: EventDelegate;
	zoomed: EventDelegate;

	constructor(
		canvas: HTMLCanvasElement, x: number, y: number,
		w: number, h: number, viewportMargin: number = 0
	) {
		this.cameraMatrix = new Matrix(1, 0, 0, 1, -x, -y);
		this.canvas = canvas;
		this.moved = new EventDelegate();
		this.rotated = new EventDelegate();
		this.targetH = h;
		this.targetW = w;
		this.viewportMargin = viewportMargin;
		this.zoomed = new EventDelegate();

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

		return vect.transform(this.getRenderMatrix().invert());
	}

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
		let scale = this.cameraMatrix.getScale();
		this.cameraMatrix.preScale(zoom / scale.x, zoom / scale.y);
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

	protected updateCanvasValues() {
		// calculate zoom factor
		let zoom = Math.min(
			this.canvas.width / this.targetW,
			this.canvas.height / this.targetH
		);

		// update width/height values
		this.h = this.canvas.height / zoom;
		this.w = this.canvas.width / zoom;

		// rebuild the transformation matrix
		this.canvasMatrix = new Matrix(
			zoom, 0, 0, -zoom, this.canvas.width/2, this.canvas.height/2
		);

		// dispatch zoom changed event
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
		this.zoomed.dispatch(this);

		return this;
	}
};
