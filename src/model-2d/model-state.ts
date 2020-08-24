import { Animation } from "./animation"
import { AnimationState } from "./animation-state"
import { Model } from "./model"

export class ModelState {
	protected model: Model;
	protected animation?: Animation = undefined;
	protected animationPaused: boolean = false;
	protected animationTime = 0;

	constructor(model: Model) {
		this.model = model;
	}

	getAnimationState(currentTimeMs: number): AnimationState | undefined {
		// make sure we have an animation assigned
		if (this.animation === undefined)
			return undefined;

		// only advance animation time if the animation isn't paused
		if (!this.animationPaused)
			this.animationTime += currentTimeMs - this.animationTime;

		// return the current animation state
		return new AnimationState(
			this.animation.getFrameRect(this.animationTime),
			this.model.image,
			this.animation.matrix.clone()
		);
	}

	playAnimation(animationID: number) {
		this.animation = this.model.animations[animationID];
		this.animationTime = 0;
		return this;
	}

	pauseAnimation(): this {
		this.animationPaused = true;
		return this;
	}

	resumeAnimation(): this {
		this.animationPaused = false;
		return this;
	}

	stopAnimation(): this {
		this.animationPaused = true;
		this.animationTime = 0;
		return this;
	}

	isAnimationPaused(): boolean {
		return this.animationPaused;
	}

	isAnimationStopped(): boolean {
		return this.animationPaused && this.animationTime == 0;
	}

	playSound(soundID: number): this {
		throw "not implemented";
	}

	pauseSound(soundID: number): this {
		throw "not implemented";
	}

	pauseSounds(): this {
		throw "not implemented";
	}

	resumeSound(soundID: number): this {
		throw "not implemented";
	}

	resumeSounds(): this {
		throw "not implemented";
	}

	stopSound(soundID: number): this {
		throw "not implemented";
	}

	stopSounds(): this {
		throw "not implemented";
	}

	isSoundPaused(soundID: number) {
		throw "not implemented";
	}

	isSoundStopped(soundID: number) {
		throw "not implemented";
	}

	areSoundsPaused(): boolean {
		throw "not implemented";
	}

	areSoundsStopped(): boolean {
		throw "not implemented";
	}
};
