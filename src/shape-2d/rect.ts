import { Matrix } from "./matrix";
import { Shape2d, ShapeId } from "./shape-2d";
import { Vector } from "./vector";

export interface RectData {
	l: number;
	b: number;
	w: number;
	h: number;
};

export class Rect implements Shape2d {
	l: number = -0.5;
	b: number = 0.5;
	w: number = 1;
	h: number = 1;

	get r() {
		return this.l + this.w;
	}

	get t() {
		return this.b + this.h;
	}

	constructor();
	constructor(rect: Rect);
	constructor(lb: Vector, wh: Vector);
	constructor(l: number, b: number, w: number, h: number);
	constructor(l?: any, b?: any, w?: number, h?: number) {
		this._set(l, b, w, h);
	}

	clone(): this {
		return <this> new Rect(this);
	}

	equals(other: any): boolean {
		return other instanceof Rect &&
			this.l === other.l &&
			this.b === other.b &&
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
			l: this.l,
			b: this.b,
			w: this.w,
			h: this.h
		};
	}

	getCenter(): Vector {
		return new Vector(this.l + this.w/2, this.b + this.h/2);
	}

	getShapeId(): number {
		return ShapeId.Rect;
	}

	getVertices(): Vector[] {
		return [
			new Vector(this.l, this.b),
			new Vector(this.l, this.t),
			new Vector(this.r, this.t),
			new Vector(this.r, this.b),
		];
	}

	set(rect: Rect): Rect;
	set(lb: Vector, wh: Vector): Rect;
	set(l: number, b: number, w: number, h: number): Rect;
	set(l?: any, b?: any, w?: number, h?: number): Rect {
		return this._set(l, b, w, h);
	}

	private _set(l?: any, b?: any, w?: number, h?: number): Rect {
		if (l instanceof Rect) {
			this.l = l.l;
			this.b = l.b;
			this.w = l.w;
			this.h = l.h;
		} else if (l instanceof Vector) {
			this.l = l.x;
			this.b = l.y;
			this.w = (b as Vector).x;
			this.h = (b as Vector).y;
		} else if (typeof l === "number") {
			this.l = l;
			this.b = b as number;
			this.w = w as number;
			this.h = h as number;
		} else {
			this.h = 1;
			this.w = 1;
			this.l = -0.5;
			this.b = 0.5;
		}

		return this;
	}

	setCenter(center: Vector): this;
	setCenter(x: number, y: number): this;
	setCenter(x: any, y?: number): this {
		if (x instanceof Vector) {
			this.l = x.x - this.w/2;
			this.b = x.y - this.h/2;
		} else {
			this.l = x - this.w/2;
			this.b = y as number - this.h/2;
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
		return `Rect(${this.l}, ${this.b}, ${this.w}, ${this.h})`;
	}

	transform(matrix: Matrix): this {
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
		return new Rect(obj.l, obj.b, obj.w, obj.h);
	}
};
