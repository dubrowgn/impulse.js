import { Matrix } from "./matrix";
import { Shape2d, ShapeId } from "./shape-2d";
import { Vector } from "./vector";

interface RectData {
	x: number;
	y: number;
	w: number;
	h: number;
};

export class Rect implements Shape2d<Rect> {
	x: number = -0.5;
	y: number = 0.5;
	w: number = 1;
	h: number = 1;

	constructor();
	constructor(rect: Rect);
	constructor(pos: Vector, size: Vector);
	constructor(x: number, y: number, w: number, h: number);
	constructor(x?: any, y?: any, w?: number, h?: number) {
		this._set(x, y, w, h);
	}

	applyTransform = Rect.prototype.transform;

	clone(): Rect {
		return new Rect(this);
	}

	equals(other: any): boolean {
		return other instanceof Rect &&
			this.x === other.x &&
			this.y === other.y &&
			this.w === other.w &&
			this.h === other.h;
	}

	/**
	 * export( )
	 *
	 * Returns a generic object containing the current state of this rect.
	 * This is useful for storing state via JSON for example.
	 *
	 * @public
	 * @sig public {Object} export();
	 * @return {Object}
	 */
	export(): RectData {
		return {
			x: this.x,
			y: this.y,
			w: this.w,
			h: this.h
		};
	}

	getCenter(): Vector {
		return new Vector(this.x + this.w/2, this.y - this.h/2);
	}

	getShapeId(): number {
		return ShapeId.Rect;
	}

	getShapeID = Rect.prototype.getShapeId;

	getVertices(): Vector[] {
		return [
			new Vector(this.x, this.y),
			new Vector(this.x + this.w, this.y),
			new Vector(this.x + this.w, this.y - this.h),
			new Vector(this.x, this.y - this.h)
		];
	}

	set(rect: Rect): Rect;
	set(pos: Vector, size: Vector): Rect;
	set(x: number, y: number, w: number, h: number): Rect;
	set(x?: any, y?: any, w?: number, h?: number): Rect {
		return this._set(x, y, w, h);
	}

	private _set(x?: any, y?: any, w?: number, h?: number): Rect {
		if (x instanceof Rect) {
			this.x = x.x;
			this.y = x.y;
			this.w = x.w;
			this.h = x.h;
		} else if (x instanceof Vector) {
			this.x = x.x;
			this.y = x.y;
			this.w = (y as Vector).x;
			this.h = (y as Vector).y;
		} else if (typeof x === "number") {
			this.x = x;
			this.y = y as number;
			this.w = w as number;
			this.h = h as number;
		} else {
			this.h = 1;
			this.w = 1;
			this.x = -0.5;
			this.y = 0.5;
		}

		return this;
	}

	setCenter(center: Vector): Rect;
	setCenter(x: number, y: number): Rect;
	setCenter(x: any, y?: number): Rect {
		if (x instanceof Vector) {
			this.x = x.x - this.w/2;
			this.y = x.y + this.h/2;
		} else {
			this.x = x - this.w/2;
			this.y = y as number + this.h/2;
		}

		return this;
	}

	/**
	 * toJSON( )
	 *
	 * Returns a JSON ready copy of this object's current state.
	 * @return {Object}
	 */
	toJSON = Rect.prototype.export;

	toString(): string {
		return `Rect(${this.x}, ${this.y}, ${this.w}, ${this.h})`;
	}

	transform(matrix: Matrix): Rect {
		// transform center
		let center = this.getCenter();
		center.transform(matrix);
		this.setCenter(center);

		// scale dimensions
		let scale = matrix.getScale();
		this.h *= scale.y;
		this.w *= scale.x;

		return this;
	}

	/**
	 * import( )
	 *
	 * Creates a new rect with an internal state equal to the values of the
	 * passed generic object. This is useful for restoring state from JSON
	 * for example.
	 *
	 * @public
	 * @static
	 * @sig public {Rect} import({Object});
	 * @param  {Object} obj
	 * @return {Rect}
	 */
	static import(obj: RectData): Rect {
		return new Rect(obj.x, obj.y, obj.w, obj.h);
	}
};
