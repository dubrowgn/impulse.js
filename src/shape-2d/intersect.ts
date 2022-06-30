import { Circle } from "./circle";
import { Polygon } from "./polygon";
import { Rect } from "./rect";
import { Shape2d, ShapeId } from "./shape-2d";
import { Vector } from "./vector";

function calcPerp(p1: Vector, p2: Vector) {
	return new Vector(-p2.y + p1.y, p2.x - p1.x).normalize();
}

function distSqrXy(x1: number, y1: number, x2: number, y2: number): number {
	let dx = x1 - x2;
	let dy = y1 - y2;
	return dx * dx + dy * dy;
}

function distSqr(v1: Vector, v2: Vector): number {
	return distSqrXy(v1.x, v1.y, v2.x, v2.y);
}

function closestVertex(vs: Vector[], vert: Vector): Vector {
	let closest = vs[0];
	let minD2 = distSqr(closest, vert);

	for (let i = 1; i < vs.length; i++) {
		let v = vs[i];
		let d2 = distSqr(v, vert);
		if (d2 < minD2) {
			closest = v;
			minD2 = d2;
		}
	}

	return closest;
}

function* edges(vs: Vector[]): IterableIterator<[Vector, Vector]> {
	for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
		yield [vs[j], vs[i]];
	}
}

function projectCircle(c: Circle, axis: Vector): [number, number] {
	let center = c.getCenter().dotProduct(axis);
	return [center - c.r, center + c.r];
}

function projectEdges(vs: Vector[], axis: Vector): [number, number] {
	let min = Number.MAX_VALUE;
	let max = Number.MIN_VALUE;

	for (let v of vs) {
		let dist = v.dotProduct(axis);
		min = Math.min(min, dist);
		max = Math.max(max, dist);
	}

	return [min, max];
}

function projectVector(v: Vector, axis: Vector): number {
	return v.dotProduct(axis);
}

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
	dc.scaleToMagnitude(rs - l);

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
function _circleVsEdgesSat(cir: Circle, vs: Vector[]): Vector | undefined {
	let overlap, diff1, diff2;
	let mtv = new Vector();
	let smallest = Number.MAX_VALUE;

	// test edges stored in v1 against cir
	for (let [p1, p2] of edges(vs)) {
		// calculate normalized vector perpendicular to each line segment of the polygon
		let perp = calcPerp(p1, p2);

		// project the shapes onto the new axis
		let [min1, max1] = projectEdges(vs, perp);
		let [min2, max2] = projectCircle(cir, perp);

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
	}

	// find closest vertex to cir
	let c = cir.getCenter();
	let v = closestVertex(vs, c);

	// test closest vertex against cir
	let perp = calcPerp(c, v);

	// project the shapes onto the new axis
	let [min1, max1] = projectEdges(vs, perp);
	let [min2, max2] = projectCircle(cir, perp);

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
	if (!circleVsRect(cir, poly.aabb))
		return false;

	// see http://www.metanetsoftware.com/technique/tutorialA.html#section2

	// test edges stored in v against cir
	for (let [p1, p2] of edges(poly.vertices)) {
		let perp = calcPerp(p1, p2);

		// project the shapes onto the new axis
		let [min1, max1] = projectEdges(poly.vertices, perp);
		let [min2, max2] = projectCircle(cir, perp);

		if (max1 < min2 || min1 > max2)
			return false;
	}

	// find the vertex closest to cir.center
	let c = cir.getCenter();
	let v = closestVertex(poly.vertices, c);

	// test line cir.center - vertext
	let perp = calcPerp(c, v);

	// project the shapes onto the new axis
	let [min1, max1] = projectEdges(poly.vertices, perp);
	let [min2, max2] = projectCircle(cir, perp);

	if (max1 < min2 || min1 > max2)
		return false;

	// no separating axis, shapes are intersecting
	return true;
}

function circleVsPolygonSat(cir: Circle, poly: Polygon): Vector | undefined {
	// coarse test
	if (!circleVsRect(cir, poly.aabb))
		return undefined;

	// fine test
	return _circleVsEdgesSat(cir, poly.vertices);
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
	return _circleVsEdgesSat(cir, rect.vertices);
}

