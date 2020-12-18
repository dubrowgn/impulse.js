import { Clone, ToJson, toString, ToString } from "../lib";
import { Frame, FrameJson } from "./frame";

export interface AnimationJson {
	frames: FrameJson[];
};

export class Animation implements Clone, ToJson, ToString {
	frames!: Frame[];

	constructor(anim: Animation);
	constructor(frames: Frame[]);
	constructor(frames: any) {
		this._set(frames);
	}

	clone(): Animation {
		return new Animation(this);
	}

	static fromJson(data: AnimationJson): Animation {
		let { frames } = data;
		return new Animation(
			frames.map(Frame.fromJson)
		);
	}

	set(anim: Animation): this;
	set(frames: Frame[]): this;
	set(frames: any): this {
		return this._set(frames);
	}

	private _set(frames: Frame[]): this {
		if (frames instanceof Animation)
			({ frames } = frames);

		this.frames = frames as Frame[];

		return this;
	}

	toJson(): AnimationJson {
		let { frames } = this;
		return {
			frames: frames.map(f => f.toJson())
		};
	}

	toJSON(): AnimationJson { return this.toJson(); };
	toString(): string { return toString.call(this); }
};
