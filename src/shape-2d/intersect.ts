import { Circle } from "./circle";
import { Polygon } from "./polygon";
import { Rect } from "./rect";
import { Shape2d, ShapeId } from "./shape-2d";
import { Vector } from "./vector";

function circleVsCircle(cir1: Circle, cir2: Circle): boolean {
	// compare the squared distance between circle centers to the squared combined radii
	let dx = cir2.x - cir1.x;
	let dy = cir2.y - cir1.y;
	let rs = cir1.r + cir2.r;

	return dx * dx + dy * dy < rs * rs;
}

function circleVsCircleSat(cir1: Circle, cir2: Circle): Vector | undefined {
	// calculate the vector between the circles' centers
	let dc = new Vector(cir1.x - cir2.x, cir1.y - cir2.y);

	// calculate magnitude of dc and combined radii
	let l = dc.magnitude();
	let rs = cir1.r + cir2.r;

	// if magnitude of dc >= rs, circles do not intersect
	if (l >= rs)
		return undefined;

	// circles intersect
	// scale dc to magnitude of overlap
	dc.scale((rs - l) / l);

	// return dc as projection, and negative, normalized dc as surface normal
	return dc;
}

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
function _circleVsEdges(cir: Circle, v1: Vector[]): Vector | undefined {
	let perp, min1, min2, max1, max2, dp, i, j, k, overlap, diff1, diff2;
	let mtv = new Vector();
	let smallest = Number.MAX_VALUE;

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
	let v = v1[0];
	let distSqr = Number.MAX_VALUE;
	for (i = 0; i < v1.length; i++) {
		let d = (cir.x - v1[i].x) * (cir.x - v1[i].x) + (cir.y - v1[i].y) * (cir.y - v1[i].y);
		if (d < distSqr) {
			v = v1[i];
			distSqr = d;
		} // if
	} // for( i )

	// test closest vertex against cir
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
}

