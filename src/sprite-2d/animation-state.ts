import { Animation } from "./animation";
import { Frame } from "./frame";
import { Matrix } from "../shape-2d/matrix";
import { Rect } from "../shape-2d/rect";
import { Event } from "../util/event";
import { SpriteSheet } from "./sprite-sheet";

const missingPath = "data:image/png;base64," +
	"iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEVmZmaZmZ" +
	"moZ+Z2AAAAEElEQVQI12Ng+M+AFeEQBgB+vw/xWs16mgAAAABJRU5ErkJggg==";
const missingAnimation = new Animation([new Frame(1, 0)], 0);
missingAnimation.spriteSheet =
	new SpriteSheet(new Map(), new Matrix().translate(-8, 8), missingPath, 16, 16);

export interface AnimationUpdate {
	frameRect: Rect;
	img: HTMLImageElement;
	matrix: Matrix;
};

export class AnimationState extends Event<(name: string) => void> {
	protected anim: Animation = missingAnimation;
	protected idx: number = 0;
	paused: boolean = false;
	protected seconds: number = 0;

	constructor(anim: Animation) {
		super();
		this.animation = anim;
	}

	get animation() { return this.anim; }
	set animation(anim: Animation) {
		this.anim = anim;
		this.reset();
	}

	protected buildUpdate(frame: Frame): AnimationUpdate {
		let { matrix, img, tileH, tileW } = this.anim.spriteSheet;
		let { tileY } = this.anim;
		let { tileX } = frame;
		let frameRect = new Rect(tileX * tileW, tileY * tileH, tileW, tileH);

		return { frameRect, img, matrix: matrix.clone() };
	}

	advance(seconds: number): AnimationUpdate {
		let frame = this.anim.frames[this.idx];
		if (this.paused)
			return this.buildUpdate(frame);

		this.seconds += seconds;

		while (this.seconds > frame.seconds) {
			this.idx++;
			if (this.idx === this.anim.frames.length)
				this.idx = 0;

			frame = this.anim.frames[this.idx];
			this.seconds -= frame.seconds;
			if (frame.event !== undefined)
				this.dispatch(frame.event);
		}

		return this.buildUpdate(frame);
	}

	reset() {
		this.idx = 0;
		this.seconds = 0;
	}
};