function circleVsVector(c: Circle, v: Vector): boolean {
	return distSqrXy(c.x, c.y, v.x, v.y) <= c.r * c.r;
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
 * @param {Array<Vector>} vs1 An array of vertices representing the first polygon
 * @param {Array<Vector>} vs2 An array of vertices representing the second polygon
 * @return {undefined|Vector} Returns the Minium Translation Vector if the polygons
 * intersect, undefined otherwise
 * @private
 */
function _edgesVsEdgesSat(vs1: Vector[], vs2: Vector[]): Vector | undefined {
	let overlap, diff1, diff2;
	let mtv = new Vector();
	let smallest = Number.MAX_VALUE;

	// test edges stored in v1 against edges stored in v2
	for (let [p1, p2] of edges(vs1)) {
		// calculate normalized vector perpendicular to each line segment of the polygon
		let perp = calcPerp(p1, p2);

		// project the shapes onto the new axis
		let [min1, max1] = projectEdges(vs1, perp);
		let [min2, max2] = projectEdges(vs2, perp);

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
	}

	// test edges stored in v2 against edges stored in v1
	for (let [p1, p2] of edges(vs2)) {
		// calculate normalized vector perpendicular to each line segment of the polygon
		let perp = calcPerp(p1, p2);

		// project the shapes onto the new axis
		let [min1, max1] = projectEdges(vs1, perp);
		let [min2, max2] = projectEdges(vs2, perp);

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
	}

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
 * @param {Array<Vector>} vs An array of vertices representing a polygon
 * @param {Vector} v A single vertex
 * @return {undefined|Vector} Returns the Minium Translation Vector if there is an
 * intersection, undefined otherwise
 * @private
 */
function _edgesVsVectorSat(vs: Vector[], v: Vector): Vector | undefined {
	let mtv = new Vector();
	let smallest = Number.MAX_VALUE;

	// test edges stored in p against v
	for (let [p1, p2] of edges(vs)) {
		// calculate normalized vector perpendicular to each line segment of the polygon
		let perp = calcPerp(p1, p2);

		// project the shapes onto the new axis
		let [p_min, p_max] = projectEdges(vs, perp);
		let v_dist = projectVector(v, perp);

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
	if (!rectVsRect(poly1.aabb, poly2.aabb))
		return undefined;

	// fine test
	return _edgesVsEdgesSat(poly1.vertices, poly2.vertices);
}

function polygonVsRect(poly: Polygon, rect: Rect): boolean {
	// quick rejection
	if (!rectVsRect(poly.aabb, rect))
		return false;

	let vs1 = poly.vertices;
	let vs2 = rect.vertices;

	// test edges stored in vs1 against edges stored in vs2
	for (let [p1, p2] of edges(vs1)) {
		let perp = calcPerp(p1, p2);

		// project the shapes onto the new axis
		let [min1, max1] = projectEdges(vs1, perp);
		let [min2, max2] = projectEdges(vs2, perp);

		if (max1 < min2 || min1 > max2)
			return false;
	}

	// test edges stored in vs2 against edges stored in vs1
	for (let [p1, p2] of edges(vs2)) {
		let perp = calcPerp(p1, p2);

		// project the shapes onto the new axis
		let [min1, max1] = projectEdges(vs1, perp);
		let [min2, max2] = projectEdges(vs2, perp);

		if (max1 < min2 || min1 > max2)
			return false;
	}

	return true;
}

function polygonVsRectSat(poly: Polygon, rect: Rect): Vector | undefined {
	// coarse test
	if (!rectVsRect(poly.aabb, rect))
		return undefined;

	// fine test
	return _edgesVsEdgesSat(poly.vertices, rect.vertices);
}

function polygonVsVector(poly: Polygon, vect: Vector): boolean {
	// quick rejection
	if (!rectVsVector(poly.aabb, vect))
		return false;

	// using Point Inclusion in Polygon test (aka Crossing test)
	let intersects = false;
	for (let [p1, p2] of edges(poly.vertices)) {

		// check if vect.y falls between the y values of v1 and v2
		let segSpansVecY = p1.y > vect.y != p2.y > vect.y;
		if (!segSpansVecY)
			continue;

		// given vect.y, find x such that (x, vect.y) falls on the line v1,v2
		let segX = (p2.x - p1.x) * (vect.y - p1.y) / (p2.y - p1.y) + p1.x;
		if (vect.x < segX)
			intersects = !intersects;
	}

	return intersects;
}

function polygonVsVectorSat(poly: Polygon, vect: Vector): Vector | undefined {
	// coarse test
	if (!rectVsVector(poly.aabb, vect))
		return undefined;

	// fine test
	return _edgesVsVectorSat(poly.vertices, vect);
}

function rectVsRect(rect1: Rect, rect2: Rect): boolean {
	return !(
		rect1.l > rect2.r ||
		rect1.r < rect2.l ||
		rect1.t < rect2.b ||
		rect1.b > rect2.t
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
