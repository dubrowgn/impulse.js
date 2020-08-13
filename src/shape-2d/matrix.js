import { Vector } from "./vector";

export const Matrix = (function() {
	/**
	 * @class Matrix
	 *
	 * This is a 2D Matrix class. It is 3x3 to allow for affine transformations in 2D space.
	 * The third row is always assumed to be [0, 0, 1].
	 *
	 * Matrix uses the following form, as per the whatwg.org specifications for canvas.transform():
	 * [a, c, e]
	 * [b, d, f]
	 * [0, 0, 1]
	 *
	 * public {Matrix} new Matrix();
	 * public {Matrix} new Matrix(Matrix);
	 * public {Matrix} new Matrix(Number, Number, Number, Number, Number, Number);
	 *
	 * @public
	 * @constructor
	 * @param {Matrix|Number=1} a
	 * @param {Number=0} b
	 * @param {Number=0} c
	 * @param {Number=1} d
	 * @param {Number=0} e
	 * @param {Number=0} f
	 */
	var Matrix = function(a, b, c, d, e, f) {
		if (a instanceof Matrix) {
			this.a = a.a;
			this.b = a.b;
			this.c = a.c;
			this.d = a.d;
			this.e = a.e;
			this.f = a.f;
		} else if (arguments.length === 6) {
			this.a = a;
			this.b = b;
			this.c = c;
			this.d = d;
			this.e = e;
			this.f = f;
		} else if (arguments.length > 0)
			throw "Unexpected number of arguments for Matrix()";
	}; // class Matrix

	Matrix.prototype.a = 1;
	Matrix.prototype.b = 0;
	Matrix.prototype.c = 0;
	Matrix.prototype.d = 1;
	Matrix.prototype.e = 0;
	Matrix.prototype.f = 0;

	/**
	 * clone( )
	 *
	 * Creates an exact, numeric copy of the current matrix
	 *
	 * @public
	 * @sig public {Matrix} clone();
	 * @returns {Matrix}
	 */
	Matrix.prototype.clone = function() {
		return new Matrix(this);
	}; // clone( )

	/**
	 * combine( )
	 *
	 * Multiplies this matrix with another, overriding the values of this matrix.
	 * The passed matrix is assumed to be on the right-hand side.
	 *
	 * @public
	 * @sig public {Matrix} combine(Matrix);
	 * @param {Matrix} mtrxRH
	 * @returns {Matrix} this matrix after combination
	 */
	Matrix.prototype.combine = function(mtrxRH) {
		var tmp = this.a;
		this.a = tmp * mtrxRH.a + this.b * mtrxRH.c;
		this.b = tmp * mtrxRH.b + this.b * mtrxRH.d;
		tmp = this.c;
		this.c = tmp * mtrxRH.a + this.d * mtrxRH.c;
		this.d = tmp * mtrxRH.b + this.d * mtrxRH.d;
		tmp = this.e;
		this.e = tmp * mtrxRH.a + this.f * mtrxRH.c + mtrxRH.e;
		this.f = tmp * mtrxRH.b + this.f * mtrxRH.d + mtrxRH.f;
		return this;
	}; // combine( )

	/**
	 * equals( )
	 *
	 * Checks for the numeric equality of this matrix versus another.
	 *
	 * @public
	 * @sig public {Boolean} equals(Matrix);
	 * @param {Matrix} mtrxRH
	 * @returns {Boolean} true if the two matrices are numerically equal
	 */
	Matrix.prototype.equals = function(mtrxRH) {
		return mtrxRH instanceof Matrix &&
			this.a == mtrxRH.a && this.b == mtrxRH.b && this.c == mtrxRH.c &&
			this.d == mtrxRH.d && this.e == mtrxRH.e && this.f == mtrxRH.f;
	}; // equals( )

	/**
	 * export( )
	 *
	 * Returns a generic object containing the current state of this matrix.
	 * This is useful for storing state via JSON for example.
	 *
	 * @public
	 * @sig public {Object} export();
	 * @return {Object}
	 */
	Matrix.prototype.export = function() {
		return {
			a: this.a,
			b: this.b,
			c: this.c,
			d: this.d,
			e: this.e,
			f: this.f
		};
	}; // export( )

	/**
	 * getDeterminant( )
	 *
	 * Calculates the determinant of this matrix
	 *
	 * @public
	 * @sig public {Number} getDeterminant();
	 * @returns {Number} det(this matrix)
	 */
	Matrix.prototype.getDeterminant = function() {
		return this.a * this.d - this.b * this.c;
	}; // getDeterminant( )

	/**
	 * getRotation( )
	 *
	 * Gets the rotation applied to this matrix in radians as a scalar value.
	 * Angles returned have the range (−π, π].
	 *
	 * @public
	 * @sig public {Number} getRotation();
	 * @returns {Number} the rotation applied to this matrix in radians as a scalar value
	 */
	Matrix.prototype.getRotation = function() {
		return Math.atan2(this.b, this.a);
	}; // getRotation( )

	/**
	 * getScale( )
	 *
	 * Gets the scaling factors for each axis of this matrix as a 2D vector.
	 *
	 * @public
	 * @sig public {Vector} getScale();
	 * @returns {Vector} 2D vector with the scaling factors for each axis
	 */
	Matrix.prototype.getScale = function() {
		return new Vector(
			Math.sqrt(this.a * this.a + this.b * this.b),
			Math.sqrt(this.c * this.c + this.d * this.d));
	}; // getScale( )

	/**
	 * getTranslation( )
	 *
	 * Gets the translation applied to this matrix as a 2D vector.
	 *
	 * @public
	 * @sig public {Vector} getTranslation();
	 * @returns {Vector} the translation applied to this vector as a 2D vector
	 */
	Matrix.prototype.getTranslation = function() {
		return new Vector(this.e, this.f);
	}; // getTranslation( )

	/**
	 * invert( )
	 *
	 * Inverts this matrix if possible
	 *
	 * @public
	 * @sig public {Matrix} invert();
	 * @returns {Matrix} this inverted matrix or the original matrix on failure
	 * @see Matrix.isInvertible( )
	 */
	Matrix.prototype.invert = function() {
		var det = this.getDeterminant();

		// matrix is invertible if its getDeterminant is non-zero
		if (det !== 0) {
			var old = {
				a: this.a,
				b: this.b,
				c: this.c,
				d: this.d,
				e: this.e,
				f: this.f
			};
			this.a = old.d / det;
			this.b = -old.b / det;
			this.c = -old.c / det;
			this.d = old.a / det;
			this.e = (old.c * old.f - old.e * old.d) / det;
			this.f = (old.e * old.b - old.a * old.f) / det;
		} // if

		return this;
	}; // invert( )

	/**
	 * isIdentity( )
	 *
	 * Returns true if this matrix is the identity matrix
	 *
	 * @public
	 * @sig public {Boolean} isIdentity();
	 * @returns {Boolean}
	 */
	Matrix.prototype.isIdentity = function() {
		return this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 && this.e === 0 && this.f === 0;
	}; // isIdentity( )

	/**
	 * isInvertible( )
	 *
	 * Determines is this matrix is invertible.
	 *
	 * @public
	 * @sig public {Boolean} isInvertible();
	 * @returns {Boolean} true if this matrix is invertible
	 * @see Matrix.invert( )
	 */
	Matrix.prototype.isInvertible = function() {
		return this.getDeterminant() !== 0;
	}; // isInvertible( )

	/**
	 * preRotate( )
	 *
	 * Applies a counter-clockwise pre-rotation to this matrix
	 *
	 * @public
	 * @sig public {Matrix} preRotate(Number);
	 * @param {number} rads - angle to rotate in radians
	 * @returns {Matrix} this matrix after pre-rotation
	 */
	Matrix.prototype.preRotate = function(rads) {
		var cos = Math.cos(rads);
		var sin = Math.sin(rads);

		var tmp = this.a;
		this.a = cos * tmp - sin * this.b;
		this.b = sin * tmp + cos * this.b;
		tmp = this.c;
		this.c = cos * tmp - sin * this.d;
		this.d = sin * tmp + cos * this.d;

		return this;
	}; // preRotate( )

	/**
	 * preScale( )
	 *
	 * Applies a pre-scaling to this matrix
	 *
	 * @public
	 * @sig public {Matrix} preScale(Number[, Number]);
	 * @param {Number} scalarX
	 * @param {Number} [scalarY] scalarX is used if scalarY is undefined
	 * @returns {Matrix} this after pre-scaling
	 */
	Matrix.prototype.preScale = function(scalarX, scalarY) {
		if (scalarY === undefined)
			scalarY = scalarX;

		this.a *= scalarX;
		this.b *= scalarY;
		this.c *= scalarX;
		this.d *= scalarY;

		return this;
	}; // preScale( )

	/**
	 * preTranslate( )
	 *
	 * Applies a pre-translation to this matrix
	 *
	 * @public
	 * @sig public {Matrix} preTranslate(Vector);
	 * @sig public {Matrix} preTranslate(Number, Number);
	 * @param {Number|Vector} dx
	 * @param {Number} dy
	 * @returns {Matrix} this matrix after pre-translation
	 */
	Matrix.prototype.preTranslate = function(dx, dy) {
		if (typeof dx === "number") {
			this.e += dx;
			this.f += dy;
		} else {
			this.e += dx.x;
			this.f += dx.y;
		} // else

		return this;
	}; // preTranslate( )

	/**
	 * rotate( )
	 *
	 * Applies a counter-clockwise post-rotation to this matrix
	 *
	 * @public
	 * @sig public {Matrix} rotate(Number);
	 * @param {Number} rads - angle to rotate in radians
	 * @returns {Matrix} this matrix after rotation
	 */
	Matrix.prototype.rotate = function(rads) {
		var cos = Math.cos(rads);
		var sin = Math.sin(rads);

		var tmp = this.a;
		this.a = cos * tmp - sin * this.b;
		this.b = sin * tmp + cos * this.b;
		tmp = this.c;
		this.c = cos * tmp - sin * this.d;
		this.d = sin * tmp + cos * this.d;
		tmp = this.e;
		this.e = cos * tmp - sin * this.f;
		this.f = sin * tmp + cos * this.f;

		return this;
	}; // rotate( )

	/**
	 * scale( )
	 *
	 * Applies a post-scaling to this matrix
	 *
	 * @public
	 * @sig public {Matrix} scale(Number[, Number]);
	 * @param {Number} scalarX
	 * @param {Number} [scalarY] scalarX is used if scalarY is undefined
	 * @returns {Matrix} this after post-scaling
	 */
	Matrix.prototype.scale = function(scalarX, scalarY) {
		if (scalarY === undefined)
			scalarY = scalarX;

		this.a *= scalarX;
		this.b *= scalarY;
		this.c *= scalarX;
		this.d *= scalarY;
		this.e *= scalarX;
		this.f *= scalarY;

		return this;
	}; // scale( )

	/**
	 * setValues( )
	 *
	 * Sets the values of this matrix
	 *
	 * @public
	 * @sig public {Matrix} setValues(Matrix);
	 * @sig public {Matrix} setValues(Number, Number, Number, Number, Number, Number);
	 * @param {Matrix|Number} a
	 * @param {Number} b
	 * @param {Number} c
	 * @param {Number} d
	 * @param {Number} e
	 * @param {Number} f
	 * @returns {Matrix} this matrix containing the new values
	 */
	Matrix.prototype.setValues = function(a, b, c, d, e, f) {
		if (a instanceof Matrix) {
			this.a = a.a;
			this.b = a.b;
			this.c = a.c;
			this.d = a.d;
			this.e = a.e;
			this.f = a.f;
		} else {
			this.a = a;
			this.b = b;
			this.c = c;
			this.d = d;
			this.e = e;
			this.f = f;
		} // else

		return this;
	}; // setValues( )

	/**
	 * toJSON( )
	 *
	 * Returns a JSON ready copy of this object's current state.
	 * @return {Object}
	 */
	Matrix.prototype.toJSON = Matrix.prototype.export;

	/**
	 * toString( )
	 *
	 * Returns the string representation of this matrix.
	 *
	 * @public
	 * @sig public {String} toString();
	 * @returns {String}
	 */
	Matrix.prototype.toString = function() {
		return "Matrix([" + this.a + ", " + this.c + ", " + this.e +
			"] [" + this.b + ", " + this.d + ", " + this.f + "] [0, 0, 1])";
	}; // toString( )

	/**
	 * translate( )
	 *
	 * Applies a post-translation to this matrix
	 *
	 * @public
	 * @sig public {Matrix} translate(Vector);
	 * @sig public {Matrix} translate(Number, Number);
	 * @param {Number|Vector} dx
	 * @param {Number} dy
	 * @returns {Matrix} this matrix after post-translation
	 */
	Matrix.prototype.translate = function(dx, dy) {
		if (typeof dx === "number") {
			this.e += this.a * dx + this.c * dy;
			this.f += this.b * dx + this.d * dy;
		} else {
			this.e += this.a * dx.x + this.c * dx.y;
			this.f += this.b * dx.x + this.d * dx.y;
		} // else

		return this;
	}; // translate( )

	/**
	 * import( )
	 *
	 * Creates a new matrix with an internal state equal to the values of
	 * the passed generic object. This is useful for restoring state from
	 * JSON for example.
	 *
	 * @public
	 * @static
	 * @sig public {Animation} import({Object});
	 * @param  {Object} obj
	 * @return {Animation}
	 */
	Matrix.import = function(obj) {
		return new Matrix(obj.a, obj.b, obj.c, obj.d, obj.e, obj.f);
	}; // import( )

	return Matrix;
})();
