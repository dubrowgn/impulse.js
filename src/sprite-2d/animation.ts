import { Clone, ToJson, toString, ToString } from "../lib";
import { Frame, FrameJson } from "./frame";
import { SpriteSheet } from "./sprite-sheet";

export interface AnimationJson {
	frames: FrameJson[];
	tileY: number;
};

export class Animation implements Clone, ToJson, ToString {
	frames!: Frame[];
	spriteSheet!: SpriteSheet;
	tileY!: number;

	constructor(anim: Animation);
	constructor(frames: Frame[], tileY: number);
	constructor(frames: any, tileY?: number) {
		this._set(frames, tileY);
	}

	clone(): Animation {
		return new Animation(this);
	}

	static fromJson(data: AnimationJson): Animation {
		let { frames, tileY } = data;
		return new Animation(
			frames.map(Frame.fromJson),
			tileY,
		);
	}

	set(anim: Animation): this;
	set(frames: Frame[], tileY: number): this;
	set(frames: any, tileY?: number): this {
		return this._set(frames, tileY);
	}

	private _set(frames: Frame[], tileY?: number): this {
		if (frames instanceof Animation)
			({ frames, tileY } = frames);

		this.frames = frames as Frame[];
		this.tileY = tileY as number;

		return this;
	}

	toJson(): AnimationJson {
		let { frames, tileY } = this;
		return {
			frames: frames.map(f => f.toJson()),
			tileY,
		};
	}

	toJSON(): AnimationJson { return this.toJson(); };
	toString(): string { return toString.call(this); }
};
