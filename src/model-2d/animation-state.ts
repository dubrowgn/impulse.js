import { Matrix, Rect } from "Shape2D"

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
