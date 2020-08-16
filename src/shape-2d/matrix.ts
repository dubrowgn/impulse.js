import { Vector } from "./vector";

interface MatrixJson {
	a: number;
	b: number;
	c: number;
	d: number;
	e: number;
	f: number;
};

export class Matrix {
	a: number = 1;
	b: number = 0;
	c: number = 0;
	d: number = 1;
	e: number = 0;
	f: number = 0;

	/**
	 * @class Matrix
	 *
	 * This is a 2D Matrix class. It is 3x3 to allow for affine transformations in 2D
	 * space. The third row is always assumed to be [0, 0, 1].
	 *
	 * Matrix uses the following form, as per the whatwg.org specifications for
	 * canvas.transform():
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
	constructor();
	constructor(matrix: Matrix);
	constructor(a: number, b: number, c: number, d: number, e: number, f: number);
	constructor(a?: any, b?: number, c?: number, d?: number, e?: number, f?: number) {
		this._set(a, b, c, d, e, f);
	}

	/**
	 * clone( )
	 *
	 * Creates an exact, numeric copy of the current matrix
	 *
	 * @public
	 * @sig public {Matrix} clone();
	 * @returns {Matrix}
	 */
	clone(): Matrix {
		return new Matrix(this);
	}

	/**
	 * combine( )
	 *
	 * Multiplies this matrix with another, overriding the values of this matrix.
	 * The passed matrix is assumed to be on the right-hand side.
	 *
	 * @public
	 * @sig public {Matrix} combine(Matrix);
	 * @param {Matrix} right
	 * @returns {Matrix} this matrix after combination
	 */
	combine(right: Matrix): Matrix {
		let a = this.a;
		this.a = a * right.a + this.b * right.c;
		this.b = a * right.b + this.b * right.d;

		let c = this.c;
		this.c = c * right.a + this.d * right.c;
		this.d = c * right.b + this.d * right.d;

		let e = this.e;
		this.e = e * right.a + this.f * right.c + right.e;
		this.f = e * right.b + this.f * right.d + right.f;

		return this;
	}

	/**
	 * equals( )
	 *
	 * Checks for the numeric equality of this matrix versus another.
	 *
	 * @public
	 * @sig public {Boolean} equals(Matrix);
	 * @param {Matrix} right
	 * @returns {Boolean} true if the two matrices are numerically equal
	 */
	equals(right: Matrix): boolean {
		return right instanceof Matrix &&
			this.a == right.a && this.b == right.b && this.c == right.c &&
			this.d == right.d && this.e == right.e && this.f == right.f;
	}

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
	export(): MatrixJson {
		return {
			a: this.a, b: this.b, c: this.c,
			d: this.d, e: this.e, f: this.f
		};
	}

	/**
	 * getDeterminant( )
	 *
	 * Calculates the determinant of this matrix
	 *
	 * @public
	 * @sig public {Number} getDeterminant();
	 * @returns {Number} det(this matrix)
	 */
	getDeterminant(): number {
		return this.a * this.d - this.b * this.c;
	}

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
	getRotation(): number {
		return Math.atan2(this.b, this.a);
	}

	/**
	 * getScale( )
	 *
	 * Gets the scaling factors for each axis of this matrix as a 2D vector.
	 *
	 * @public
	 * @sig public {Vector} getScale();
	 * @returns {Vector} 2D vector with the scaling factors for each axis
	 */
	getScale(): Vector {
		return new Vector(
			Math.sqrt(this.a * this.a + this.b * this.b),
			Math.sqrt(this.c * this.c + this.d * this.d));
	}

	/**
	 * getTranslation( )
	 *
	 * Gets the translation applied to this matrix as a 2D vector.
	 *
	 * @public
	 * @sig public {Vector} getTranslation();
	 * @returns {Vector} the translation applied to this vector as a 2D vector
	 */
	getTranslation(): Vector {
		return new Vector(this.e, this.f);
	}

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
	invert(): Matrix {
		let det = this.getDeterminant();

		// matrix is invertible if its getDeterminant is non-zero
		if (det === 0)
			return this;

		let { a, b, c, d, e, f } = this;
		this.a = d / det;
		this.b = -b / det;
		this.c = -c / det;
		this.d = a / det;
		this.e = (c * f - e * d) / det;
		this.f = (e * b - a * f) / det;

		return this;
	}

	/**
	 * isIdentity( )
	 *
	 * Returns true if this matrix is the identity matrix
	 *
	 * @public
	 * @sig public {Boolean} isIdentity();
	 * @returns {Boolean}
	 */
	isIdentity(): boolean {
		return this.a === 1 && this.b === 0 && this.c === 0 &&
			this.d === 1 && this.e === 0 && this.f === 0;
	}

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
	isInvertible(): boolean {
		return this.getDeterminant() !== 0;
	}

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
	preRotate(rads: number): Matrix {
		let cos = Math.cos(rads);
		let sin = Math.sin(rads);

		let a = this.a;
		this.a = cos * a - sin * this.b;
		this.b = sin * a + cos * this.b;

		let c = this.c;
		this.c = cos * c - sin * this.d;
		this.d = sin * c + cos * this.d;

		return this;
	}

