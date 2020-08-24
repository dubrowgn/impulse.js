import { Matrix, MatrixData } from "../shape-2d/matrix"
import { Rect, RectData } from "../shape-2d/rect"

interface AnimationData {
	duration: number,
	frames: number,
	matrix: MatrixData,
	rect: RectData,
};

export class Animation {
	protected firstFrameRect: Rect;
	protected frameDuration: number;
	protected numberOfFrames: number;

	matrix: Matrix;

	/**
	 * Creates a new Animation object.
	 * @class A class for storing and manipulating a sprite animation
	 *
	 * @public
	 * @constructor
	 * @sig Animation(Rect, Number, Number)
	 * @sig Animation(Rect, Number, Number, Matrix2D)
	 * @param {Rect} first_frame_rect
	 * @param {Number} frame_count
	 * @param {Number} duration_ms - animation duration in ms
	 * @param {Matrix} [matrix]
	 * @returns {Animation} Returns a new Animation.
	 */
	constructor(
		first_frame_rect: Rect, frame_count: number,
		duration_ms: number, matrix: Matrix = new Matrix()
	) {
		this.firstFrameRect = first_frame_rect;
		this.numberOfFrames = frame_count;
		this.frameDuration = duration_ms / frame_count;
		this.matrix = matrix.preScale(1, -1);
	}

	/**
	 * export( )
	 *
	 * Returns a generic object containing the current state of this
	 * animation. This is useful for storing state via JSON for example.
	 *
	 * @public
	 * @sig public {Object} export();
	 * @return {Object}
	 */
	export(): AnimationData {
		return {
			duration: this.frameDuration * this.numberOfFrames,
			frames: this.numberOfFrames,
			matrix: this.matrix.export(),
			rect: this.firstFrameRect.export(),
		};
	}

	/**
	 * Returns the correct frame Rect from this animation for the specified point in time.
	 *
	 * @public
	 * @sig getFrameRect(Number)
	 * @param {Number} time - time of animation in ms
	 * @returns {Rect} Returns new frame Rect
	 */
	getFrameRect(time: number): Rect {
		let frame = ((time / this.frameDuration) | 0) % this.numberOfFrames;
		return new Rect(
			this.firstFrameRect.x + this.firstFrameRect.w * frame,
			this.firstFrameRect.y,
			this.firstFrameRect.w,
			this.firstFrameRect.h
		);
	}

	/**
	 * toJSON( )
	 *
	 * Returns a JSON ready copy of this object's current state.
	 * @return {Object}
	 */
	toJSON = Animation.prototype.export;

	/**
	 * import( )
	 *
	 * Creates a new animation with an internal state equal to the values of
	 * the passed generic object. This is useful for restoring state from
	 * JSON for example.
	 *
	 * @public
	 * @static
	 * @sig public {Animation} import({Object});
	 * @param  {Object} obj
	 * @return {Animation}
	 */
	static import = function(obj: AnimationData): Animation {
		return new Animation(
			Rect.import(obj.rect),
			obj.frames,
			obj.duration,
			Matrix.import(obj.matrix)
		);
	}
};
