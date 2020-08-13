import { ShapeId } from "./shape";
import { Vector } from "./vector";

export const Intersect = (function() {
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
			perp = new Vector(-v[i].y + v[j].y, v[i].x - v[j].x);
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
		return vect1.equals(vect2) ? new Vector(0, 0) : undefined;
	};

	// Boolean _verticesVsVertices(Array<Vector>, Array<Vector>);
	Intersect._verticesVsVertices = function(v1, v2) {
		var min1, min2, max1, max2, dp;

		// test edges stored in v1 against edges stored in v2
		var perp;
		for (var i = 0, j = v1.length - 1; i < v1.length; j = i++) {
			perp = new Vector(-v1[i].y + v1[j].y, v1[i].x - v1[j].x);

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
	_shapeMap[ShapeId.Circle] = [];
	_shapeMap[ShapeId.Circle][ShapeId.Circle] = Intersect.circleVsCircle;
	_shapeMap[ShapeId.Circle][ShapeId.Polygon] = Intersect.circleVsPolygon;
	_shapeMap[ShapeId.Circle][ShapeId.Rect] = Intersect.circleVsRect;
	_shapeMap[ShapeId.Circle][ShapeId.Vector] = Intersect.circleVsVector;
	_shapeMap[ShapeId.Polygon] = [];
	_shapeMap[ShapeId.Polygon][ShapeId.Circle] = function(p, c) { return Intersect.circleVsPolygon(c, p); };
	_shapeMap[ShapeId.Polygon][ShapeId.Polygon] = Intersect.polygonVsPolygon;
	_shapeMap[ShapeId.Polygon][ShapeId.Rect] = Intersect.polygonVsRect;
	_shapeMap[ShapeId.Polygon][ShapeId.Vector] = Intersect.polygonVsVector;
	_shapeMap[ShapeId.Rect] = [];
	_shapeMap[ShapeId.Rect][ShapeId.Circle] = function(r, c) { return Intersect.circleVsRect(c, r); };
	_shapeMap[ShapeId.Rect][ShapeId.Polygon] = function(r, p) { return Intersect.polygonVsRect(p, r); };
	_shapeMap[ShapeId.Rect][ShapeId.Rect] = Intersect.rectVsRect;
	_shapeMap[ShapeId.Rect][ShapeId.Vector] = Intersect.rectVsVector;
	_shapeMap[ShapeId.Vector] = [];
	_shapeMap[ShapeId.Vector][ShapeId.Circle] = function(v, c) { return Intersect.circleVsVector(c, v); };
	_shapeMap[ShapeId.Vector][ShapeId.Polygon] = function(v, p) { return Intersect.polygonVsVector(p, v); };
	_shapeMap[ShapeId.Vector][ShapeId.Rect] = function(v, r) { return Intersect.rectVsVector(r, v); };
	_shapeMap[ShapeId.Vector][ShapeId.Vector] = Intersect.vectorVsVector;

	// init shapeMapSat
	_shapeMapSat[ShapeId.Circle] = [];
	_shapeMapSat[ShapeId.Circle][ShapeId.Circle] = Intersect.circleVsCircleSat;
	_shapeMapSat[ShapeId.Circle][ShapeId.Polygon] = Intersect.circleVsPolygonSat;
	_shapeMapSat[ShapeId.Circle][ShapeId.Rect] = Intersect.circleVsRectSat;
	_shapeMapSat[ShapeId.Circle][ShapeId.Vector] = Intersect.circleVsVectorSat;
	_shapeMapSat[ShapeId.Polygon] = [];
	_shapeMapSat[ShapeId.Polygon][ShapeId.Circle] = function(p, c) {
		var mtv = Intersect.circleVsPolygonSat(c, p);
		return mtv === undefined ? undefined : mtv.negate();
	};
	_shapeMapSat[ShapeId.Polygon][ShapeId.Polygon] = Intersect.polygonVsPolygonSat;
	_shapeMapSat[ShapeId.Polygon][ShapeId.Rect] = Intersect.polygonVsRectSat;
	_shapeMapSat[ShapeId.Polygon][ShapeId.Vector] = Intersect.polygonVsVectorSat;
	_shapeMapSat[ShapeId.Rect] = [];
	_shapeMapSat[ShapeId.Rect][ShapeId.Circle] = function(r, c) {
		var mtv = Intersect.circleVsRectSat(c, r);
		return mtv === undefined ? undefined : mtv.negate();
	};
	_shapeMapSat[ShapeId.Rect][ShapeId.Polygon] = function(r, p) {
		var mtv = Intersect.polygonVsRectSat(p, r);
		return mtv === undefined ? undefined : mtv.negate();
	};
	_shapeMapSat[ShapeId.Rect][ShapeId.Rect] = Intersect.rectVsRectSat;
	_shapeMapSat[ShapeId.Rect][ShapeId.Vector] = Intersect.rectVsVectorSat;
	_shapeMapSat[ShapeId.Vector] = [];
	_shapeMapSat[ShapeId.Vector][ShapeId.Circle] = function(v, c) {
		var mtv = Intersect.circleVsVectorSat(c, v);
		return mtv === undefined ? undefined : mtv.negate();
	};
	_shapeMapSat[ShapeId.Vector][ShapeId.Polygon] = function(v, p) {
		var mtv = Intersect.polygonVsVectorSat(p, v);
		return mtv === undefined ? undefined : mtv.negate();
	};
	_shapeMapSat[ShapeId.Vector][ShapeId.Rect] = function(v, r) {
		var mtv = Intersect.rectVsVectorSat(r, v);
		return mtv === undefined ? undefined : mtv.negate();
	};
	_shapeMapSat[ShapeId.Vector][ShapeId.Vector] = Intersect.vectorVsVectorSat;

	return Intersect;
})();
