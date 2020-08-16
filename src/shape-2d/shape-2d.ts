import { Matrix } from "./matrix";
import { Vector } from "./vector";

export interface Shape2D {
	transform: (matrix: typeof Matrix) => Shape2D;
	clone: () => Shape2D;
	equals: (other: Shape2D) => boolean;
	getCenter: () => typeof Vector;
	getShapeId: () => number;
	setCenter: (center: typeof Vector) => Shape2D;
	toString: () => string;
};

/**
 * enumeration of shape types and their associated Id's
 *
 * @enum {number}
 * @private
 */
export enum ShapeId {
	Circle = 0,
	Polygon = 1,
	Rect = 2,
	Vector = 3,
};
