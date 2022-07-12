import { Clone, ToJson, toString, ToString } from "../lib";

export interface FrameJson {
	attack: boolean;
	image: string;
	length: number;
	sound?: string;
	x: number;
	y: number;
};

/** @deprecated */
export class Frame implements Clone, ToJson, ToString {
	attack!: boolean;
	image!: string;
	length!: number;
	sound?: string;
	x!: number;
	y!: number;

	constructor(frame: Frame);
	constructor(attack: boolean, image: string, length: number, sound: string | undefined, x: number, y: number);
	constructor(attack: any, image?: string, length?: number, sound?: string, x?: number, y?: number) {
		this._set(attack, image, length, sound, x, y);
	}

	clone(): Frame {
		return new Frame(this);
	}

	static fromJson(data: FrameJson): Frame {
		let { attack, image, length, sound, x, y } = data;
		return new Frame(attack, image, length, sound, x, y);
	}

	set(frame: Frame): this;
	set(attack: boolean, image: string, length: number, sound: string | undefined, x: number, y: number): this;
	set(attack: any, image?: string, length?: number, sound?: string, x?: number, y?: number): this {
		return this._set(attack, image, length, sound, x, y);
	}

	private _set(attack: any, image?: string, length?: number, sound?: string, x?: number, y?: number): this {
		if (attack instanceof Frame)
			({ attack, image, length, sound, x, y } = attack);

		this.attack = attack as boolean;
		this.image = image as string;
		this.length = length as number;
		this.sound = sound as string;
		this.x = x as number;
		this.y = y as number;

		return this;
	}

	toJson(): FrameJson {
		let { attack, image, length, sound, x, y } = this;
		return { attack, image, length, sound, x, y };
	}

	toJSON(): FrameJson { return this.toJson(); };
	toString(): string { return toString.call(this); }
};
