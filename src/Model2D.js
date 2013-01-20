/**
 * @namespace
 */
Impulse.Model2D = (function() {
	var Model2D = {};

	// imports
	var Matrix = Impulse.Shape2D.Matrix;
	var Rect = Impulse.Shape2D.Rect;

	Model2D.Animation = (function() {
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
		 * @param {Matrix2D} [matrix]
		 * @returns {Animation} Returns a new Animation.
		 */
		var Animation = function(firstFrameRect, numberOfFrames, duration, matrix) {
			this._firstFrameRect = firstFrameRect;
			this._numberOfFrames = numberOfFrames;
			this._frameDuration = duration / numberOfFrames;
			this.matrix = (matrix === undefined ? new Matrix() : matrix).preScale(1, -1);
		} // class Animation

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
		} // GetFrameRect( )

		return Animation;
	})();

	Model2D.Model = (function() {
		// Model Model(HTMLImage);
		var Model = function(_img) {
			this.animations = [];
			this.image = _img;
		} // class Model

		Model.prototype.animations = undefined;
		Model.prototype.image = undefined;

		return Model;
	})();

	return Model2D;
});