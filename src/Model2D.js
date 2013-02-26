/**
 * @namespace
 */
Impulse.Model2D = (function() {
	var Model2D = {};

	// imports
	var Matrix = Impulse.Shape2D.Matrix;
	var Rect = Impulse.Shape2D.Rect;

	Model2D.Animation = function() {
		/**
		 * Creates a new Animation object.
		 * @class A class for storing and manipulating a sprite animation
		 *
		 * @public
		 * @constructor
		 * @sig Animation(Rect, Number, Number)
		 * @sig Animation(Rect, Number, Number, Matrix2D)
		 * @param {Rect} firstFrameRect
		 * @param {Number} numberOfFrames
		 * @param {Number} duration - animation duration in ms
		 * @param {Matrix} [matrix]
		 * @returns {Animation} Returns a new Animation.
		 */
		var Animation = function(firstFrameRect, numberOfFrames, duration, matrix) {
			this._firstFrameRect = firstFrameRect;
			this._numberOfFrames = numberOfFrames;
			this._frameDuration = duration / numberOfFrames;
			this.matrix = (matrix === undefined ? new Matrix() : matrix).preScale(1, -1);
		}; // class Animation

		Animation.prototype._firstFrameRect = undefined;
		Animation.prototype._frameDuration = undefined;
		Animation.prototype._numberOfFrames = undefined;
		Animation.prototype.matrix = undefined;

		/**
		 * Returns the correct frame Rect from this animation for the specified point in time.
		 *
		 * @public
		 * @sig getFrameRect(Number)
		 * @param {Number} time - time of animation in ms
		 * @returns {Rect} Returns new frame Rect
		 */
		Animation.prototype.getFrameRect = function(time) {
			var frame = ((time / this._frameDuration) | 0) % this._numberOfFrames;
			return new Rect(
				this._firstFrameRect.x + this._firstFrameRect.w * frame,
				this._firstFrameRect.y,
				this._firstFrameRect.w,
				this._firstFrameRect.h);
		}; // GetFrameRect( )

		return Animation;
	};

	Model2D.AnimationState = function() {
		var AnimationState = function(frameRect, image, matrix) {
			this.frameRect = frameRect;
			this.image = image;
			this.matrix = matrix;
		};

		AnimationState.prototype.frameRect = undefined;
		AnimationState.prototype.image = undefined;
		AnimationState.prototype.matrix = undefined;

		return AnimationState;
	};

	Model2D.Model = function() {
		// Model Model(HTMLImage);
		var Model = function(_img) {
			this.animations = [];
			this.image = _img;
		}; // class Model

		Model.prototype.animations = undefined;
		Model.prototype.image = undefined;

		return Model;
	};

	Model2D.ModelState = function() {
		var AnimationState = Model2D.AnimationState;

		var ModelState = function(model) {
			this._model = model;
		};

		ModelState.prototype._model = undefined;
		ModelState.prototype._animation = undefined;
		ModelState.prototype._animationPaused = false;
		ModelState.prototype._animationTime = 0;

		ModelState.prototype.getAnimationState = function(currentTimeMs) {
			// make sure we have an animation assigned
			if (this._animation === undefined)
				return undefined;

			// only advance animation time if the animation isn't paused
			this._animationTime += this._animationPaused ? 0 : currentTimeMs - this._animationTime;

			// return the current animation state
			return new AnimationState(
				this._animation.getFrameRect(this._animationTime),
				this._model.image,
				this._animation.matrix.clone()
			);
		};

		ModelState.prototype.playAnimation = function(animationID) {
			this._animation = this._model.animations[animationID];
			this._animationTime = 0;
		};

		ModelState.prototype.pauseAnimation = function() {
			this._animationPaused = true;
		};

		ModelState.prototype.resumeAnimation = function() {
			this._animationPaused = false;
		};

		ModelState.prototype.stopAnimation = function() {
			this._animationPaused = true;
			this._animationTime = 0;
		};

		ModelState.prototype.isAnimationPaused = function() {
			return this._animationPaused;
		};

		ModelState.prototype.isAnimationStopped = function() {
			return this._animationPaused && this._animationTime == 0;
		};

		ModelState.prototype.playSound = function(soundID) {
			throw "not implemented";
		};

		ModelState.prototype.pauseSound = function(soundID) {
			throw "not implemented";
		};

		ModelState.prototype.pauseSounds = function() {
			throw "not implemented";
		};

		ModelState.prototype.resumeSound = function(soundID) {
			throw "not implemented";
		};

		ModelState.prototype.resumeSounds = function() {
			throw "not implemented";
		};

		ModelState.prototype.stopSound = function(soundID) {
			throw "not implemented";
		};

		ModelState.prototype.stopSounds = function() {
			throw "not implemented";
		};

		ModelState.prototype.isSoundPaused = function(soundID) {
			throw "not implemented";
		};

		ModelState.prototype.isSoundStopped = function(soundID) {
			throw "not implemented";
		};

		ModelState.prototype.areSoundsPaused = function() {
			throw "not implemented";
		};

		ModelState.prototype.areSoundsStopped = function() {
			throw "not implemented";
		};

		return ModelState;
	};

	// init in the correct order
	Model2D.Animation = Model2D.Animation();
	Model2D.AnimationState = Model2D.AnimationState();
	Model2D.Model = Model2D.Model();
	Model2D.ModelState = Model2D.ModelState();

	return Model2D;
});