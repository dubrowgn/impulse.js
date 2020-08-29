import { Entity } from "../entity";
import { Shape2d } from "../shape-2d/shape-2d";
import { Vector } from "../shape-2d/vector";

export interface SceneGraph {
	addEntity: (ent: Entity) => this;
	clear: () => this;
	getMtv: (shape: Shape2d, flags?: number, useOr?: boolean) => Vector;
	query: (flags?: number, useOr?: boolean) => Entity[];
	queryCenterIn: (shape: Shape2d, flags?: number, useOr?: boolean) => Entity[];
	queryContainedIn: (shape: Shape2d, flags?: number, useOr?: boolean) => Entity[];
	queryIntersectWith: (shape: Shape2d, flags?: number, useOr?: boolean) => Entity[];
	queryOutsideOf: (shape: Shape2d, flags?: number, useOr?: boolean) => Entity[];
	removeEntity: (ent: Entity) => this;
};
