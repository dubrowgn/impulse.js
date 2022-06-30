import { Circle } from "./circle";
import { sign, twoPi } from "../math"
import { Matrix } from "./matrix";
import { Shape2d, ShapeId } from "./shape-2d";
import { Vector } from "./vector";

export class Polygon implements Shape2d {
	private _center?: Vector = undefined;
	private _r?: number = undefined;
	private _vertices: Vector[];

	constructor(polygon: Polygon);
	constructor(vertices: Vector[]);
	constructor(polygon: any) {
		if (polygon instanceof Polygon) {
			if (polygon._center !== undefined)
				this._center = polygon._center.clone();
			this._r = polygon._r;

			this._vertices = new Array(polygon._vertices.length);
			for (let vert of polygon._vertices) {
				this._vertices.push(vert.clone());
			}
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
		if (!(other instanceof Polygon) || this._vertices.length !== other._vertices.length)
			return false;

		for (let i = 0; i < this._vertices.length; i++) {
			if (!this._vertices[i].equals(other._vertices[i]))
				return false;
		}

		return true;
	}

	getBoundingCircle(): Circle {
		return new Circle(this.getCenter(), this._getRadius());
	};

	getCenter(): Vector {
		if (this._center === undefined) {
			let x = 0;
			let y = 0;

			for (let vert of this._vertices) {
				x += vert.x;
				y += vert.y;
			}

			let length = this._vertices.length;
			this._center = new Vector(x / length, y / length);
		}

		return this._center.clone();
	}

	_getRadius(): number {
		if (this._r === undefined) {
			let c = this.getCenter();
			let r = 0;
			for (let i = 0; i < this._vertices.length; i++) {
				let v = this._vertices[i];
				let tmp_r = (v.x - c.x) * (v.x - c.x) + (v.y - c.y) * (v.y - c.y);
				if (tmp_r > r)
					r = tmp_r;
			}

			this._r = Math.sqrt(r);
		}

		return this._r;
	}

	getShapeId(): number {
		return ShapeId.Polygon;
	}

	getVertices(): Vector[] {
		return this._vertices.slice();
	}

	isConvex(): Boolean {
		let vs = this._vertices;
		if (vs.length < 3)
			throw "Polygon must have 3 or more vertices!";

		let p1 = vs[vs.length - 2];
		let p2 = vs[vs.length - 1];
		let d1 = p1.angleTo(p2);
		let totalAngle = 0;
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
			totalAngle += angle;
			if (totalAngle > twoPi)
				return false;
		}

		return true;
	}

	setCenter(center: Vector): this;
	setCenter(x: number, y: number): this;
	setCenter(x: any, y?: number): this {
		let center = x instanceof Vector ? x : new Vector(x, y as number);
		let offset = center.clone().subtract(this.getCenter());

		this._center = center;
		for (let vert of this._vertices) {
			vert.add(offset);
		}

		return this;
	}

	toString(): string {
		let s = "Polygon(";

		for (let vert of this._vertices) {
			s += `<${vert.x},${vert.y}>,`;
		}

		return s.slice(0, -1) + ")";
	}

	transform(matrix: Matrix): this {
		for (let vert of this._vertices) {
			vert.transform(matrix);
		}

		// invalidate caches
		this._center = undefined;
		this._r = undefined;

		return this;
	}
};
