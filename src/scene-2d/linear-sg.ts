import { Entity } from "./entity";
import { SceneGraph } from "./scene-graph";
import { shapeVsShape, shapeVsShapeSat } from "../shape-2d/intersect";
import { Shape2d } from "../shape-2d/shape-2d";
import { Vector } from "../shape-2d/vector";

function matches_flags(query_flags: number, flags: number, useOr: boolean) {
	if (query_flags === 0)
		return true;

	let common_flags = query_flags & flags;
	return useOr ? common_flags > 0 : common_flags === query_flags;
}

export class LinearSg implements SceneGraph {
	protected entities: Entity[] = [];

	addEntity(ent: Entity): this {
		this.entities.push(ent);
		return this;
	}

	clear(): this {
		this.entities = [];
		return this;
	}

	getMtv(ent: Entity, flags?: number, useOr?: boolean): Vector;
	getMtv(shape: Shape2d, flags?: number, useOr?: boolean): Vector;
	getMtv(shape: any, flags: number = 0, useOr: boolean = true): Vector {
		let entity = undefined;
		if (shape instanceof Entity) {
			entity = shape;
			shape = shape.getCollidable();
		}

		let mtv = new Vector(0, 0);
		for (let ent of this.entities) {
			if (ent === entity)
				continue;

			if (!matches_flags(flags, ent.flags, useOr))
				continue;

			let localMtv = shapeVsShapeSat(shape, ent.getCollidable());
			if (localMtv !== undefined)
				mtv.add(localMtv);
		}

		return mtv;
	}

	query(flags: number = 0, useOr: boolean = true): Entity[] {
		let found = [];
		for (let ent of this.entities) {
			if (matches_flags(flags, ent.flags, useOr))
				found.push(ent);
		}

		return found;
	}

	queryCenterIn(ent: Entity, flags?: number, useOr?: boolean): Entity[];
	queryCenterIn(shape: Shape2d, flags?: number, useOr?: boolean): Entity[];
	queryCenterIn(shape: any, flags: number = 0, useOr: boolean = true): Entity[] {
		let entity = undefined;
		if (shape instanceof Entity) {
			entity = shape;
			shape = shape.getCollidable();
		}
		let center = shape.getCenter();

		let found = [];
		for (let ent of this.entities) {
			if (ent === entity)
				continue;

			if (!matches_flags(flags, ent.flags, useOr))
				continue;

			if (shapeVsShape(center, ent.getCollidable()))
				found.push(ent);
		}

		return found;
	}

	queryContainedIn(ent: Entity, flags?: number, useOr?: boolean): Entity[];
	queryContainedIn(shape: Shape2d, flags?: number, useOr?: boolean): Entity[];
	queryContainedIn(shape: any, flags: number = 0, useOr: boolean = true): Entity[] {
		throw "Not implemented!";
	}

	queryIntersectWith(ent: Entity, flags?: number, useOr?: boolean): Entity[];
	queryIntersectWith(shape: Shape2d, flags?: number, useOr?: boolean): Entity[];
	queryIntersectWith(shape: any, flags: number = 0, useOr: boolean = true): Entity[] {
		let entity = undefined;
		if (shape instanceof Entity) {
			entity = shape;
			shape = shape.getCollidable();
		}

		let found = [];
		for (let ent of this.entities) {
			if (ent === entity)
				continue;

			if (!matches_flags(flags, ent.flags, useOr))
				continue;

			if (shapeVsShape(shape, ent.getCollidable()))
				found.push(ent);
		}

		return found;
	}

	queryOutsideOf(ent: Entity, flags?: number, useOr?: boolean): Entity[];
	queryOutsideOf(shape: Shape2d, flags?: number, useOr?: boolean): Entity[];
	queryOutsideOf(shape: any, flags: number = 0, useOr: boolean = true): Entity[] {
		throw "Not implemented!";
	}

	removeEntity(ent: Entity): this {
		let index = this.entities.indexOf(ent);
		if (index >= 0)
			this.entities.splice(index, 1);

		return this;
	}
};
