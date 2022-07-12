import { Clone, ToJson, toString, ToString } from "../lib";
import { Matrix, MatrixJson } from "../shape-2d/matrix";

export interface ImageJson {
	fps: number;
	matrix: MatrixJson;
	path: string;
	tileH: number;
	tileW: number;
};

/** @deprecated */
export class Image implements Clone, ToJson, ToString {
	fps!: number;
	matrix!: Matrix;
	path!: string;
	tileH!: number;
	tileW!: number;

	constructor(image: Image);
	constructor(fps: number, matrix: Matrix, path: string, tileW: number, tileH: number);
	constructor(fps: any, matrix?: Matrix, path?: string, tileW?: number, tileH?: number) {
		this._set(fps, matrix, path, tileW, tileH);
	}

	clone(): Image {
		return new Image(this);
	}

	static fromJson(data: ImageJson): Image {
		let { fps, matrix, path, tileH, tileW } = data;
		return new Image(
			fps,
			Matrix.fromJson(matrix),
			path,
			tileW,
			tileH,
		);
	}

	set(image: Image): this;
	set(fps: number, matrix: Matrix, path: string, tileW: number, tileH: number): this;
	set(fps: any, matrix?: Matrix, path?: string, tileW?: number, tileH?: number): this {
		return this._set(fps, matrix, path, tileW, tileH);
	}

	private _set(fps: any, matrix?: Matrix, path?: string, tileW?: number, tileH?: number): this {
		if (fps instanceof Image)
			({ fps, matrix, path, tileH, tileW } = fps);

		this.fps = fps as number;
		this.matrix = (matrix as Matrix).clone();
		this.path = path as string;
		this.tileH = tileH as number;
		this.tileW = tileW as number;

		return this;
	}

	toJson(): ImageJson {
		let { fps, matrix, path, tileH, tileW } = this;
		return {
			fps,
			matrix: matrix.toJson(),
			path,
			tileH,
			tileW,
		};
	}

	toJSON(): ImageJson { return this.toJson(); };
	toString(): string { return toString.call(this); }
};
