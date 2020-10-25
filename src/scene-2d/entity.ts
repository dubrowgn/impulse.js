import { EventDelegate } from "../util/event-delegate";
import { EventedCollection } from "../util/evented-collection";
import { Matrix } from "../shape-2d/matrix";
import { Model } from "../model-2d/model";
import { ModelState, ModelUpdate } from "../model-2d/model-state";
import { Shape2d } from "../shape-2d/shape-2d";
import { Vector } from "../shape-2d/vector";

export class Entity {
	protected collidable: Shape2d;
	protected matrix: Matrix;
	protected scale: number = 1; // FIXME???

	children: EventedCollection;
	flags: number;
	modelState: ModelState;
	moved: EventDelegate; // event(Entity2D, {dx, dy})
	parent?: Entity;
	rotated: EventDelegate; // event(Entity2D, dRads)

	constructor(model: Model, position: Vector, collidable: Shape2d, parent?: Entity, flags: number = 0) {
		this.children = new EventedCollection();
		this.collidable = collidable;
		this.flags = flags;

		this.matrix = new Matrix(1, 0, 0, 1, position.x, position.y);
		this.modelState = new ModelState(model);
		this.moved = new EventDelegate();
		this.parent = parent;
		this.rotated = new EventDelegate();
	}

	advance(deltaMs: number): ModelUpdate {
		let update = this.modelState.advance(deltaMs);
		update.matrix.combine(this.getMatrix());

		return update;
	}

	face(ent: Entity): this;
	face(vec: Vector): this;
	face(vec: any) {
		if (vec instanceof Entity)
			vec = vec.getPosition();

		let dRads = this.getPosition().angleTo(vec) - this.matrix.getRotation();
		this.matrix.preRotate(dRads);
		this.rotated.dispatch(this, dRads);

		return this;
	}

	getCollidable(): Shape2d {
		return this.collidable.clone().transform(this.matrix);
	}

	getMatrix(): Matrix {
		if (this.parent !== undefined)
			return this.parent.getMatrix().clone().combine(this.matrix);

		return this.matrix;
	};

	getPosition(): Vector {
		return new Vector(this.matrix.e, this.matrix.f);
	}

	getRotation(): number {
		return this.matrix.getRotation();
	}

	MoveForward(dist: number): this {
		let e = {
			dx: (this.matrix.d / this.scale) * dist,
			dy: (this.matrix.b / this.scale) * dist
		};

		this.matrix.e += e.dx;
		this.matrix.f += e.dy;

		this.moved.dispatch(this, e);

		return this;
	}

	rotate(rads: number): this {
		this.matrix.preRotate(rads);
		this.rotated.dispatch(this, rads);

		return this;
	}

	setPosition(ent: Entity): this;
	setPosition(vec: Vector): this;
	setPosition(x: number, y: number): this;
	setPosition(x: any, y?: number): this {
		// FIXME ???
		// seems highly suspicious that we don't take into account for scale
		if (x instanceof Entity)
			x = x.getPosition();

		let e;
		if (x instanceof Vector)
			e = { dx: x.x - this.matrix.e, dy: x.y - this.matrix.f };
		else
			e = { dx: x - this.matrix.e, dy: y as number - this.matrix.f };

		this.matrix.e += e.dx;
		this.matrix.f += e.dy;

		this.moved.dispatch(this, e);

		return this;
	}

	setRotation(rads: number): this {
		let dRads = rads - this.matrix.getRotation();
		this.matrix.preRotate(dRads);
		this.rotated.dispatch(this, dRads);

		return this;
	}

	SetScale(scale: number): this {
		// FIXME ???
		// should probably be an event delegate for scaled...
		this.matrix.preScale(scale / this.scale);
		this.scale = scale;

		return this;
	}

	StrafeRight(dist: number): this {
		let e = {
			dx: (this.matrix.b / this.scale) * dist,
			dy: (this.matrix.d / this.scale) * dist
		};

		this.matrix.e -= e.dx;
		this.matrix.f += e.dy;

		this.moved.dispatch(this, e);

		return this;
	}

	translate(vec: Vector): this;
	translate(x: number, y: number): this;
	translate(x: any, y?: number): this {
		if (x instanceof Vector) {
			this.matrix.e += x.x;
			this.matrix.f += x.y;
			this.moved.dispatch(this, { dx: x.x, dy: x.y });
		} else {
			this.matrix.e += x;
			this.matrix.f += y as number;
			this.moved.dispatch(this, { dx: x, dy: y as number });
		}

		return this;
	}

	translateLocal(vec: Vector): this;
	translateLocal(x: number, y: number): this;
	translateLocal(x: any, y?: number): this {
		let b = this.matrix.b / this.scale;
		let d = this.matrix.d / this.scale;

		let e;
		if (x instanceof Vector)
			e = {
				dx: (d * x.y) - (b * x.x),
				dy: (b * x.y) + (d * x.x)
			};
		else
			e = {
				dx: (d * (y as number)) - (b * x),
				dy: (b * (y as number)) + (d * x)
			};

		this.matrix.e += e.dx;
		this.matrix.f += e.dy;

		this.moved.dispatch(this, e);

		return this;
	}
};
