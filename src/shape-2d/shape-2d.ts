import { Matrix } from "./matrix";
import { Vector } from "./vector";

export interface Shape2D<ImplType> {
	transform: (matrix: Matrix) => ImplType;
	clone: () => ImplType;
	equals: (other: any) => boolean;
	getCenter: () => Vector;
	getShapeId: () => number;
	setCenter: (x: number, y: number) => ImplType;
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
