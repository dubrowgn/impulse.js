import { sign, twoPi } from "../math"
import { Matrix } from "./matrix";
import { Shape2d, ShapeId } from "./shape-2d";
import { Vector } from "./vector";
import { Rect } from "./rect";

export class Polygon implements Shape2d {
	protected _aabb?: Rect = undefined;
	private _vertices: Vector[];

	constructor(polygon: Polygon);
	constructor(vertices: Vector[]);
	constructor(polygon: any) {
		if (polygon instanceof Polygon) {
			if (polygon._aabb !== undefined)
				this._aabb = polygon._aabb.clone();

			this._vertices = polygon._vertices.slice();
		} else {
			let vertices = polygon as Vector[];

			if (vertices.length < 3)
				throw "Cannot construct polygon with fewer than 3 vertices!";

			this._vertices = vertices;
		}
	}

	clone(): this {
		return <this> new Polygon(this);
	}

	equals(other: any): boolean {
		if (!(other instanceof Polygon))
			return false;

		if (this._vertices.length !== other._vertices.length)
			return false;

		for (let i = 0; i < this._vertices.length; i++) {
			if (!this._vertices[i].equals(other._vertices[i]))
				return false;
		}

		return true;
	}

	// Axis-Aligned Bounding Box
	get aabb(): Rect {
		if (this._aabb !== undefined)
			return this._aabb;

		let l = Number.NEGATIVE_INFINITY;
		let b = Number.NEGATIVE_INFINITY;
		let r = Number.POSITIVE_INFINITY;
		let t = Number.POSITIVE_INFINITY;
		for (let v of this._vertices) {
			l = Math.min(l, v.x);
			r = Math.max(r, v.x);
			b = Math.min(b, v.y);
			t = Math.max(t, v.y);
		}

		this._aabb = new Rect(l, b, r - l, t - b);

		return this._aabb;
	}

	getCenter(): Vector {
		return this.aabb.getCenter();
	}

	getShapeId(): number {
		return ShapeId.Polygon;
	}

	get vertices(): Vector[] {
		return this._vertices;
	}

	isConvex(): Boolean {
		let vs = this._vertices;
		if (vs.length < 3)
			throw "Polygon must have 3 or more vertices!";

		let p1 = vs[vs.length - 2];
		let p2 = vs[vs.length - 1];
		let d1 = p1.angleTo(p2);
		let totalRads = 0;
		let orien;

		for (let i = 0; i < vs.length; i++) {
			p1 = p2;
			p2 = vs[i];

			let d2 = p1.angleTo(p2);
			let angle = d2 - d1;
			d1 = d2;

			// ignore this segment if it is collinear with the last
			if (angle === 0)
				continue;

			// wrap angle to (-pi, pi]
			if (angle <= -Math.PI)
				angle += twoPi;
			else if (angle > Math.PI)
				angle -= twoPi;

			// ensure orientation does not change
			if (orien === undefined)
				orien = sign(angle);
			else if (orien < 0 != angle < 0)
				return false;

			// ensure we haven't made more than one complete revolution
			totalRads += angle;
			if (Math.abs(totalRads) > twoPi)
				return false;
		}

		return true;
	}

	setCenter(center: Vector): this;
	setCenter(x: number, y: number): this;
	setCenter(x: any, y?: number): this {
		let center = x instanceof Vector ? x : new Vector(x, y as number);
		let offset = center.clone().subtract(this.getCenter());

		for (let v of this._vertices) {
			v.add(offset);
		}

		if (this._aabb !== undefined)
			this._aabb.setCenter(center);

		return this;
	}

	toString(): string {
		let s = "Polygon(";

		for (let v of this._vertices) {
			s += `<${v.x},${v.y}>,`;
		}

		return s.slice(0, -1) + ")";
	}

	transform(matrix: Matrix): this {
		for (let v of this._vertices) {
			v.transform(matrix);
		}

		// invalidate caches
		this._aabb = undefined;

		return this;
	}
};
