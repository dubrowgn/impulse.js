import { Matrix } from "./matrix";
import { Shape2d, ShapeId } from "./shape-2d";

function float_fuzzy_eq(l: number, r: number): boolean {
	if (l === r)
		return true;

	l = Math.abs(l);
	r = Math.abs(r);
	let delta = Math.abs(l - r);
	const min_normal = 2**-1022;

	if (l === 0 || r === 0 || l + r < min_normal) {
		// a or b is zero or both are extremely close to it
		// relative error is less meaningful here
		return delta < Number.EPSILON * min_normal;
	}

	// use relative error
	return delta / Math.min(l + r, Number.MAX_VALUE) < Number.EPSILON;
}

export class Vector implements Shape2d<Vector> {
	x: number = 0;
	y: number = 0;

	/**
	 * Vector
	 *
	 * @class A general purpose 2D vector class, of the form <x, y>
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
	constructor();
	constructor(vect: Vector);
	constructor(x: number, y: number);
	constructor(x?: any, y?: number) {
		this._set(x, y);
	}

	/**
	 * add( )
	 *
	 * Adds the passed vector to this vector
	 *
	 * public {Vector} add(Vector);
	 *
	 * @public
	 * @param {Vector} right
	 * @returns {Vector} this after adding
	 */
	add(right: Vector): Vector {
		this.x += right.x;
		this.y += right.y;

		return this;
	}

	/**
	 * angleBetween( )
	 *
	 * Calculates the angle between the passed vector and this vector, using <0,0> as the
	 * point of reference. Angles returned have the range (−π, π].
	 *
	 * public {Number} angleBetween(Vector);
	 *
	 * @public
	 * @param {Vector} right
	 * @returns {Number} the angle between the two vectors in radians
	 */
	angleBetween(right: Vector): number {
		return Math.atan2(
			this.x * right.y - this.y * right.x,
			this.x * right.x + this.y * right.y,
		);
	}

	/**
	 * angleTo( )
	 *
	 * Calculates the angle to the passed vector from this vector, using this vector as the point of reference.
	 *
	 * public {Number} angleTo(Vector);
	 *
	 * @public
	 * @param {Vector} right
	 * @returns {Number} the angle to the passed vector in radians
	 */
	angleTo(right: Vector): number {
		return Math.atan2(right.y - this.y, right.x - this.x);
	}

	applyTransform(matrix: Matrix): Vector {
		return this.transform(matrix);
	}

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
	clone(): Vector {
		return new Vector(this);
	}

	/**
	 * distance( )
	 *
	 * Calculates the distance from this vector to the passed vector.
	 *
	 * public {Number} distance(Vector);
	 *
	 * @public
	 * @param {Vector} right
	 * @returns {Number} the distance between the two vectors
	 */
	distance(right: Vector): number {
		return Math.sqrt(this.distanceSq(right));
	}

	/**
	 * distanceSq( )
	 *
	 * Calculates the squared distance from this vector to the passed vector.
	 * This function avoids calculating the square root, thus being slightly faster than .distance( ).
	 *
	 * public {Number} distanceSq(Vector);
	 *
	 * @public
	 * @param {Vector} right
	 * @returns {Number} the squared distance between the two vectors
	 * @see Vector.distance( )
	 */
	distanceSq(right: Vector): number {
		return (right.x - this.x) * (right.x - this.x) +
			(right.y - this.y) * (right.y - this.y);
	}

	/**
	 * divide( )
	 *
	 * Divides this vector by the passed vector.
	 *
	 * public {Vector} divide(Vector);
	 *
	 * @public
	 * @param {Vector} right
	 * @returns {Vector} this vector after dividing
	 */
	divide(right: Vector): Vector {
		this.x /= right.x;
		this.y /= right.y;

		return this;
	}

	/**
	 * dotProduct( )
	 *
	 * Calculates the dot product of this and the passed vectors
	 *
	 * public {Number} dotProduct(Vector);
	 *
	 * @public
	 * @param {Vector} right
	 * @returns {Number} the resultant dot product
	 */
	dotProduct(right: Vector): number {
		return this.x * right.x + this.y * right.y;
	}

	/**
	 * equals( )
	 *
	 * Determines if this vector is numerically equivalent to the passed vector.
	 *
	 * public {Boolean} equals(Vector);
	 *
	 * @public
	 * @param {Vector} right
	 * @returns {Boolean} true if the vectors are equivalent
	 */
	equals(right: any): boolean {
		return right instanceof Vector &&
			this.x == right.x &&
			this.y == right.y;
	}

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
	getCenter(): Vector {
		return new Vector(this);
	}

	/**
	 * getNormal( )
	 *
	 * Calculates a new right-handed normal vector for the line created by this and the
	 * passed vectors.
	 *
	 * public {Vector} getNormal([Vector]);
	 *
	 * @public
	 * @param {Vector=<0,0>} [right]
	 * @returns {Vector} the new normal vector
	 */
	getNormal(right?: Vector): Vector {
		if (right === undefined)
			return new Vector(-this.y, this.x).normalize(); // assume right is <0, 0>

		return new Vector(right.y - this.y, this.x - right.x).normalize();
	}

	/**
	 * getShapeID( )
	 *
	 * Gets the ShapeID associated with the Vector class
	 *
	 * @public
	 * @sig public {Number} getShapeID();
	 * @returns {Number} the ShapeID associated with the Vector class
	 */
	getShapeId(): number {
		return ShapeId.Vector;
	}

	getShapeID = Vector.prototype.getShapeId;

