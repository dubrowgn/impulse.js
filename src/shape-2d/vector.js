import { IShape, ShapeId } from "./shape";

export const Vector = (function() {
	/**
	 * Vector
	 *
	 * @class This is a general purpose 2D vector class
	 *
	 * Vector uses the following form:
	 * <x, y>
	 *
	 * public {Vector} Vector();
	 * public {Vector} Vector(Vector);
	 * public {Vector} Vector(Number, Number);
	 *
	 * @public
	 * @constructor
	 * @param {Vector|Number=0} x
	 * @param {Number=0} y
	 */
	var Vector = function(x, y) {
		if (x instanceof Vector) {
			this.x = x.x;
			this.y = x.y;
		} else if (arguments.length === 0) {
			this.x = this.y = 0;
		} else if (arguments.length === 2) {
			this.x = x;
			this.y = y;
		} else if (arguments.length > 0)
			throw "Unexpected number of arguments for Vector()";
	}; // class Vector

	Vector.shapeID = ShapeId.Vector;
	Vector.prototype = new IShape();
	Vector.prototype.x = 0;
	Vector.prototype.y = 0;

	/**
	 * add( )
	 *
	 * Adds the passed vector to this vector
	 *
	 * public {Vector} add(Vector);
	 *
	 * @public
	 * @param {Vector} vecRH
	 * @returns {Vector} this after adding
	 */
	Vector.prototype.add = function(vecRH) {
		this.x += vecRH.x;
		this.y += vecRH.y;
		return this;
	}; // add( )

	/**
	 * angleBetween( )
	 *
	 * Calculates the angle between the passed vector and this vector, using <0,0> as the point of reference.
	 * Angles returned have the range (−π, π].
	 *
	 * public {Number} angleBetween(Vector);
	 *
	 * @public
	 * @param {Vector} vecRH
	 * @returns {Number} the angle between the two vectors in radians
	 */
	Vector.prototype.angleBetween = function(vecRH) {
		return Math.atan2(this.x * vecRH.y - this.y * vecRH.x, this.x * vecRH.x + this.y * vecRH.y);
	}; // angleBetween( )

	/**
	 * angleTo( )
	 *
	 * Calculates the angle to the passed vector from this vector, using this vector as the point of reference.
	 *
	 * public {Number} angleTo(Vector);
	 *
	 * @public
	 * @param {Vector} vecRH
	 * @returns {Number} the angle to the passed vector in radians
	 */
	Vector.prototype.angleTo = function(vecRH) {
		return Math.atan2(vecRH.y - this.y, vecRH.x - this.x);
	};

	/**
	 * applyTransform( )
	 *
	 * Applies the given matrix transformation onto this Vector.
	 * Inherited from Shape2D.Shape.
	 *
	 * Vector applyTransform();
	 *
	 * @public
	 * @returns {Vector} this vector after applying the given transformation
	 */
	Vector.prototype.applyTransform = function(matrix) {
		var oldX = this.x;
		this.x = matrix.a * oldX + matrix.c * this.y + matrix.e;
		this.y = matrix.b * oldX + matrix.d * this.y + matrix.f;
		return this;
	}; // applyTransform( )

	/**
	 * clone( )
	 *
	 * Creates and exact, numeric copy of this vector
	 *
	 * public {Vector} clone();
	 *
	 * @public
	 * @returns {Vector} the new vector
	 */
	Vector.prototype.clone = function() {
		return new Vector(this);
	}; // clone( )

	/**
	 * distance( )
	 *
	 * Calculates the distance from this vector to the passed vector.
	 *
	 * public {Number} distance(Vector);
	 *
	 * @public
	 * @param {Vector} vecRH
	 * @returns {Number} the distance between the two vectors
	 */
	Vector.prototype.distance = function(vecRH) {
		return Math.sqrt((vecRH.x - this.x) * (vecRH.x - this.x) + (vecRH.y - this.y) * (vecRH.y - this.y));
	}; // distance( )

	/**
	 * distanceSq( )
	 *
	 * Calculates the squared distance from this vector to the passed vector.
	 * This function avoids calculating the square root, thus being slightly faster than .distance( ).
	 *
	 * public {Number} distanceSq(Vector);
	 *
	 * @public
	 * @param {Vector} vecRH
	 * @returns {Number} the squared distance between the two vectors
	 * @see Vector.distance( )
	 */
	Vector.prototype.distanceSq = function(vecRH) {
		return (vecRH.x - this.x) * (vecRH.x - this.x) + (vecRH.y - this.y) * (vecRH.y - this.y);
	}; // distanceSq( )

	/**
	 * divide( )
	 *
	 * Divides this vector by the passed vector.
	 *
	 * public {Vector} divide(Vector);
	 *
	 * @public
	 * @param {Vector} vecRH
	 * @returns {Vector} this vector after dividing
	 */
	Vector.prototype.divide = function(vecRH) {
		this.x /= vecRH.x;
		this.y /= vecRH.y;
		return this;
	}; // divide( )

	/**
	 * dotProduct( )
	 *
	 * Calculates the dot product of this and the passed vectors
	 *
	 * public {Number} dotProduct(Vector);
	 *
	 * @public
	 * @param {Vector} vecRH
	 * @returns {Number} the resultant dot product
	 */
	Vector.prototype.dotProduct = function(vecRH) {
		return this.x * vecRH.x + this.y * vecRH.y;
	}; // dotProduct( )

	/**
	 * equals( )
	 *
	 * Determines if this vector is numerically equivalent to the passed vector.
	 *
	 * public {Boolean} equals(Vector);
	 *
	 * @public
	 * @param {Vector} vecRH
	 * @returns {Boolean} true if the vectors are equivalent
	 */
	Vector.prototype.equals = function(vecRH) {
		return vecRH instanceof Vector &&
			this.x == vecRH.x && this.y == vecRH.y;
	}; // equals( )

	/**
	 * getCenter( )
	 *
	 * Gets the center of this Shape as a 2D Vector.
	 * Inherited from Shape2D.Shape.
	 *
	 * {Vector} getCenter();
	 *
	 * @public
	 * @returns {Vector} the center of this Shape as a 2D Vector
	 */
	Vector.prototype.getCenter = function() {
		return new Vector(this);
	}; // getCenter( )

	/**
	 * getNormal( )
	 *
	 * Calculates a new right-handed normal vector for the line created by this and the passed vectors.
	 *
	 * public {Vector} getNormal([Vector]);
	 *
	 * @public
	 * @param {Vector=<0,0>} [vecRH]
	 * @returns {Vector} the new normal vector
	 */
	Vector.prototype.getNormal = function(vecRH) {
		if (vecRH === undefined)
			return new Vector(-this.y, this.x); // assume vecRH is <0, 0>
		return new Vector(vecRH.y - this.y, this.x - vecRH.x).normalize();
	}; // getNormal( )

	/**
	 * getShapeID( )
	 *
	 * Gets the ShapeID associated with the Vector class
	 *
	 * @public
	 * @sig public {Number} getShapeID();
	 * @returns {Number} the ShapeID associated with the Vector class
	 */
	Vector.prototype.getShapeID = function() {
		return ShapeId.Vector;
	}; // getShapeID( )

	/**
	 * isZero( )
	 *
	 * Determines if this vector is equal to <0,0>
	 *
	 * @public
	 * @sig public {Boolean} isZero();
	 * @returns {Boolean} true if this vector is equal to <0,0>
	 */
	Vector.prototype.isZero = function() {
		return this.x === 0 && this.y ===0;
	}; // isZero( )

	/**
	 * magnitude( )
	 *
	 * Calculates the magnitude of this vector.
	 * Note: Function objects in JavaScript already have a 'length' member, hence the use of magnitude instead.
	 *
	 * @public
	 * @sig public {Number} magnitude();
	 * @returns {Number} the magnitude of this vector
	 */
	Vector.prototype.magnitude = function() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}; // magnitude( )

	/**
	 * magnitudeSq( )
	 *
	 * Calculates the square of the magnitude of this vector.
	 * This function avoids calculating the square root, thus being slightly faster than .magnitude( ).
	 *
	 * @public
	 * @sig public {Number} magnitudeSq();
	 * @returns {Number} the square of the magnitude of this vector
	 * @see Vector.magnitude( )
	 */
	Vector.prototype.magnitudeSq = function() {
		return this.x * this.x + this.y * this.y;
	}; // magnitudeSq( )

	/**
	 * multiply( )
	 *
	 * Multiplies this vector by the passed vector
	 *
	 * @public
	 * @sig public {Vector} multiply(Vector);
	 * @param {Vector} vecRH
	 * @returns {Vector} this vector after multiplying
	 */
	Vector.prototype.multiply = function(vecRH) {
		this.x *= vecRH.x;
		this.y *= vecRH.y;
		return this;
	}; // multiply( )

	/**
	 * negate( )
	 *
	 * Negates this vector (ie. <-x,-y>)
	 *
	 * @public
	 * @sig public {Vector} negate();
	 * @returns {Vector} this vector after negation
	 */
	Vector.prototype.negate = function() {
		this.x = -this.x;
		this.y = -this.y;
		return this;
	}; // negate( )

	/**
	 * normalize( )
	 *
	 * Normalizes this vector (scales the vector so that its new magnitude is 1)
	 * For vectors where magnitude is 0, <0,0> is returned.
	 *
	 * @public
	 * @sig public {Vector} normalize();
	 * @returns {Vector} this vector after normalization
	 */
	Vector.prototype.normalize = function() {
		var lng = Math.sqrt(this.x * this.x + this.y * this.y);

		if (lng !== 0) {
			this.x /= lng;
			this.y /= lng;
		} // else

		return this;
	}; // normalize( )

	/**
	 * perpendicular( )
	 *
	 * Rotates this vector 90°, making it perpendicular to its current orientation
	 *
	 * @public
	 * @sig public {Vector} perpendicular();
	 * @returns {Vector} this vector after rotating 90°
	 */
	Vector.prototype.perpendicular = function() {
		var x = this.x;
		this.x = -this.y;
		this.y = x;

		return this;
	}; // perpendicular( )

	/**
	 * projectOnto( )
	 *
	 * Projects this vector onto vecRH
	 *
	 * projection of a onto b:
	 *
	 * proj.x = (dp / (b.x * b.x + b.y * b.y)) * b.x;
	 * proj.y = (dp / (b.x * b.x + b.y * b.y)) * b.y;
	 *
	 * dp is the dot product of a and b
	 * (b.x * b.x + b.y * b.y) is the magnitude of b squared
	 *
	 * @public
	 * @sig public {Vector} projectOnto(Vector);
	 * @param {Vector} vecRH
	 * @returns {Vector} this vector after projection
	 */
	Vector.prototype.projectOnto = function(vecRH) {
		if (vecRH.isZero()) {
			this.x = this.y = 0;
		} else {
			let k = this.dotProduct(vecRH) / vecRH.magnitudeSq();

			this.x = k * vecRH.x;
			this.y = k * vecRH.y;
		}

		return this;
	}; // projectOnto( )

	/**
	 * rotate( )
	 *
	 * Rotates this vector about its origin by 'rads' radians
	 *
	 * @public
	 * @sig public {Vector} rotate(Number);
	 * @param {Number} rads
	 * @returns {Vector} this vector after rotation
	 */
	Vector.prototype.rotate = function(rads) {
		var x = this.x;
		this.x = x * Math.cos(rads) - this.y * Math.sin(rads);
		this.y = x * Math.sin(rads) - this.y * Math.cos(rads);

		return this;
	}; // rotate( )

	/**
	 * scale( )
	 *
	 * Scales this vector by the passed amount(s)
	 * If scalarY is omitted, scalarX is used for both axes
	 *
	 * @public
	 * @sig public {Vector} scale(Number[, Number]);
	 * @param {Number} scalarX
	 * @param {Number} [scalarY]
	 * @returns {Vector} this after scaling
	 */
	Vector.prototype.scale = function(scalarX, scalarY) {
		if (scalarY === undefined)
			scalarY = scalarX;

		this.x *= scalarX;
		this.y *= scalarY;

		return this;
	}; // scale( )

	/**
	 * scaleToMagnitude( )
	 *
	 * Scales this vector such that its new magnitude is equal to the passed value.
	 *
	 * @public
	 * @sig public {Vector} scaleToMagnitude(Number);
	 * @param {Number} mag
	 * @returns {Vector} this vector after scaling
	 */
	Vector.prototype.scaleToMagnitude = function(mag) {
		if (this.isZero())
			return this;

		let k = mag / this.magnitude();
		this.x *= k;
		this.y *= k;

		return this;
	}; // scaleToMagnitude( )

	/**
	 * setCenter( )
	 *
	 * Sets the values of this vector using a passed vector or pair of numbers.
	 *
	 * @public
	 * @sig public {Vector} setCenter(Vector);
	 * @sig public {Vector} setCenter(Number, Number);
	 * @param {Number|Vector} x
	 * @param {Number} y
	 * @returns {Vector} this vector after setting of values
	 */
	Vector.prototype.setCenter = function(x, y) {
		if (x instanceof Vector) {
			this.x = x.x;
			this.y = x.y;
		} else {
			this.x = x;
			this.y = y;
		} // else

		return this;
	}; // setCenter( )

	/**
	 * subtract( )
	 *
	 * Subtracts the passed vector from this vector.
	 *
	 * @public
	 * @sig public {Vector} subtract(Vector);
	 * @param {Vector} vecRH
	 * @returns {Vector} this vector after subtracting
	 */
	Vector.prototype.subtract = function(vecRH) {
		this.x -= vecRH.x;
		this.y -= vecRH.y;
		return this;
	}; // subtract( )

	/**
	 * toString( )
	 *
	 * Returns a string representation of this vector.
	 *
	 * @public
	 * @sig public {String} toString();
	 * @returns {String}
	 */
	Vector.prototype.toString = function() {
		return "Vector(" + this.x + ", " + this.y + ")";
	}; // toString( )

	/**
	 * translate( )
	 *
	 * Translates (moves) this vector by the passed amounts.
	 * If dy is omitted, dx is used for both axes.
	 *
	 * @public
	 * @sig public {Vector} translate(Number[, Number]);
	 * @param {Number} dx
	 * @param {Number} [dy]
	 * @returns {Vector} this vector after translating
	 */
	Vector.prototype.translate = function(dx, dy) {
		if (dy === undefined)
			dy = dx;

		this.x += dx;
		this.y += dy;

		return this;
	}; // translate( )

	/**
	 * longest( )
	 *
	 * Returns whichever vector is the longest
	 *
	 * @public
	 * @static
	 * @sig public {Vector} longest(Vector, Vector);
	 * @param {Vector} a
	 * @param {Vector} b
	 * @return {Vector} whichever vector is the longest. 'a' is returned if they are equal.
	 */
	Vector.longest = function(a, b) {
		if (a.x * a.x + a.y * a.y >= b.x * b.x + b.y * b.y)
			return a;
		return b;
	}; // longest( )

	/**
	 * shortest( )
	 *
	 * Returns whichever vector is the shortest
	 *
	 * @public
	 * @static
	 * @sig public {Vector} longest(Vector, Vector);
	 * @param {Vector} a
	 * @param {Vector} b
	 * @return {Vector} whichever vector is the shortest. 'a' is returned if they are equal.
	 */
	Vector.shortest = function(a, b) {
		if (a.x * a.x + a.y * a.y <= b.x * b.x + b.y * b.y)
			return a;
		return b;
	}; // shortest( )

	/**
	 * tripleProduct( )
	 *
	 * Calculates the triple product of three vectors.
	 * triple vector product = b(a•c) - a(b•c)
	 *
	 * @public
	 * @static
	 * @sig public {Vector} tripleProduct(Vector, Vector, Vector);
	 * @param {Vector} a
	 * @param {Vector} b
	 * @param {Vector} c
	 * @return {Vector} the triple product as a new vector
	 */
	Vector.tripleProduct = function(a, b, c) {
		var ac = a.dotProduct(c);
		var bc = b.dotProduct(c);
		return new Vector(b.x * ac - a.x * bc, b.y * ac - a.y * bc);
	};

	return Vector;
})();