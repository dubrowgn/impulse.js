import { Animation, AnimationJson } from "./animation"
import { Clone, mostCommon, objDiff, objEmpty, objMap, ToJson, toString, ToString } from "../lib"
import { Image, ImageJson } from "./image"
import { Matrix } from "../shape-2d/matrix"
import { Sound, SoundJson } from "./sound"

type AnimationMap = Record<string, Animation>;
type ImageMap = Record<string, Image>;
type SoundMap = Record<string, Sound>;

interface ModelJson {
	animations?: Record<string, AnimationJson>;
	defaults?: {
		animation?: AnimationJson,
		image?: ImageJson,
		sound?: SoundJson,
	};
	images?: Record<string, ImageJson>;
	name: string;
	sounds?: Record<string, SoundJson>;
};

export class Model implements Clone, ToJson, ToString {
	name!: string;
	animations!: AnimationMap;
	images!: ImageMap;
	sounds!: SoundMap;

	constructor(model: Model);
	constructor(name: string, animations: AnimationMap, images: ImageMap, sounds: SoundMap);
	constructor(name: any, animations?: AnimationMap, images?: ImageMap, sounds?: SoundMap) {
		this._set(name, animations, images, sounds);
	}

	clone(): Model {
		return new Model(this);
	}

	static fromJson(data: ModelJson): Model {
		let { animations, defaults, images, name, sounds } = data;
		return new Model(
			name,
			objMap(animations ?? {}, a => Animation.fromJson({ ...defaults?.animation, ...a })),
			objMap(images ?? {}, i => Image.fromJson({ ...defaults?.image, ...i })),
			objMap(sounds ?? {}, s => Sound.fromJson({ ...defaults?.sound, ...s })),
		);
	}

	set(model: Model): this;
	set(name: string, animations: AnimationMap, images: ImageMap, sounds: SoundMap): this;
	set(name: any, animations?: AnimationMap, images?: ImageMap, sounds?: SoundMap): this {
		return this._set(name, animations, images, sounds);
	}

	private _set(name: any, animations?: AnimationMap, images?: ImageMap, sounds?: SoundMap): this {
		if (name instanceof Model)
			({ name, animations, images, sounds } = name);

		this.name = name as string;
		this.animations = animations as AnimationMap;
		this.images = images as ImageMap;
		this.sounds = sounds as SoundMap;

		return this;
	}

	toJson(): ModelJson {
		let { animations, images, name, sounds } = this;

		let animation = mostCommon(Object.values(animations));
		let image = mostCommon(Object.values(images));

		return {
			animations: objEmpty(animation) ?
				undefined :
				objMap(animations, a => objDiff(a.toJSON(), animation)),
			defaults: animation === undefined && image === undefined ?
				undefined :
				{ animation, image },
			images: objEmpty(images) ?
				undefined :
				objMap(images, i => objDiff(i.toJSON(), image)),
			name,
			sounds: objEmpty(sounds) ?
				undefined :
				objMap(sounds, s => s.toJSON()),
		};
	}

	toJSON(): ModelJson { return this.toJson(); };
	toString(): string { return toString.call(this); }
};
