import { Animation } from "./animation";
import { Frame } from "./frame";
import { Image } from "./image";
import { Matrix } from "../shape-2d/matrix";
import { Model } from "./model";
import { Sound } from "./sound";
import { Rect } from "../shape-2d/rect";

const missingPath = "data:image/png;base64," +
	"iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEVmZmaZmZ" +
	"moZ+Z2AAAAEElEQVQI12Ng+M+AFeEQBgB+vw/xWs16mgAAAABJRU5ErkJggg==";
const missingImage = new Image(1, new Matrix().translate(-8, 8), missingPath, 16, 16);
const missingAnimation = new Animation([new Frame(false, "missing", 1, undefined, 0, 0)]);

export interface ModelUpdate {
	attack: boolean;
	soundPaths: string[];
	frameRect: Rect;
	imagePath: string;
	matrix: Matrix;
}

export class ModelState {
	public paused: boolean = false;

	protected anim: Animation = missingAnimation;
	protected frameIdx: number = 0;
	protected model: Model;
	protected timeSec: number = 0;

	constructor(model: Model) {
		this.model = model;
	}

	advance(deltaMs: number): ModelUpdate {
		let deltaSec = this.paused ? 0 : deltaMs / 1000;

		let frame = this.anim.frames[this.frameIdx];
		let img = this.lookupImage(frame.image);
		let frameSec = frame.length / img.fps;

		let attack = false;
		let soundPaths = [];

		this.timeSec += deltaSec;
		while (this.timeSec > frameSec) {
			this.timeSec -= frameSec;
			this.frameIdx = (this.frameIdx + 1) % this.anim.frames.length;

			frame = this.anim.frames[this.frameIdx];
			img = this.lookupImage(frame.image);
			frameSec = frame.length / img.fps;

			attack ||= frame.attack;
			if (frame.sound)
				soundPaths.push(this.lookupSoundPath(frame.sound))
		}

		return {
			attack,
			soundPaths,
			frameRect: new Rect(
				frame.x * img.tileW,
				frame.y * img.tileH,
				img.tileW,
				img.tileH
			),
			imagePath: img.path,
			matrix: img.matrix.clone().scale(1, -1),
		};
	}

	protected lookupAnimation(name: string): Animation {
		return this.model.animations[name] ?? missingAnimation;
	}

	protected lookupImage(name: string): Image {
		return this.model.images[name] ?? missingImage;
	}

	protected lookupSoundPath(name: string): string {
		let paths = this.model.sounds[name].paths;
		return paths[Math.random() * paths.length | 0];
	}

	playAnimation(name: string): this {
		this.anim = this.lookupAnimation(name);
		return this.resetAnimation();
	}

	resetAnimation(): this {
		// set animation state to the end of the last frame so
		// advance() can pick up attack/sound in the first frame

		this.frameIdx = this.anim.frames.length - 1;

		let frame = this.anim.frames[this.frameIdx];
		let image = this.lookupImage(frame.image);
		this.timeSec = frame.length * image.fps;

		return this;
	}
};
