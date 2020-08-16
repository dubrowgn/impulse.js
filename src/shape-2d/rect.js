import { Shape2D, ShapeId } from "./shape-2d";
import { Vector } from "./vector";

export const Rect = (function() {
	// Rect(Rect);
	// Rect(Number, Number, Number, Number);
	var Rect = function(x, y, w, h) {
		if (x instanceof Rect) {
			this.h = x.h;
			this.w = x.w;
			this.x = x.x;
			this.y = x.y;
		} else {
			this.h = h;
			this.w = w;
			this.x = x;
			this.y = y;
		} // else
	}; // class Rect

	//Rect.prototype = new Shape2D();
	Rect.prototype.h = 1;
	Rect.prototype.w = 1;
	Rect.prototype.x = -0.5;
	Rect.prototype.y = 0.5;

	// Rect applyTransform(Matrix);
	Rect.prototype.applyTransform = function(matrix) {
		// transform center
		var tmp = this.getCenter();
		tmp.applyTransform(matrix);
		this.setCenter(tmp);

		// scale dimensions
		tmp = matrix.getScale();
		this.h *= tmp.y;
		this.w *= tmp.x;

		return this;
	}; // applyTransform( )

	// Rect clone();
	Rect.prototype.clone = function() {
		return new Rect(this);
	} // clone( )

	// Boolean equals(Rect);
	Rect.prototype.equals = function(rect) {
		return (rect instanceof Rect &&
			this.x == rect.x &&
			this.y == rect.y &&
			this.w == rect.w &&
			this.h == rect.h);
	} // equals( )

	/**
	 * export( )
	 *
	 * Returns a generic object containing the current state of this rect.
	 * This is useful for storing state via JSON for example.
	 *
	 * @public
	 * @sig public {Object} export();
	 * @return {Object}
	 */
	Rect.prototype.export = function() {
		return {
			x: this.x,
			y: this.y,
			w: this.w,
			h: this.h
		};
	}; // export( )

	// Vector getCenter();
	Rect.prototype.getCenter = function() {
		return new Vector(this.x + this.w/2, this.y - this.h/2);
	}; // getCenter( )

	// Number getShapeID();
	Rect.prototype.getShapeID = function() {
		return ShapeId.Rect;
	}; // getShapeID( )

	Rect.prototype.getVertices = function() {
		return [
			new Vector(this.x, this.y),
			new Vector(this.x + this.w, this.y),
			new Vector(this.x + this.w, this.y - this.h),
			new Vector(this.x, this.y - this.h)
		];
	}; // getVertices( )

	// Rect setCenter(Vector);
	Rect.prototype.setCenter = function(x, y) {
		if (x instanceof Vector) {
			this.x = x.x - this.w/2;
			this.y = x.y + this.h/2;
		} else {
			this.x = x - this.w/2;
			this.y = y + this.h/2;
		} // if/else

		return this;
	} // setCenter( )

	/**
	 * toJSON( )
	 *
	 * Returns a JSON ready copy of this object's current state.
	 * @return {Object}
	 */
	Rect.prototype.toJSON = Rect.prototype.export;

	// String toString();
	Rect.prototype.toString = function() {
		return "Rect(" + this.x + ", " + this.y + ", " + this.w + ", " + this.h + ")";
	} // toString( )

	/**
	 * import( )
	 *
	 * Creates a new rect with an internal state equal to the values of the
	 * passed generic object. This is useful for restoring state from JSON
	 * for example.
	 *
	 * @public
	 * @static
	 * @sig public {Rect} import({Object});
	 * @param  {Object} obj
	 * @return {Rect}
	 */
	Rect.import = function(obj) {
		return new Rect(obj.x, obj.y, obj.w, obj.h);
	}; // import( )

	return Rect;
})();
