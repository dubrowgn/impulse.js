import { Clone, ToJson, toString, ToString } from "../lib"

export interface SoundJson {
	paths: string[];
};

export class Sound implements Clone, ToJson, ToString {
	paths!: string[];

	constructor(sound: Sound);
	constructor(paths: string[]);
	constructor(paths: any) {
		this._set(paths);
	}

	clone(): Sound {
		return new Sound(this);
	}

	static fromJson(data: SoundJson): Sound {
		let { paths } = data;
		return new Sound(paths);
	}

	set(sound: Sound): this;
	set(paths: string[]): this;
	set(paths: any): this {
		return this._set(paths);
	}

	private _set(paths: string[]): this {
		if (paths instanceof Sound)
			({ paths } = paths);

		this.paths = paths as string[];

		return this;
	}

	toJson(): SoundJson {
		let { paths } = this;
		return { paths };
	}

	toJSON(): SoundJson { return this.toJson(); };
	toString(): string { return toString.call(this); }
};