	/**
	 * preScale( )
	 *
	 * Applies a pre-scaling to this matrix
	 *
	 * @public
	 * @sig public {Matrix} preScale(Number[, Number]);
	 * @param {Number|Vector} scalarX
	 * @param {Number} [scalarY] scalarX is used if scalarY is undefined
	 * @returns {Matrix} this after pre-scaling
	 */
	preScale(vect: Vector): Matrix;
	preScale(scalarX: number, scalarY?: number): Matrix;
	preScale(scalarX: any, scalarY?: number): Matrix {
		if (scalarX instanceof Vector) {
			scalarY = scalarX.y;
			scalarX = scalarX.x;
		} else if (scalarY === undefined) {
			scalarY = scalarX;
		}

		this.a *= scalarX;
		this.b *= scalarY as number;
		this.c *= scalarX;
		this.d *= scalarY as number;

		return this;
	}

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
	preTranslate(vect: Vector): Matrix;
	preTranslate(dx: number, dy?: number): Matrix;
	preTranslate(dx: any, dy?: number): Matrix {
		if (dx instanceof Vector) {
			dy = dx.y;
			dx = dx.x;
		} else if (dy === undefined) {
			dy = dx;
		}

		this.e += dx;
		this.f += dy as number;

		return this;
	}

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
	rotate(rads: number): Matrix {
		let cos = Math.cos(rads);
		let sin = Math.sin(rads);

		let a = this.a;
		this.a = cos * a - sin * this.b;
		this.b = sin * a + cos * this.b;

		let c = this.c;
		this.c = cos * c - sin * this.d;
		this.d = sin * c + cos * this.d;

		let e = this.e;
		this.e = cos * e - sin * this.f;
		this.f = sin * e + cos * this.f;

		return this;
	}

	/**
	 * set( )
	 *
	 * Sets the values of this matrix
	 *
	 * @public
	 * @sig public {Matrix} set(Matrix);
	 * @sig public {Matrix} set(Number, Number, Number, Number, Number, Number);
	 * @param {Matrix|Number} a
	 * @param {Number} b
	 * @param {Number} c
	 * @param {Number} d
	 * @param {Number} e
	 * @param {Number} f
	 * @returns {Matrix} this matrix containing the new values
	 */
	set(): Matrix;
	set(matrix: Matrix): Matrix;
	set(a: number, b: number, c: number, d: number, e: number, f: number): Matrix;
	set(a?: any, b?: number, c?: number, d?: number, e?: number, f?: number): Matrix {
		return this._set(a, b, c, d, e, f);
	}

	private _set(a?: any, b?: number, c?: number, d?: number, e?: number, f?: number): Matrix {
		if (a instanceof Matrix) {
			this.a = a.a;
			this.b = a.b;
			this.c = a.c;
			this.d = a.d;
			this.e = a.e;
			this.f = a.f;
		} else if (typeof a === "number") {
			this.a = a;
			this.b = b as number;
			this.c = c as number;
			this.d = d as number;
			this.e = e as number;
			this.f = f as number;
		} else {
			this.a = 1;
			this.b = 0;
			this.c = 0;
			this.d = 1;
			this.e = 0;
			this.f = 0;
		}

		return this;
	}

	/**
	 * scale( )
	 *
	 * Applies a post-scaling to this matrix
	 *
	 * @public
	 * @sig public {Matrix} scale(Number[, Number]);
	 * @param {Number|Vector} scalarX
	 * @param {Number} [scalarY] scalarX is used if scalarY is undefined
	 * @returns {Matrix} this after post-scaling
	 */
	scale(vect: Vector): Matrix;
	scale(scalarX: number, scalarY?: number): Matrix;
	scale(scalarX: any, scalarY?: number): Matrix {
		if (scalarX instanceof Vector) {
			scalarY = scalarX.y;
			scalarX = scalarX.x;
		} else if (scalarY === undefined) {
			scalarY = scalarX;
		}

		this.a *= scalarX;
		this.b *= scalarY as number;
		this.c *= scalarX;
		this.d *= scalarY as number;
		this.e *= scalarX;
		this.f *= scalarY as number;

		return this;
	}

	/**
	 * toJSON( )
	 *
	 * Returns a JSON ready copy of this object's current state.
	 * @return {Object}
	 */
	toJSON = Matrix.prototype.export;

	/**
	 * toString( )
	 *
	 * Returns the string representation of this matrix.
	 *
	 * @public
	 * @sig public {String} toString();
	 * @returns {String}
	 */
	toString(): string {
		return "Matrix([" + this.a + ", " + this.c + ", " + this.e +
			"] [" + this.b + ", " + this.d + ", " + this.f + "] [0, 0, 1])";
	}

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
	translate(vect: Vector): Matrix;
	translate(dx: number, dy?: number): Matrix;
	translate(dx: any, dy?: number): Matrix {
		if (dx instanceof Vector) {
			dy = dx.y;
			dx = dx.x;
		} else if (dy === undefined) {
			dy = dx;
		}

		this.e += this.a * dx + this.c * (dy as number);
		this.f += this.b * dx + this.d * (dy as number);

		return this;
	}

	/**
	 * import( )
	 *
	 * Creates a new matrix with an internal state equal to the values of
	 * the passed generic object. This is useful for restoring state from
	 * JSON for example.
	 *
	 * @public
	 * @static
	 * @sig public {Matrix} import({Object});
	 * @param  {Object} obj
	 * @return {Matrix}
	 */
	static import(obj: MatrixJson): Matrix {
		return new Matrix(obj.a, obj.b, obj.c, obj.d, obj.e, obj.f);
	}
};
