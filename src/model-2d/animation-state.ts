import { Matrix } from "../shape-2d/matrix"
import { Rect } from "../shape-2d/rect"

export class AnimationState {
	frameRect: Rect;
	image: HTMLImageElement;
	matrix: Matrix;

	constructor(frameRect: Rect, image: HTMLImageElement, matrix: Matrix) {
		this.frameRect = frameRect;
		this.image = image;
		this.matrix = matrix;
	};
};
