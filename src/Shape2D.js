/**
 * @namespace
 */
Impulse.Shape2D = (function() {
	/**
	 * enumeration of shape types and their associated ID's
	 *
	 * @enum {number}
	 * @private
	 */
	var _shapeID = {
		Circle:0,
		Polygon:1,
		Rect:2,
		Vector:3
	};

	var Shape2D = {};

	Shape2D.Circle = (function() {
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
			} else if (x instanceof Shape2D.Vector) {
				this.x = x.x;
				this.y = x.y;
				this.r = y;
			} else {
				this.x = x;
				this.y = y;
				this.r = r;
			} // else
		}; // class Circle

		Circle.prototype = new Shape2D.IShape();
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
			return new Shape2D.Vector(this.x, this.y);
		}; // getCenter( )

		// Number getShapeID();
		Circle.prototype.getShapeID = function() {
			return _shapeID.Circle;
		}; // getShapeID( )

		// Circle setCenter(Vector);
		// Circle setCenter(Number, Number);
		Circle.prototype.setCenter = function(x, y) {
			if (x instanceof Shape2D.Vector) {
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
	});

	Shape2D.Intersect = (function() {
		var Intersection = Shape2D.Intersection;
		var Vector = Shape2D.Vector;

		// map shapeID to intersection functions
		var _shapeMap = [];
		var _shapeMapSat = [];

		var Intersect = {};

		// Boolean circleVsCircle(Circle, Circle);
		Intersect.circleVsCircle = function(cir1, cir2) {
			// return true if the squared distance between circle centers is less than the combined radii squared
			// this prevents us from doing a square root operation to find actual distance between centers
			// 0 distance between circles is assumed to be non-intersecting
			return (cir2.x - cir1.x) * (cir2.x - cir1.x) +
				(cir2.y - cir1.y) * (cir2.y - cir1.y) <
				(cir1.r + cir2.r) * (cir1.r + cir2.r);
		}; // circleVsCircle( )

		// Intersection circleVsCircleSat(Circle, Circle);
		Intersect.circleVsCircleSat = function(cir1, cir2) {
			// calculate the vector between the circles' centers
			var dc = new Vector(cir1.x - cir2.x, cir1.y - cir2.y);

			// calculate magnitude of dc and combined radii
			var l = dc.magnitude();
			var rs = cir1.r + cir2.r;

			// if magnitude of dc >= rs, circles do not intersect
			if (l >= rs)
				return undefined;

			// circles intersect
			// scale dc to magnitude of overlap
			dc.scale((rs - l) / l);

			// return dc as projection, and negative, normalized dc as surface normal
			return dc;
		}; // circleVsCircleSat( )

		/**
		 * Takes a circle and a collection of vertices and performs circle-polygon projections intersection on them.
		 * Results are always from the perspective of cir, that is, the minimum translation vector needed to move cir
		 * out of collision with v1.
		 *
		 * @param {Circle} cir The Circle to perform intersection tests against
		 * @param {Array<Vector} v1 An array of vertices representing the polygon
		 * @return {undefined|Vector} Returns the Minium Translation Vector if the circle and polygon intersect,
		 * undefined otherwise
		 * @private
		 */
		Intersect._circleVsEdges = function(cir, v1) {
			var perp, min1, min2, max1, max2, dp, i, j, k, overlap, mtv, diff1, diff2;
			var smallest = Number.MAX_VALUE;

			// test edges stored in v1 against cir
			for (i = 0, j = v1.length - 1; i < v1.length; j = i++) {
				// calculate normalized vector perpendicular to each line segment of the polygon
				perp = new Vector(-v1[i].y + v1[j].y, v1[i].x - v1[j].x).normalize();

				// assume the polygon has at least one vertex (see Shape2D.Polygon constructor)
				// project the polygon onto the new axis (the perpendicular vector)
				min1 = max1 = v1[0].dotProduct(perp);
				for (k = 1; k < v1.length; k++) {
					dp = v1[k].dotProduct(perp);
					min1 = Math.min(min1, dp);
					max1 = Math.max(max1, dp);
				} // for( k )

				// project the circle onto the new axis (the perpendicular vector)
				min2 = cir.getCenter().dotProduct(perp) - cir.r;
				max2 = min2 + 2 * cir.r;

				// break early if projections don't overlap, no intersection exists
				if (max1 < min2 || min1 > max2)
					return undefined;

				// otherwise, calculate overlap
				overlap = Math.min(max1, max2) - Math.max(min1, min2);

				// test for containment
				if ((min1 > min2 && max1 < max2) || (min1 < min2 && max1 > max2)) {
					diff1 = Math.abs(min1 - min2);
					diff2 = Math.abs(max1 - max2);

					// append smallest difference to overlap, negating the axis if needed
					if (diff1 < diff2) {
						overlap += diff1;
						if (min1 < min2)
							perp.negate();
					} // if
					else {
						overlap += diff2;
						if (max1 < max2)
							perp.negate();
					} // else
				} // if
				else if (min1 > min2) {
					// shortest intersection is in the negative direction relative to perp
					perp.negate();
				} // else if

				// does this axis contain the smallest overlap so far?
				if (overlap < smallest) {
					smallest = overlap;
					mtv = perp;
				} // if
			} // for( i )

			// find closest vertex to cir
			var v = undefined;
			var distSqr = Number.MAX_VALUE;
			for (i = 0; i < v1.length; i++) {
				var d = (cir.x - v1[i].x) * (cir.x - v1[i].x) + (cir.y - v1[i].y) * (cir.y - v1[i].y);
				if (d < distSqr) {
					v = v1[i];
					distSqr = d;
				} // if
			} // for( i )

			// test closest vertex against cir
			//perp = new Vector(-v.y + cir.y, v.x - cir.x).normalize();
			perp = new Vector(cir.x - v.x, cir.y - v.y).normalize();

			// project the polygon onto the new axis (the perpendicular vector)
			min1 = max1 = v1[0].dotProduct(perp);
			for (k = 1; k < v1.length; k++) {
				dp = v1[k].dotProduct(perp);
				min1 = Math.min(min1, dp);
				max1 = Math.max(max1, dp);
			} // for( k )

			// project the circle onto the new axis (the perpendicular vector)
			min2 = cir.getCenter().dotProduct(perp) - cir.r;
			max2 = min2 + 2 * cir.r;

			// break early if projections don't overlap, no intersection exists
			if (max1 < min2 || min1 > max2)
				return undefined;

			// otherwise, calculate overlap
			overlap = Math.min(max1, max2) - Math.max(min1, min2);

			// test for containment
			if ((min1 > min2 && max1 < max2) || (min1 < min2 && max1 > max2)) {
				diff1 = Math.abs(min1 - min2);
				diff2 = Math.abs(max1 - max2);

				// append smallest difference to overlap, negating the axis if needed
				if (diff1 < diff2) {
					overlap += diff1;
					if (min1 < min2)
						perp.negate();
				} // if
				else {
					overlap += diff2;
					if (max1 < max2)
						perp.negate();
				} // else
			} // if
			else if (min1 > min2) {
				// shortest intersection is in the negative direction relative to perp
				perp.negate();
			} // else if

			// does this axis contain the smallest overlap so far?
			if (overlap < smallest) {
				smallest = overlap;
				mtv = perp;
			} // if

			// return the minimum translation vector (MTV)
			// this is the perpendicular axis with the smallest overlap, scaled to said overlap
			return mtv.scaleToMagnitude(smallest);
		}; // _circleVsEdges( )

		// Boolean circleVsPolygon(Circle, Polygon);
		Intersect.circleVsPolygon = function(cir, poly) {
			// quick rejection
			if (!Intersect.circleVsCircle(cir, poly.getBoundingCircle()))
				return false;

			// see http://www.metanetsoftware.com/technique/tutorialA.html#section2
			var v = poly.getVertices();
			var min1, min2, max1, max2, dp, perp;

			// test edges stored in v against cir
			for (var i = 0, j = v.length - 1; i < v.length; j = i++) {
				perp = new Shape2D.Vector(-v[i].y + v[j].y, v[i].x - v[j].x);
				perp.normalize();

				// project vertices of poly onto perp
				min1 = max1 = v[0].dotProduct(perp);
				for (var k = 1; k < v.length; k++) {
					dp = v[k].dotProduct(perp);
					min1 = Math.min(min1, dp);
					max1 = Math.max(max1, dp);
				} // for( k )

				// project cir onto perp
				dp = cir.getCenter().dotProduct(perp);
				min2 = dp - cir.r;
				max2 = dp + cir.r;

				if (max1 < min2 || min1 > max2)
					return false;
			} // for( i )

			// find the vertex closest to cir.center
			var dist = cir.getCenter().distanceSq(v[0]);
			var vertex = v[0];
			for (var i = 1; i < v.length; i++) {
				var tmp = cir.getCenter().distanceSq(v[i]);
				if (tmp < dist) {
					dist = tmp;
					vertex = v[i];
				} // if
			} // for( k )

			// test line cir.center - vertext
			perp = cir.getCenter().subtract(vertex);
			perp.normalize();

			// project vertices of poly onto perp
			min1 = max1 = v[0].dotProduct(perp);
			for (var i = 1; i < v.length; i++) {
				dp = v[i].dotProduct(perp);
				min1 = Math.min(min1, dp);
				max1 = Math.max(max1, dp);
			} // for( k )

			// project cir onto perp
			dp = cir.getCenter().dotProduct(perp);
			min2 = dp - cir.r;
			max2 = dp + cir.r;

			if (max1 < min2 || min1 > max2)
				return false;

			// no separating axis, shapes are intersecting
			return true;
		};

		// Boolean circleVsPolygonSat(Circle, Polygon);
		Intersect.circleVsPolygonSat = function(cir, poly) {
			// coarse test
			if (!Intersect.circleVsCircle(cir, poly.getBoundingCircle()))
				return undefined;

			// fine test
			return Intersect._circleVsEdges(cir, poly.getVertices());
		}; // circleVsPolygonSat( )

		// Boolean circleVsRect(Circle, Rect);
		Intersect.circleVsRect = function(cir, rect) {
			// reorient rect with respect to cir, thus cir is the new origin
			var l = rect.x - cir.x;
			var t = rect.y - cir.y;
			var r = l + rect.w;
			var b = t - rect.h;

			if (r < 0) // rect to left of circle center
				if (t < 0) // rect to lower left
					return (r * r + t * t) < cir.r * cir.r;
				else if (b > 0) // rect to upper left
					return (r * r + b * b) < cir.r * cir.r;
				else // directly left of circle center
					return Math.abs(r) < cir.r;
			else if (l > 0) // rect to the right of circle center
				if (t < 0) // rect to lower right
					return (l * l + t * t) < cir.r * cir.r;
				else if (b > 0) // rect to upper right
					return (l * l + b * b) < cir.r * cir.r;
				else // directly right of circle center
					return Math.abs(l) < cir.r;
			else // rect intersects with y-axis
			if (t < 0) // directly down from circle center
				return Math.abs(t) < cir.r;
			else if (b > 0) // directly up from circle center
				return Math.abs(b) < cir.r;
			else // rect contains circle center
				return true;
		}; // circleVsRect( )

		// Boolean circleVsRectSat(Circle, Rect);
		Intersect.circleVsRectSat = function(cir, rect) {
			// coarse test
			if (!Intersect.circleVsRect(cir, rect))
				return undefined;

			// fine test
			return Intersect._circleVsEdges(cir, rect.getVertices());
		}; // circleVsRectSat( )

		// bool circleVsVector(Circle, Point);
		Intersect.circleVsVector = function(cir, vect) {
			return (vect.x - cir.x) * (vect.x - cir.x) + (vect.y - cir.y) * (vect.y - cir.y) <= cir.r * cir.r;
		}; // circleVsVector( )

		// bool circleVsVectorSat(Circle, Point);
		Intersect.circleVsVectorSat = function(cir, vect) {
			// calculate the vector between the circles' centers
			var dc = new Vector(cir.x - vect.x, cir.y - vect.y);

			// calculate magnitude of dc
			var l = dc.magnitude();

			// if magnitude of dc >= rs, circle does not intersect with vect
			if (l >= cir.r)
				return undefined;

			// scale dc to magnitude of overlap
			dc.scale((cir.r - l) / l);

			// return dc as mtv
			return dc;
		}; // circleVsVectorSat( )

		/**
		 * Takes two collections of vertices and performs polygon-polygon projections intersection on them. Results are
		 * always from the perspective of v1, that is, the minimum translation vector needed to move v1 out of collision
		 * with v2.
		 *
		 * see http://content.gpwiki.org/index.php/Polygon_Collision
		 * see http://www.codezealot.org/archives/55
		 *
		 * @param {Array<Vector>} v1 An array of vertices representing the first polygon
		 * @param {Array<Vector>} v2 An array of vertices representing the second polygon
		 * @return {undefined|Vector} Returns the Minium Translation Vector if the polygons intersect, undefined
		 * otherwise
		 * @private
		 */
		Intersect._edgesVsEdges = function(v1, v2) {
			var perp, min1, min2, max1, max2, dp, i, j, k, overlap, mtv, diff1, diff2;
			var smallest = Number.MAX_VALUE;

			// test edges stored in v1 against edges stored in v2
			for (i = 0, j = v1.length - 1; i < v1.length; j = i++) {
				// calculate normalized vector perpendicular to each line segment of the polygon
				perp = new Vector(-v1[i].y + v1[j].y, v1[i].x - v1[j].x).normalize();

				// assume both poly's have at least one vertex (see Shape2D.Polygon constructor)
				// project the first polygon onto the new axis (the perpendicular vector)
				min1 = max1 = v1[0].dotProduct(perp);
				for (k = 1; k < v1.length; k++) {
					dp = v1[k].dotProduct(perp);
					min1 = Math.min(min1, dp);
					max1 = Math.max(max1, dp);
				} // for( k )

				// project the second polygon onto the new axis (the perpendicular vector)
				min2 = max2 = v2[0].dotProduct(perp);
				for (k = 1; k < v2.length; k++) {
					dp = v2[k].dotProduct(perp);
					min2 = Math.min(min2, dp);
					max2 = Math.max(max2, dp);
				} // for( k )

				// break early if projections don't overlap, no intersection exists
				if (max1 < min2 || min1 > max2)
					return undefined;

				// otherwise, calculate overlap
				overlap = Math.min(max1, max2) - Math.max(min1, min2);

				// test for containment
				if ((min1 > min2 && max1 < max2) || (min1 < min2 && max1 > max2)) {
					diff1 = Math.abs(min1 - min2);
					diff2 = Math.abs(max1 - max2);

					// append smallest difference to overlap, negating the axis if needed
					if (diff1 < diff2) {
						overlap += diff1;
						if (min1 > min2)
							perp.negate();
					} // if
					else {
						overlap += diff2;
						if (max1 > max2)
							perp.negate();
					} // else
				} // if
				else if (min1 < min2) {
					// shortest intersection is in the negative direction relative to perp
					perp.negate();
				} // else if

				// does this axis contain the smallest overlap so far?
				if (overlap < smallest) {
					smallest = overlap;
					mtv = perp;
				} // if
			} // for( i )

			// test edges stored in v2 against edges stored in v1
			for (i = 0, j = v2.length - 1; i < v2.length; j = i++) {
				// calculate normalized vector perpendicular to each line segment of the polygon
				perp = new Vector(-v2[i].y + v2[j].y, v2[i].x - v2[j].x).normalize();

				// assume both poly's have at least one vertex (see Shape2D.Polygon constructor)
				// project the first polygon onto the new axis (the perpendicular vector)
				min1 = max1 = v1[0].dotProduct(perp);
				for (k = 1; k < v1.length; k++) {
					dp = v1[k].dotProduct(perp);
					min1 = Math.min(min1, dp);
					max1 = Math.max(max1, dp);
				} // for( k )

				// project the second polygon onto the new axis (the perpendicular vector)
				min2 = max2 = v2[0].dotProduct(perp);
				for (k = 1; k < v2.length; k++) {
					dp = v2[k].dotProduct(perp);
					min2 = Math.min(min2, dp);
					max2 = Math.max(max2, dp);
				} // for( k )

				// break early if projections don't overlap, no intersection exists
				if (max1 < min2 || min1 > max2)
					return undefined;

				// otherwise, calculate overlap
				overlap = Math.min(max1, max2) - Math.max(min1, min2);

				// test for containment
				if ((min1 > min2 && max1 < max2) || (min1 < min2 && max1 > max2)) {
					diff1 = Math.abs(min1 - min2);
					diff2 = Math.abs(max1 - max2);

					// append smallest difference to overlap, negating the axis if needed
					if (diff1 < diff2) {
						overlap += diff1;
						if (min1 > min2)
							perp.negate();
					} // if
					else {
						overlap += diff2;
						if (max1 > max2)
							perp.negate();
					} // else
				} // if
				else if (min1 < min2) {
					// shortest intersection is in the negative direction relative to perp
					perp.negate();
				} // else if

				// does this axis contain the smallest overlap so far?
				if (overlap < smallest) {
					smallest = overlap;
					mtv = perp;
				} // if
			} // for( i )

			// return the minimum translation vector (MTV)
			// this is the perpendicular axis with the smallest overlap, scaled to said overlap
			return mtv.scaleToMagnitude(smallest);
		}; // _edgesVsEdges( )

		// Boolean polygonVsPolygon(Polygon, Polygon);
		Intersect.polygonVsPolygon = function(poly1, poly2) {
			return Intersect.polygonVsPolygonSat(poly1, poly2) !== undefined;
		};

		// Vector polygonVsPolygonSat(Polygon, Polygon);
		Intersect.polygonVsPolygonSat = function(poly1, poly2) {
			// coarse test
			if (!Intersect.circleVsCircle(poly1.getBoundingCircle(), poly2.getBoundingCircle()))
				return undefined;

			// fine test
			return Intersect._edgesVsEdges(poly1.getVertices(), poly2.getVertices());
		};

		// Boolean polygonVsRect(Polygon, Rect);
		Intersect.polygonVsRect = function(poly, rect) {
			// quick rejection
			if (!Intersect.circleVsRect(poly.getBoundingCircle(), rect))
				return false;

			var v1 = poly.getVertices();
			var v2 = rect.getVertices();

			// check v1 against v2 and v2 against v1
			// boolean short-circuit allows calling both functions only when needed
			return Intersect._verticesVsVertices(v1, v2) && Intersect._verticesVsVertices(v2, v1);
		};

		// Boolean polygonVsRectSat(Polygon, Rect);
		Intersect.polygonVsRectSat = function(poly, rect) {
			// coarse test
			if (!Intersect.circleVsRect(poly.getBoundingCircle(), rect))
				return undefined;

			// fine test
			return Intersect._edgesVsEdges(poly.getVertices(), rect.getVertices());
		}; // polygonVsRectSat( )

		// Boolean polygonVsVector(Polygon, Vector);
		Intersect.polygonVsVector = function(poly, vect) {
			// quick rejection
			if (!Intersect.circleVsVector(poly.getBoundingCircle(), vect))
				return false;

			// using Point Inclusion in Polygon test (aka Crossing test)
			var c = false;
			var v = poly.getVertices();
			for (var i = 0, j = v.length - 1; i < v.length; j = i++) {
				if (((v[i].y > vect.y) != (v[j].y > vect.y)) &&
					(vect.x < (v[j].x - v[i].x) * (vect.y - v[i].y) / (v[j].y - v[i].y) + v[i].x))
					c = !c;
			} // for( i )

			return c;
		};

		// Boolean polygonVsVectorSat(Polygon, Vector);
		Intersect.polygonVsVectorSat = function(poly, vect) {
			// coarse test
			if (!Intersect.circleVsVector(poly.getBoundingCircle(), vect))
				return undefined;

			// fine test
			return Intersect._edgesVsEdges(poly.getVertices(), [vect]);
		}; // polygonVsVectorSat( )

		// Boolean rectVsRect(Rect, Rect);
		Intersect.rectVsRect = function(rect1, rect2) {
			return (rect1.x <= rect2.x + rect2.w &&
				rect1.x + rect1.w >= rect2.x &&
				rect1.y >= rect2.y - rect2.h &&
				rect1.y - rect1.h <= rect2.y)
		}; // rectVsRect( )

		// Boolean rectVsRectSat(Rect, Rect);
		Intersect.rectVsRectSat = function(rect1, rect2) {
			// coarse test
			if (!Intersect.rectVsRect(rect1, rect2))
				return undefined;

			// fine test
			return Intersect._edgesVsEdges(rect1.getVertices(), rect2.getVertices());
		}; // rectVsRectSat( )

		// Boolean rectVsVector(Rect, Vector);
		Intersect.rectVsVector = function(rect, vect) {
			return vect.x >= rect.x && vect.x <= rect.x + rect.w &&
				vect.y <= rect.y && vect.y >= rect.y - rect.h;
		}; // rectVsVector( )

		// Boolean rectVsVectorSat(Rect, Vector);
		Intersect.rectVsVectorSat = function(rect, vect) {
			// coarse test
			if (!Intersect.rectVsVector(rect, vect))
				return undefined;

			// fine test
			return Intersect._edgesVsEdges(rect.getVertices(), [vect]);
		}; // rectVsVectorSat( )

		// Boolean shapeVsShape(IShape, IShape);
		Intersect.shapeVsShape = function(shape1, shape2) {
			return _shapeMap[shape1.getShapeID()][shape2.getShapeID()](shape1, shape2);
		}; // shapeVsShape( )

		// Boolean shapeVsShapeSat(IShape, IShape);
		Intersect.shapeVsShapeSat = function(shape1, shape2) {
			return _shapeMapSat[shape1.getShapeID()][shape2.getShapeID()](shape1, shape2);
		}; // shapeVsShape( )

		// Boolean vectorVsVector(Vector, Vector);
		Intersect.vectorVsVector = function(vect1, vect2) {
			return vect1.equals(vect2);
		};

		// Boolean vectorVsVectorSat(Vector, Vector);
		Intersect.vectorVsVectorSat = function(vect1, vect2) {
			return vect1.equals(vect2) ? new Shape2D.Vector(0, 0) : undefined;
		};

		// Boolean _verticesVsVertices(Array<Vector>, Array<Vector>);
		Intersect._verticesVsVertices = function(v1, v2) {
			var min1, min2, max1, max2, dp;

			// test edges stored in v1 against edges stored in v2
			var perp;
			for (var i = 0, j = v1.length - 1; i < v1.length; j = i++) {
				perp = new Shape2D.Vector(-v1[i].y + v1[j].y, v1[i].x - v1[j].x);

				var k;
				min1 = max1 = v1[0].dotProduct(perp);
				for (k = 1; k < v1.length; k++) {
					dp = v1[k].dotProduct(perp);
					min1 = Math.min(min1, dp);
					max1 = Math.max(max1, dp);
				} // for( k )

				// assume both poly's have at least one vertex (see Shape2D.Polygon constructor)
				min2 = max2 = v2[0].dotProduct(perp);
				for (k = 1; k < v2.length; k++) {
					dp = v2[k].dotProduct(perp);
					min2 = Math.min(min2, dp);
					max2 = Math.max(max2, dp);
				} // for( k )

				if (max1 < min2 || min1 > max2)
					return false;
			} // for( i )

			return true;
		}; // _verticesVsVertices( )

		// init shapeMap
		_shapeMap[_shapeID.Circle] = [];
		_shapeMap[_shapeID.Circle][_shapeID.Circle] = Intersect.circleVsCircle;
		_shapeMap[_shapeID.Circle][_shapeID.Polygon] = Intersect.circleVsPolygon;
		_shapeMap[_shapeID.Circle][_shapeID.Rect] = Intersect.circleVsRect;
		_shapeMap[_shapeID.Circle][_shapeID.Vector] = Intersect.circleVsVector;
		_shapeMap[_shapeID.Polygon] = [];
		_shapeMap[_shapeID.Polygon][_shapeID.Circle] = function(p, c) { return Intersect.circleVsPolygon(c, p); };
		_shapeMap[_shapeID.Polygon][_shapeID.Polygon] = Intersect.polygonVsPolygon;
		_shapeMap[_shapeID.Polygon][_shapeID.Rect] = Intersect.polygonVsRect;
		_shapeMap[_shapeID.Polygon][_shapeID.Vector] = Intersect.polygonVsVector;
		_shapeMap[_shapeID.Rect] = [];
		_shapeMap[_shapeID.Rect][_shapeID.Circle] = function(r, c) { return Intersect.circleVsRect(c, r); };
		_shapeMap[_shapeID.Rect][_shapeID.Polygon] = function(r, p) { return Intersect.polygonVsRect(p, r); };
		_shapeMap[_shapeID.Rect][_shapeID.Rect] = Intersect.rectVsRect;
		_shapeMap[_shapeID.Rect][_shapeID.Vector] = Intersect.rectVsVector;
		_shapeMap[_shapeID.Vector] = [];
		_shapeMap[_shapeID.Vector][_shapeID.Circle] = function(v, c) { return Intersect.circleVsVector(c, v); };
		_shapeMap[_shapeID.Vector][_shapeID.Polygon] = function(v, p) { return Intersect.polygonVsVector(p, v); };
		_shapeMap[_shapeID.Vector][_shapeID.Rect] = function(v, r) { return Intersect.rectVsVector(r, v); };
		_shapeMap[_shapeID.Vector][_shapeID.Vector] = Intersect.vectorVsVector;

		// init shapeMapSat
		_shapeMapSat[_shapeID.Circle] = [];
		_shapeMapSat[_shapeID.Circle][_shapeID.Circle] = Intersect.circleVsCircleSat;
		_shapeMapSat[_shapeID.Circle][_shapeID.Polygon] = Intersect.circleVsPolygonSat;
		_shapeMapSat[_shapeID.Circle][_shapeID.Rect] = Intersect.circleVsRectSat;
		_shapeMapSat[_shapeID.Circle][_shapeID.Vector] = Intersect.circleVsVectorSat;
		_shapeMapSat[_shapeID.Polygon] = [];
		_shapeMapSat[_shapeID.Polygon][_shapeID.Circle] = function(p, c) {
			var mtv = Intersect.circleVsPolygonSat(c, p);
			return mtv === undefined ? undefined : mtv.negate();
		};
		_shapeMapSat[_shapeID.Polygon][_shapeID.Polygon] = Intersect.polygonVsPolygonSat;
		_shapeMapSat[_shapeID.Polygon][_shapeID.Rect] = Intersect.polygonVsRectSat;
		_shapeMapSat[_shapeID.Polygon][_shapeID.Vector] = Intersect.polygonVsVectorSat;
		_shapeMapSat[_shapeID.Rect] = [];
		_shapeMapSat[_shapeID.Rect][_shapeID.Circle] = function(r, c) {
			var mtv = Intersect.circleVsRectSat(c, r);
			return mtv === undefined ? undefined : mtv.negate();
		};
		_shapeMapSat[_shapeID.Rect][_shapeID.Polygon] = function(r, p) {
			var mtv = Intersect.polygonVsRectSat(p, r);
			return mtv === undefined ? undefined : mtv.negate();
		};
		_shapeMapSat[_shapeID.Rect][_shapeID.Rect] = Intersect.rectVsRectSat;
		_shapeMapSat[_shapeID.Rect][_shapeID.Vector] = Intersect.rectVsVectorSat;
		_shapeMapSat[_shapeID.Vector] = [];
		_shapeMapSat[_shapeID.Vector][_shapeID.Circle] = function(v, c) {
			var mtv = Intersect.circleVsVectorSat(c, v);
			return mtv === undefined ? undefined : mtv.negate();
		};
		_shapeMapSat[_shapeID.Vector][_shapeID.Polygon] = function(v, p) {
			var mtv = Intersect.polygonVsVectorSat(p, v);
			return mtv === undefined ? undefined : mtv.negate();
		};
		_shapeMapSat[_shapeID.Vector][_shapeID.Rect] = function(v, r) {
			var mtv = Intersect.rectVsVectorSat(r, v);
			return mtv === undefined ? undefined : mtv.negate();
		};
		_shapeMapSat[_shapeID.Vector][_shapeID.Vector] = Intersect.vectorVsVectorSat;

		return Intersect;
	});

	Shape2D.IShape = (function() {
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
	});

	Shape2D.Matrix = (function() {
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
			return new Shape2D.Vector(
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
			return new Shape2D.Vector(this.e, this.f);
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

		return Matrix;
	});

	Shape2D.Polygon = (function() {
		// Polygon(Polygon);
		// Polygon(Array<Vector>);
		var Polygon = function(polygon) {
			if (polygon instanceof Polygon) {
				if (polygon._center !== undefined)
					this._center = polygon._center.clone();
				this._r = polygon._r;
				polygon = polygon._vertices;
			} // if

			// make sure there are at least 3 vertices
			if (polygon.length < 3)
				throw "Cannot construct polygon with fewer than 3 vertices!";

			// deep copy vertex array
			this._vertices = [];
			for (var i = 0; i < polygon.length; i++) {
				this._vertices.push(new Shape2D.Vector(polygon[i]));
			} // for( i )
		}; // class Polygon

		Polygon.prototype = new Shape2D.IShape();
		Polygon.prototype._center = undefined;
		Polygon.prototype._r = -1;
		Polygon.prototype._vertices = undefined;

		// Polygon applyTransform();
		Polygon.prototype.applyTransform = function(matrix) {
			for (var i = 0; i < this._vertices.length; i++) {
				this._vertices[i].applyTransform(matrix);
			} // for( i )

			// invalidate caches
			this._center = undefined;
			this._r = -1;

			return this;
		}; // applyTransform

		Polygon.prototype.clone = function() {
			return new Polygon(this);
		}; // clone( )

		Polygon.prototype.equals = function(polygon) {
			if (!(polygon instanceof Polygon) || this._vertices.length != polygon._vertices.length)
				return false;

			for (var i = 0; i < this._vertices.length; i++) {
				if (!this._vertices[i].equals(polygon._vertices[i]))
					return false;
			} // for( i )

			return true;
		}; // equals( )

		Polygon.prototype.getBoundingCircle = function() {
			return new Shape2D.Circle(this.getCenter(), this._getRadius());
		};

		Polygon.prototype.getCenter = function() {
			if (this._center === undefined) {
				var x = 0;
				var y = 0;

				for (var i = 0; i < this._vertices.length; i ++) {
					x += this._vertices[i].x;
					y += this._vertices[i].y;
				} // for( i )

				this._center = new Shape2D.Vector(x / this._vertices.length, y / this._vertices.length);
			} // if

			return this._center.clone();
		}; // getCenter( )

		// Number _getRadius();
		Polygon.prototype._getRadius = function() {
			if (this._r === -1) {
				var c = this.getCenter();
				var r = 0;
				var tmp;
				var v;
				for (var i = 0; i < this._vertices.length; i++) {
					v = this._vertices[i];
					tmp = (v.x - c.x) * (v.x - c.x) + (v.y - c.y) * (v.y - c.y);
					if (tmp > r)
						r = tmp;
				} // for( i )

				// update cached radius
				this._r = Math.sqrt(r);
			} // if

			return this._r;
		}; // _getRadius( )

		// Number getShapeID();
		Polygon.prototype.getShapeID = function() {
			return _shapeID.Polygon;
		}; // getShapeID( )

		// Array<Vector> getVertices();
		Polygon.prototype.getVertices = function() {
			return this._vertices.slice();
		}; // getVertices( )

		// Polygon setCenter(Number, Number);
		// Polygon setCenter(Vector);
		Polygon.prototype.setCenter = function(x, y) {
			// calculate offset from old center
			var offset = this.getCenter();
			if (x instanceof Shape2D.Vector) {
				offset.x = x.x - offset.x;
				offset.y = x.y - offset.y;
				
				// update cached center point
				this._center = x;
			} else {
				offset.x = x - offset.x;
				offset.y = y - offset.y;
				
				// update cached center point
				this._center = new Shape2D.Vector(x, y);
			} // else

			// update polygon vertices with new offset
			for (var i = 0; i < this._vertices.length; i++) {
				this._vertices[i].x += offset.x;
				this._vertices[i].y += offset.y;
			} // for( i )

			return this;
		}; // setCenter( )

		Polygon.prototype.toString = function() {
			var s = "Polygon(";

			for (var i = 0; i < this._vertices.length; i++) {
				s += "<" + this._vertices[i].x + "," + this._vertices[i].y + ">,"
			} // for( i )

			return s.replace(/,$/, "") + ")";
		}; // toString( )

		return Polygon;
	});

	Shape2D.Rect = (function() {
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

		Rect.prototype = new Shape2D.IShape();
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

		// Vector getCenter();
		Rect.prototype.getCenter = function() {
			return new Shape2D.Vector(this.x + this.w/2, this.y - this.h/2);
		}; // getCenter( )

		// Number getShapeID();
		Rect.prototype.getShapeID = function() {
			return _shapeID.Rect;
		}; // getShapeID( )

		Rect.prototype.getVertices = function() {
			return [
				new Shape2D.Vector(this.x, this.y),
				new Shape2D.Vector(this.x + this.w, this.y),
				new Shape2D.Vector(this.x + this.w, this.y - this.h),
				new Shape2D.Vector(this.x, this.y - this.h)
			];
		}; // getVertices( )

		// Rect setCenter(Vector);
		Rect.prototype.setCenter = function(x, y) {
			if (x instanceof Shape2D.Vector) {
				this.x = x.x - this.w/2;
				this.y = x.y + this.h/2;
			} else {
				this.x = x - this.w/2;
				this.y = y + this.h/2;
			} // if/else

			return this;
		} // setCenter( )

		// String toString();
		Rect.prototype.toString = function() {
			return "Rect(" + this.x + ", " + this.y + ", " + this.w + ", " + this.h + ")";
		} // toString( )

		return Rect;
	});

	Shape2D.Vector = (function() {
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
			} else if (arguments.length === 2) {
				this.x = x;
				this.y = y;
			} else if (arguments.length > 0)
				throw "Unexpected number of arguments for Vector()";
		}; // class Vector

		Vector.shapeID = _shapeID.Vector;
		Vector.prototype = new Shape2D.IShape();
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
			return _shapeID.Vector;
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
		 * For vectors where magnitude is 0, <1,0> is returned.
		 *
		 * @public
		 * @sig public {Vector} normalize();
		 * @returns {Vector} this vector after normalization
		 */
		Vector.prototype.normalize = function() {
			var lng = Math.sqrt(this.x * this.x + this.y * this.y);

			if (lng === 0) {
				// default due East
				this.x = 1;
				this.y = 0;
			} else {
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
			var k = mag / this.magnitude();
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
	});

	// init in the correct order
	Shape2D.IShape = Shape2D.IShape();
	Shape2D.Circle = Shape2D.Circle(); // requires IShape
	Shape2D.Rect = Shape2D.Rect(); // requires IShape
	Shape2D.Vector = Shape2D.Vector(); // requires IShape
	Shape2D.Polygon = Shape2D.Polygon(); // requires Vector
	Shape2D.Matrix = Shape2D.Matrix(); // requires Vector
	Shape2D.Intersect = Shape2D.Intersect(); // requires Circle, Polygon, Rect, Vector, Intersection

	return Shape2D;
});