	/**
	 * isNear( )
	 *
	 * Determines if this vector is roughly equal to right
	 *
	 * @public
	 * @sig public {Boolean} isNear();
	 * @param {Vector} right
	 * @returns {Boolean} true if this vector is roughly equal to right
	 */
	isNear(right: Vector): boolean {
		return float_fuzzy_eq(this.x, right.x) && float_fuzzy_eq(this.y, right.y);
	};

	/**
	 * isZero( )
	 *
	 * Determines if this vector is equal to <0,0>
	 *
	 * @public
	 * @sig public {Boolean} isZero();
	 * @returns {Boolean} true if this vector is equal to <0,0>
	 */
	isZero(): boolean {
		return this.x === 0 && this.y ===0;
	}

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
	magnitude(): number {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

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
	magnitudeSq(): number {
		return this.x * this.x + this.y * this.y;
	}

	/**
	 * multiply( )
	 *
	 * Multiplies this vector by the passed vector
	 *
	 * @public
	 * @sig public {Vector} multiply(Vector);
	 * @param {Vector} right
	 * @returns {Vector} this vector after multiplying
	 */
	multiply(right: Vector): Vector {
		this.x *= right.x;
		this.y *= right.y;

		return this;
	}

	/**
	 * negate( )
	 *
	 * Negates this vector (ie. <-x,-y>)
	 *
	 * @public
	 * @sig public {Vector} negate();
	 * @returns {Vector} this vector after negation
	 */
	negate(): Vector {
		this.x = -this.x;
		this.y = -this.y;

		return this;
	}

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
	normalize(): Vector {
		if (this.isZero())
			return this;

		let lng = this.magnitude();
		this.x /= lng;
		this.y /= lng;

		return this;
	}

	/**
	 * perpendicular( )
	 *
	 * Rotates this vector 90°, making it perpendicular to its current orientation
	 *
	 * @public
	 * @sig public {Vector} perpendicular();
	 * @returns {Vector} this vector after rotating 90°
	 */
	perpendicular(): Vector {
		let x = this.x;
		this.x = -this.y;
		this.y = x;

		return this;
	}

	/**
	 * projectOnto( )
	 *
	 * Projects this vector onto right
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
	 * @param {Vector} right
	 * @returns {Vector} this vector after projection
	 */
	projectOnto(right: Vector): Vector {
		if (right.isZero()) {
			this.x = 0;
			this.y = 0;
		} else {
			let k = this.dotProduct(right) / right.magnitudeSq();
			this.x = k * right.x;
			this.y = k * right.y;
		}

		return this;
	}

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
	rotate(rads: number): Vector {
		let x = this.x;
		this.x = x * Math.cos(rads) - this.y * Math.sin(rads);
		this.y = x * Math.sin(rads) - this.y * Math.cos(rads);

		return this;
	}

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
	scale(scalarX: number, scalarY?: number): Vector {
		if (scalarY === undefined)
			scalarY = scalarX;

		this.x *= scalarX;
		this.y *= scalarY;

		return this;
	}

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
	scaleToMagnitude(mag: number): Vector {
		if (this.isZero())
			return this;

		let k = mag / this.magnitude();
		this.x *= k;
		this.y *= k;

		return this;
	}

	/**
	 * set( )
	 *
	 * Sets the values of this vector using a passed vector or pair of numbers.
	 *
	 * @public
	 * @sig public {Vector} set(Vector);
	 * @sig public {Vector} set(Number, Number);
	 * @param {Number|Vector} x
	 * @param {Number} y
	 * @returns {Vector} this vector after setting of values
	 */
	set(vect: Vector): Vector;
	set(x: number, y: number): Vector;
	set(x: any, y?: number): Vector {
		return this._set(x, y);
	};

	private _set(x?: any, y?: number): Vector {
		if (x instanceof Vector) {
			this.x = x.x;
			this.y = x.y;
		} else if (typeof x === "number") {
			this.x = x;
			this.y = y as number;
		} else {
			this.x = 0;
			this.y = 0;
		}

		return this;
	};

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
	setCenter = Vector.prototype.set;

	/**
	 * subtract( )
	 *
	 * Subtracts the passed vector from this vector.
	 *
	 * @public
	 * @sig public {Vector} subtract(Vector);
	 * @param {Vector} right
	 * @returns {Vector} this vector after subtracting
	 */
	subtract(right: Vector): Vector {
		this.x -= right.x;
		this.y -= right.y;

		return this;
	}

	/**
	 * toString( )
	 *
	 * Returns a string representation of this vector.
	 *
	 * @public
	 * @sig public {String} toString();
	 * @returns {String}
	 */
	toString(): string {
		return `Vector(${this.x}, ${this.y})`;
	}

	/**
	 * transform( )
	 *
	 * Applies the given matrix transformation to this Vector.
	 *
	 * {Vector} transform(Matrix);
	 *
	 * @public
	 * @returns {Vector} this vector after applying the given transformation
	 */
	transform(matrix: Matrix): Vector {
		let x = this.x;
		this.x = matrix.a * x + matrix.c * this.y + matrix.e;
		this.y = matrix.b * x + matrix.d * this.y + matrix.f;

		return this;
	}

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
	translate(dx: number, dy?: number): Vector {
		if (dy === undefined)
			dy = dx;

		this.x += dx;
		this.y += dy;

		return this;
	}

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
	static longest(a: Vector, b: Vector): Vector {
		return a.magnitudeSq() >= b.magnitudeSq() ? a : b;
	}

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
	static shortest = function(a: Vector, b: Vector): Vector {
		return a.magnitudeSq() > b.magnitudeSq() ? b : a;
	}

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
	static tripleProduct = function(a: Vector, b: Vector, c: Vector): Vector {
		let ac = a.dotProduct(c);
		let bc = b.dotProduct(c);

		return new Vector(b.x * ac - a.x * bc, b.y * ac - a.y * bc);
	}
};
