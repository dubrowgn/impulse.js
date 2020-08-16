import { Shape2D, ShapeId } from "./shape-2d";
import { Vector } from "./vector";

export const Circle = (function() {
	/**
	 * A simple circle class
	 *
	 * Circle Circle(Circle);
	 * Circle Circle(Number, Number, Number);
	 * Circle Circle(Vector, Number);
	 *
	 * @public
	 * @constructor
	 * @param x {Circle|number|Vector}
	 * @param y {number=}
	 * @param r {number=}
	 */
	var Circle = function(x, y, r) {
		if (x instanceof Circle) {
			this.x = x.x;
			this.y = x.y;
			this.r = x.r;
		} else if (x instanceof Vector) {
			this.x = x.x;
			this.y = x.y;
			this.r = y;
		} else {
			this.x = x;
			this.y = y;
			this.r = r;
		} // else
	}; // class Circle

	//Circle.prototype = new Shape2D();
	Circle.prototype.x = 0;
	Circle.prototype.y = 0;
	Circle.prototype.r = 1;

	// Circle applyTransform();
	Circle.prototype.applyTransform = function(matrix) {
		var tmp = this.x;
		this.x = matrix.a * tmp + matrix.c * this.y + matrix.e;
		this.y = matrix.b * tmp + matrix.d * this.y + matrix.f;

		tmp = matrix.getScale();
		if (tmp.x != tmp.y)
			throw "Non-uniform scaling cannot be applied to type Circle";
		this.r *= tmp.x;

		return this;
	}; // applyTransform( )

	// Circle clone();
	Circle.prototype.clone = function() {
		return new Circle(this);
	}; // clone( )

	// bool equals(Circle);
	Circle.prototype.equals = function(cir) {
		return (cir instanceof Circle &&
			this.x == cir.x &&
			this.y == cir.y &&
			this.r == cir.r);
	}; // equals( )

	// Point getCenter();
	Circle.prototype.getCenter = function() {
		return new Vector(this.x, this.y);
	}; // getCenter( )

	// Number getShapeID();
	Circle.prototype.getShapeID = function() {
		return ShapeId.Circle;
	}; // getShapeID( )

	// Circle setCenter(Vector);
	// Circle setCenter(Number, Number);
	Circle.prototype.setCenter = function(x, y) {
		if (x instanceof Vector) {
			this.x = x.x;
			this.y = x.y;
		} else {
			this.x = x;
			this.y = y;
		} // if/else

		return this;
	}; // setCenter( )

	// string toString();
	Circle.prototype.toString = function() {
		return "Circle(" + this.x + ", " + this.y + ", " + this.r + ")";
	}; // toString( )

	return Circle;
})();
