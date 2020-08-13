export const IShape = (function() {
	/**
	 * @interface
	 */
	var IShape = function() { }; // class Shape

	// Shape applyTransform();
	IShape.prototype.applyTransform = function() { }; // applyTransform

	// Shape clone();
	IShape.prototype.clone = function() { }; // clone( )

	// Boolean equals();
	IShape.prototype.equals = function() { }; // equals( )

	// Vector getCenter();
	IShape.prototype.getCenter = function() { }; // getCenter( )

	// Number getShapeID();
	IShape.prototype.getShapeID = function() { }; // getShapeID( )

	// Shape setCenter();
	IShape.prototype.setCenter = function() { }; // setCenter( )

	// String toString();
	IShape.prototype.toString = function() { }; // toString( )

	return IShape;
})();

/**
 * enumeration of shape types and their associated Id's
 *
 * @enum {number}
 * @private
 */
export const ShapeId = {
	Circle: 0,
	Polygon: 1,
	Rect: 2,
	Vector: 3,
};
