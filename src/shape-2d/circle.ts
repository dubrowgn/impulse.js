import { Matrix } from "./matrix";
import { Shape2d, ShapeId } from "./shape-2d";
import { Vector } from "./vector";

export class Circle implements Shape2d {
	x: number = 0;
	y: number = 0;
	r: number = 1;

	/**
	 * A simple circle class
	 */
	constructor();
	constructor(c: Circle);
	constructor(v: Vector, r: number);
	constructor(x: number, y: number, r: number);
	constructor(x?: any, y?: number, r?: number) {
		this._set(x, y, r);
	}

	applyTransform = Circle.prototype.transform;

	clone(): this {
		return <this> new Circle(this);
	}

	equals(other: any): boolean {
		return other instanceof Circle &&
			this.x === other.x &&
			this.y === other.y &&
			this.r === other.r;
	}

	getCenter(): Vector {
		return new Vector(this.x, this.y);
	}

	getShapeId(): number {
		return ShapeId.Circle;
	}

	getShapeID = Circle.prototype.getShapeId;

	set(c: Circle): Circle;
	set(v: Vector, r: number): Circle;
	set(x: number, y: number, r: number): Circle;
	set(x?: any, y?: number, r?: number): Circle {
		return this._set(x, y, r);
	}

	private _set(x?: any, y?: number, r?: number): Circle {
		if (x instanceof Circle) {
			this.x = x.x;
			this.y = x.y;
			this.r = x.r;
		} else if (x instanceof Vector) {
			this.x = x.x;
			this.y = x.y;
			this.r = y as number;
		} else if (typeof x === "number") {
			this.x = x;
			this.y = y as number;
			this.r = r as number;
		} else {
			this.x = 0;
			this.y = 0;
			this.r = 1;
		}

		return this;
	}

	setCenter(center: Vector): this;
	setCenter(x: number, y: number): this;
	setCenter(x: any, y?: number): this {
		if (x instanceof Vector) {
			this.x = x.x;
			this.y = x.y;
		} else {
			this.x = x;
			this.y = y as number;
		}

		return this;
	}

	toString(): string {
		return `Circle(${this.x}, ${this.y}, ${this.r})`;
	}

	transform(matrix: Matrix): this {
		let x = this.x;
		this.x = matrix.a * x + matrix.c * this.y + matrix.e;
		this.y = matrix.b * x + matrix.d * this.y + matrix.f;

		let scale = matrix.getScale();
		if (scale.x != scale.y)
			throw "Non-uniform scaling cannot be applied to type Circle";
		this.r *= scale.x;

		return this;
	}
};