function circleVsPolygon(cir: Circle, poly: Polygon): boolean {
	// quick rejection
	if (!circleVsCircle(cir, poly.getBoundingCircle()))
		return false;

	// see http://www.metanetsoftware.com/technique/tutorialA.html#section2
	let v = poly.getVertices();
	let min1, min2, max1, max2, dp, perp;

	// test edges stored in v against cir
	for (let i = 0, j = v.length - 1; i < v.length; j = i++) {
		perp = new Vector(-v[i].y + v[j].y, v[i].x - v[j].x);
		perp.normalize();

		// project vertices of poly onto perp
		min1 = max1 = v[0].dotProduct(perp);
		for (let k = 1; k < v.length; k++) {
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
	let dist = cir.getCenter().distanceSq(v[0]);
	let vertex = v[0];
	for (let i = 1; i < v.length; i++) {
		let tmp = cir.getCenter().distanceSq(v[i]);
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
	for (let i = 1; i < v.length; i++) {
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
}

function circleVsPolygonSat(cir: Circle, poly: Polygon): Vector | undefined {
	// coarse test
	if (!circleVsCircle(cir, poly.getBoundingCircle()))
		return undefined;

	// fine test
	return _circleVsEdges(cir, poly.getVertices());
}

function circleVsRect(cir: Circle, rect: Rect): boolean {
	// reorient rect with respect to cir, thus cir is the new origin
	let l = rect.l - cir.x;
	let t = rect.t - cir.y;
	let r = l + rect.w;
	let b = t - rect.h;

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
}

function circleVsRectSat(cir: Circle, rect: Rect): Vector | undefined {
	// coarse test
	if (!circleVsRect(cir, rect))
		return undefined;

	// fine test
	return _circleVsEdges(cir, rect.getVertices());
}

function circleVsVector(cir: Circle, vect: Vector): boolean {
	let dx = vect.x - cir.x;
	let dy = vect.y - cir.y;

	return dx * dx + dy * dy <= cir.r * cir.r;
}

function circleVsVectorSat(cir: Circle, vect: Vector): Vector | undefined {
	// calculate the vector between the circles' centers
	let dc = new Vector(cir.x - vect.x, cir.y - vect.y);

	// calculate magnitude of dc
	let l = dc.magnitude();

	// if magnitude of dc >= rs, circle does not intersect with vect
	if (l >= cir.r)
		return undefined;

	// scale dc to magnitude of overlap
	dc.scale((cir.r - l) / l);

	// return dc as mtv
	return dc;
}

/**
 * Takes two collections of vertices and performs polygon-polygon projections intersection
 * on them. Results are always from the perspective of v1, that is, the minimum translation
 * vector needed to move v1 out of collision with v2.
 *
 * see http://content.gpwiki.org/index.php/Polygon_Collision
 * see http://www.codezealot.org/archives/55
 *
 * @param {Array<Vector>} v1 An array of vertices representing the first polygon
 * @param {Array<Vector>} v2 An array of vertices representing the second polygon
 * @return {undefined|Vector} Returns the Minium Translation Vector if the polygons
 * intersect, undefined otherwise
 * @private
 */
function _edgesVsEdges(v1: Vector[], v2: Vector[]): Vector | undefined {
	let perp, min1, min2, max1, max2, dp, i, j, k, overlap, diff1, diff2;
	let mtv = new Vector();
	let smallest = Number.MAX_VALUE;

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
}

/**
 * Performs a projection intersection between a convex polygon and a single vertex.
 * Results are always from the perspective of p, that is, the minimum translation
 * vector needed to move p out of collision with v.
 *
 * see http://content.gpwiki.org/index.php/Polygon_Collision
 * see http://www.codezealot.org/archives/55
 *
 * @param {Array<Vector>} p An array of vertices representing a polygon
 * @param {Vector} v A single vertex
 * @return {undefined|Vector} Returns the Minium Translation Vector if there is an
 * intersection, undefined otherwise
 * @private
 */
function _edgesVsVector(p: Vector[], v: Vector): Vector | undefined {
	let i, j;
	let mtv = new Vector();
	let smallest = Number.MAX_VALUE;

	// test edges stored in p against v
	for (i = 0, j = p.length - 1; i < p.length; j = i++) {
		// calculate normalized vector perpendicular to each line segment of the polygon
		let perp = new Vector(-p[i].y + p[j].y, p[i].x - p[j].x).normalize();

		// assume both poly's have at least one vertex (see Polygon constructor)
		// project the first polygon onto the new axis (the perpendicular vector)
		let p_min = p[0].dotProduct(perp);
		let p_max = p_min;
		for (let k = 1; k < p.length; k++) {
			let dist = p[k].dotProduct(perp);
			p_min = Math.min(p_min, dist);
			p_max = Math.max(p_max, dist);
		}

		// project the v onto the new axis (the perpendicular vector)
		let v_dist = v.dotProduct(perp);

		// break early if projections don't overlap, no intersection exists
		if (p_min > v_dist || v_dist > p_max)
			return undefined;

		// otherwise, calculate overlap
		let diff1 = v_dist - p_min;
		let diff2 = p_max - v_dist;
		let overlap;

		// append smallest difference to overlap, negating the axis if needed
		if (diff1 <= diff2) {
			overlap = diff1;
		} else {
			overlap = diff2;
			perp.negate();
		}

		// does this axis contain the smallest overlap so far?
		if (overlap < smallest) {
			smallest = overlap;
			mtv = perp;
		}
	}

	// return the minimum translation vector (MTV)
	// this is the perpendicular axis with the smallest overlap, scaled to said overlap
	return mtv.scaleToMagnitude(smallest);
}

function polygonVsPolygon(poly1: Polygon, poly2: Polygon): boolean {
	return polygonVsPolygonSat(poly1, poly2) !== undefined;
}

function polygonVsPolygonSat(poly1: Polygon, poly2: Polygon): Vector | undefined {
	// coarse test
	if (!circleVsCircle(poly1.getBoundingCircle(), poly2.getBoundingCircle()))
		return undefined;

	// fine test
	return _edgesVsEdges(poly1.getVertices(), poly2.getVertices());
}

function polygonVsRect(poly: Polygon, rect: Rect): boolean {
	// quick rejection
	if (!circleVsRect(poly.getBoundingCircle(), rect))
		return false;

	let v1 = poly.getVertices();
	let v2 = rect.getVertices();

	// check v1 against v2 and v2 against v1
	// boolean short-circuit allows calling both functions only when needed
	return _verticesVsVertices(v1, v2) && _verticesVsVertices(v2, v1);
}

function polygonVsRectSat(poly: Polygon, rect: Rect): Vector | undefined {
	// coarse test
	if (!circleVsRect(poly.getBoundingCircle(), rect))
		return undefined;

	// fine test
	return _edgesVsEdges(poly.getVertices(), rect.getVertices());
}

function polygonVsVector(poly: Polygon, vect: Vector): boolean {
	// quick rejection
	if (!circleVsVector(poly.getBoundingCircle(), vect))
		return false;

	// using Point Inclusion in Polygon test (aka Crossing test)
	let c = false;
	let v = poly.getVertices();
	for (let i = 0, j = v.length - 1; i < v.length; j = i++) {
		if (((v[i].y > vect.y) != (v[j].y > vect.y)) &&
			(vect.x < (v[j].x - v[i].x) * (vect.y - v[i].y) / (v[j].y - v[i].y) + v[i].x))
			c = !c;
	} // for( i )

	return c;
}

function polygonVsVectorSat(poly: Polygon, vect: Vector): Vector | undefined {
	// coarse test
	if (!circleVsVector(poly.getBoundingCircle(), vect))
		return undefined;

	// fine test
	return _edgesVsVector(poly.getVertices(), vect);
}

function rectVsRect(rect1: Rect, rect2: Rect): boolean {
	return !(
		rect1.l > rect2.r ||
		rect1.r < rect2.l ||
		rect1.t < rect2.b ||
		rect1.b > rect2.r
	);
}

function rectMtvFromDeltas(l: number, t: number, r: number, b: number): Vector | undefined {
	if (l > 0 || t < 0 || r < 0 || b > 0)
		return undefined;

	let smallest = -l;
	let mtv = new Vector(-l, 0);

	if (t < smallest) {
		smallest = t;
		mtv.set(0, -t);
	}

	if (r < smallest) {
		smallest = r;
		mtv.set(-r, 0);
	}

	if (-b < smallest)
		mtv.set(0, -b);

	return mtv;
}

function rectVsRectSat(rect1: Rect, rect2: Rect): Vector | undefined {
	let dl = rect1.l - rect2.r;
	let dt = rect1.t - rect2.b;
	let dr = rect1.r - rect2.l;
	let db = rect1.b - rect2.t;

	return rectMtvFromDeltas(dl, dt, dr, db);
}

function rectVsVector(rect: Rect, vect: Vector): boolean {
	return !(
		vect.x < rect.l ||
		vect.x > rect.r ||
		vect.y < rect.b ||
		vect.y > rect.t
	);
}

function rectVsVectorSat(rect: Rect, vect: Vector): Vector | undefined {
	// re-orient rect relative to vect
	let l = rect.l - vect.x;
	let b = rect.b - vect.y;
	let r = l + rect.w;
	let t = b + rect.h;

	return rectMtvFromDeltas(l, t, r, b);
}

function vectorVsVector(vect1: Vector, vect2: Vector): boolean {
	return vect1.equals(vect2);
}

function vectorVsVectorSat(vect1: Vector, vect2: Vector): Vector | undefined {
	return vect1.equals(vect2) ? new Vector(0, 0) : undefined;
}

function _verticesVsVertices(v1: Vector[], v2: Vector[]): boolean {
	let min1, min2, max1, max2, dp;

	// test edges stored in v1 against edges stored in v2
	let perp;
	for (let i = 0, j = v1.length - 1; i < v1.length; j = i++) {
		perp = new Vector(-v1[i].y + v1[j].y, v1[i].x - v1[j].x);

		let k;
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
}

type intersectTest = (shape1: any, shape2: any) => boolean;
let shapeMap: any[] = [];
shapeMap[ShapeId.Circle] = [];
shapeMap[ShapeId.Circle][ShapeId.Circle] = circleVsCircle;
shapeMap[ShapeId.Circle][ShapeId.Polygon] = circleVsPolygon;
shapeMap[ShapeId.Circle][ShapeId.Rect] = circleVsRect;
shapeMap[ShapeId.Circle][ShapeId.Vector] = circleVsVector;
shapeMap[ShapeId.Polygon] = [];
shapeMap[ShapeId.Polygon][ShapeId.Circle] = (p: any, c: any) => circleVsPolygon(c, p);
shapeMap[ShapeId.Polygon][ShapeId.Polygon] = polygonVsPolygon;
shapeMap[ShapeId.Polygon][ShapeId.Rect] = polygonVsRect;
shapeMap[ShapeId.Polygon][ShapeId.Vector] = polygonVsVector;
shapeMap[ShapeId.Rect] = [];
shapeMap[ShapeId.Rect][ShapeId.Circle] = (r: any, c: any) => circleVsRect(c, r);
shapeMap[ShapeId.Rect][ShapeId.Polygon] = (r: any, p: any) => polygonVsRect(p, r);
shapeMap[ShapeId.Rect][ShapeId.Rect] = rectVsRect;
shapeMap[ShapeId.Rect][ShapeId.Vector] = rectVsVector;
shapeMap[ShapeId.Vector] = [];
shapeMap[ShapeId.Vector][ShapeId.Circle] = (v: any, c: any) => circleVsVector(c, v);
shapeMap[ShapeId.Vector][ShapeId.Polygon] = (v: any, p: any) => polygonVsVector(p, v);
shapeMap[ShapeId.Vector][ShapeId.Rect] = (v: any, r: any) => rectVsVector(r, v);
shapeMap[ShapeId.Vector][ShapeId.Vector] = vectorVsVector;

function shapeVsShape(shape1: Shape2d, shape2: Shape2d): boolean {
	return shapeMap[shape1.getShapeId()][shape2.getShapeId()](shape1, shape2);
}

type intersectSatTest = (shape1: any, shape2: any) => Vector | undefined;
let shapeMapSat: intersectSatTest[][] = [];
shapeMapSat[ShapeId.Circle] = [];
shapeMapSat[ShapeId.Circle][ShapeId.Circle] = circleVsCircleSat;
shapeMapSat[ShapeId.Circle][ShapeId.Polygon] = circleVsPolygonSat;
shapeMapSat[ShapeId.Circle][ShapeId.Rect] = circleVsRectSat;
shapeMapSat[ShapeId.Circle][ShapeId.Vector] = circleVsVectorSat;
shapeMapSat[ShapeId.Polygon] = [];
shapeMapSat[ShapeId.Polygon][ShapeId.Circle] =
	(p: any, c: any) => circleVsPolygonSat(c, p)?.negate();
shapeMapSat[ShapeId.Polygon][ShapeId.Polygon] = polygonVsPolygonSat;
shapeMapSat[ShapeId.Polygon][ShapeId.Rect] = polygonVsRectSat;
shapeMapSat[ShapeId.Polygon][ShapeId.Vector] = polygonVsVectorSat;
shapeMapSat[ShapeId.Rect] = [];
shapeMapSat[ShapeId.Rect][ShapeId.Circle] =
	(r: any, c: any) => circleVsRectSat(c, r)?.negate();
shapeMapSat[ShapeId.Rect][ShapeId.Polygon] =
	(r: any, p: any) => polygonVsRectSat(p, r)?.negate();
shapeMapSat[ShapeId.Rect][ShapeId.Rect] = rectVsRectSat;
shapeMapSat[ShapeId.Rect][ShapeId.Vector] = rectVsVectorSat;
shapeMapSat[ShapeId.Vector] = [];
shapeMapSat[ShapeId.Vector][ShapeId.Circle] =
	(v: any, c: any) => circleVsVectorSat(c, v)?.negate();
shapeMapSat[ShapeId.Vector][ShapeId.Polygon] =
	(v: any, p: any) => polygonVsVectorSat(p, v)?.negate();
shapeMapSat[ShapeId.Vector][ShapeId.Rect] =
	(v: any, r: any) => rectVsVectorSat(r, v)?.negate();
shapeMapSat[ShapeId.Vector][ShapeId.Vector] = vectorVsVectorSat;

function shapeVsShapeSat(shape1: Shape2d, shape2: Shape2d): Vector | undefined {
	return shapeMapSat[shape1.getShapeId()][shape2.getShapeId()](shape1, shape2);
}

export const Intersect = {
	circleVsCircle,
	circleVsCircleSat,
	circleVsPolygon,
	circleVsPolygonSat,
	circleVsRect,
	circleVsRectSat,
	circleVsVector,
	circleVsVectorSat,
	polygonVsPolygon,
	polygonVsPolygonSat,
	polygonVsRect,
	polygonVsRectSat,
	polygonVsVector,
	polygonVsVectorSat,
	rectVsRect,
	rectVsRectSat,
	rectVsVector,
	rectVsVectorSat,
	shapeVsShape,
	shapeVsShapeSat,
	vectorVsVector,
	vectorVsVectorSat,
};
