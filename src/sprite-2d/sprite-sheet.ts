import { Animation, AnimationJson } from "./animation";
import { images } from "../asset/image-cache";
import { Clone, mapToObjF, objToMapF, ToJson, toString, ToString } from "../lib";
import { Matrix, MatrixJson } from "../shape-2d/matrix";

export interface SpriteSheetJson {
	anims: Record<string, AnimationJson>;
	matrix: MatrixJson;
	path: string;
	tileH: number;
	tileW: number;
};

export class SpriteSheet implements Clone, ToJson, ToString {
	anims!: Map<string, Animation>;
	matrix!: Matrix;
	img!: HTMLImageElement;
	tileH!: number;
	tileW!: number;

	constructor(sheet: SpriteSheet);
	constructor(anims: Map<string, Animation>, matrix: Matrix, path: string, tileW: number, tileH: number);
	constructor(anims: any, matrix?: Matrix, path?: string, tileW?: number, tileH?: number) {
		this._set(anims, matrix, path, tileW, tileH);
	}

	clone(): SpriteSheet {
		return new SpriteSheet(this);
	}

	static fromJson(data: SpriteSheetJson): SpriteSheet {
		let { anims, matrix, path, tileH, tileW } = data;
		let sheet = new SpriteSheet(
			objToMapF(anims, Animation.fromJson),
			Matrix.fromJson(matrix),
			path,
			tileW,
			tileH,
		);

		for (let anim of sheet.anims.values()) {
			anim.spriteSheet = sheet;
		}

		return sheet;
	}

	set(sheet: SpriteSheet): this;
	set(anims: Map<string, Animation>, matrix: Matrix, path: string, tileW: number, tileH: number): this;
	set(anims: any, matrix?: Matrix, path?: string, tileW?: number, tileH?: number): this{
		return this._set(anims, matrix, path, tileW, tileH);
	}

	private _set(anims: any, matrix?: Matrix, path?: string, tileW?: number, tileH?: number): this {
		if (anims instanceof SpriteSheet) {
			({ anims, matrix, tileH, tileW } = anims);
			path = anims.img.src;
		}

		this.anims = anims;
		this.matrix = (matrix as Matrix).clone();
		this.img = images.get(path as string);
		this.tileH = tileH as number;
		this.tileW = tileW as number;

		return this;
	}

	toJson(): SpriteSheetJson {
		let { anims, matrix, img, tileH, tileW } = this;
		return {
			anims: mapToObjF(anims, a => a.toJson()),
			matrix: matrix.toJson(),
			path: img.src,
			tileH,
			tileW,
		};
	}

	toJSON(): SpriteSheetJson { return this.toJson(); };
	toString(): string { return toString.call(this); }
};
