import { Clone, ToJson, toString, ToString } from "../lib";

export interface FrameJson {
	event?: string;
	seconds: number;
	tileX: number;
};

export class Frame implements Clone, ToJson, ToString {
	event?: string;
	seconds!: number;
	tileX!: number;

	constructor(frame: Frame);
	constructor(seconds: number, tileX: number, event?: string);
	constructor(seconds: any, tileX?: number, event?: string) {
		this._set(seconds, tileX, event);
	}

	clone(): Frame {
		return new Frame(this);
	}

	static fromJson(data: FrameJson): Frame {
		let { event, seconds, tileX } = data;
		return new Frame(seconds, tileX, event);
	}

	set(frame: Frame): this;
	set(seconds: number, tileX: number, event?: string): this;
	set(seconds: any, tileX?: number, event?: string): this {
		return this._set(seconds, tileX, event);
	}

	private _set(seconds: any, tileX?: number, event?: string): this {
		if (seconds instanceof Frame)
			({ event, seconds, tileX } = seconds);

		this.event = event;
		this.seconds = seconds as number;
		this.tileX = tileX as number;

		return this;
	}

	toJson(): FrameJson {
		let { event, seconds, tileX } = this;
		return { event, seconds, tileX };
	}

	toJSON(): FrameJson { return this.toJson(); };
	toString(): string { return toString.call(this); }
};
