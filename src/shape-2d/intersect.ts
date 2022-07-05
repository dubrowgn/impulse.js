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

export function circleInCircle(c1: Circle, c2: Circle): boolean {
	let d2 = distSqrXy(c1.x, c1.y, c2.x, c2.y);

	return d2 + c1.r*c1.r <= c2.r*c2.r;
}

export function circleInPolygon(c: Circle, p: Polygon): boolean {
	// coarse test
	if (!circleVsRect(c, p.aabb))
		return false;

	// use edges from p as separating axis candidates
	for (let [p1, p2] of edges(p.vertices)) {
		let perp = calcPerp(p1, p2);

		// project the shapes onto the new axis
		let [min1, max1] = projectEdges(p.vertices, perp);
		let [min2, max2] = projectCircle(c, perp);

		// test for containment escape
		if (min1 < min2 || max1 > max2)
			return false;
	}

	// find the vertex closest to cir.center
	let center = c.getCenter();
	let v = closestVertex(p.vertices, center);

	// test line c.center - vertext
	let perp = calcPerp(center, v);

	// project the shapes onto the new axis
	let [min1, max1] = projectEdges(p.vertices, perp);
	let [min2, max2] = projectCircle(c, perp);

	// test for containment escape
	if (min1 < min2 || max1 > max2)
		return false;

	// no containment escape, c is in p
	return true;
}

export function circleInRect(c: Circle, r: Rect): boolean {
	return (
		c.x - c.r >= r.l &&
		c.y - c.r >= r.b &&
		c.x + c.r <= r.r &&
		c.y + c.r <= r.t
	);
}

export function circleInVector(c: Circle, v: Vector): boolean {
	return (
		c.r === 0 &&
		c.x === v.x &&
		c.y === v.y
	);
}

export function circleVsCircle(cir1: Circle, cir2: Circle): boolean {
	// compare the squared distance between circle centers to the squared combined radii
	let dx = cir2.x - cir1.x;
	let dy = cir2.y - cir1.y;
	let rs = cir1.r + cir2.r;

	return dx * dx + dy * dy < rs * rs;
}

export function circleVsCircleSat(cir1: Circle, cir2: Circle): Vector | undefined {
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
function circleVsEdgesSat(cir: Circle, vs: Vector[]): Vector | undefined {
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
			} else {
				overlap += diff2;
				if (max1 < max2)
					perp.negate();
			}
		} else if (min1 > min2) {
			// shortest intersection is in the negative direction relative to perp
			perp.negate();
		}

		// does this axis contain the smallest overlap so far?
		if (overlap < smallest) {
			smallest = overlap;
			mtv = perp;
		}
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
		} else {
			overlap += diff2;
			if (max1 < max2)
				perp.negate();
		}
	} else if (min1 > min2) {
		// shortest intersection is in the negative direction relative to perp
		perp.negate();
	}

	// does this axis contain the smallest overlap so far?
	if (overlap < smallest) {
		smallest = overlap;
		mtv = perp;
	}

	// return the minimum translation vector (MTV)
	// this is the perpendicular axis with the smallest overlap, scaled to said overlap
	return mtv.scaleToMagnitude(smallest);
}

export function circleVsPolygon(cir: Circle, poly: Polygon): boolean {
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

export function circleVsPolygonSat(cir: Circle, poly: Polygon): Vector | undefined {
	// coarse test
	if (!circleVsRect(cir, poly.aabb))
		return undefined;

	// fine test
	return circleVsEdgesSat(cir, poly.vertices);
}

export function circleVsRect(cir: Circle, rect: Rect): boolean {
	// reorient rect with respect to cir, so cir.center is the new origin
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

export function circleVsRectSat(cir: Circle, rect: Rect): Vector | undefined {
	// coarse test
	if (!circleVsRect(cir, rect))
		return undefined;

	// fine test
	return circleVsEdgesSat(cir, rect.vertices);
}

export function circleVsVector(c: Circle, v: Vector): boolean {
	return distSqrXy(c.x, c.y, v.x, v.y) <= c.r * c.r;
}

export function circleVsVectorSat(cir: Circle, vect: Vector): Vector | undefined {
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

export function edgesVsEdges(vs1: Vector[], vs2: Vector[]): boolean {
	for (let satCandidate of [vs1, vs2]) {
		// use edges from satCandidate as separating axis candidates
		for (let [p1, p2] of edges(satCandidate)) {
			// separating axis canditate is the perpendicular of edge p1,p2
			let perp = calcPerp(p1, p2);

			// project the shapes onto the new axis
			let [min1, max1] = projectEdges(vs1, perp);
			let [min2, max2] = projectEdges(vs2, perp);

			// if no overlap, no intersection exists
			if (max1 < min2 || min1 > max2)
				return false;
		}
	}

	return true;
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
function edgesVsEdgesSat(vs1: Vector[], vs2: Vector[]): Vector | undefined {
	let mtv = new Vector();
	let smallest = Number.MAX_VALUE;

	for (let satCandidate of [vs1, vs2]) {
		// use edges from satCandidate as separating axis candidates
		for (let [p1, p2] of edges(satCandidate)) {
			// separating axis canditate is the perpendicular of edge p1,p2
			let perp = calcPerp(p1, p2);

			// project the shapes onto the new axis
			let [min1, max1] = projectEdges(vs1, perp);
			let [min2, max2] = projectEdges(vs2, perp);

			// if no overlap, no intersection exists
			if (max1 < min2 || min1 > max2)
				return undefined;

			// otherwise, calculate overlap
			let overlap = Math.min(max1, max2) - Math.max(min1, min2);

			// test for containment
			if ((min1 > min2 && max1 < max2) || (min1 < min2 && max1 > max2)) {
				let diff1 = Math.abs(min1 - min2);
				let diff2 = Math.abs(max1 - max2);

				// append smallest difference to overlap, negating the axis if needed
				if (diff1 < diff2) {
					overlap += diff1;
					if (min1 > min2)
						perp.negate();
				} else {
					overlap += diff2;
					if (max1 > max2)
						perp.negate();
				}
			} else if (min1 < min2) {
				// shortest intersection is in the negative direction relative to perp
				perp.negate();
			}

			// does this axis contain the smallest overlap so far?
			if (overlap < smallest) {
				smallest = overlap;
				mtv = perp;
			}
		}
	}

	// return the minimum translation vector (MTV)
	// this is the perpendicular axis with the smallest overlap, scaled to said overlap
	return mtv.scaleToMagnitude(smallest);
}

export function edgesVsVector(vs: Vector[], v: Vector): boolean {
	// use edges from vs as separating axis candidates
	for (let [p1, p2] of edges(vs)) {
		// separating axis canditate is the perpendicular of edge p1,p2
		let perp = calcPerp(p1, p2);

		// project the shapes onto the new axis
		let [p_min, p_max] = projectEdges(vs, perp);
		let v_dist = projectVector(v, perp);

		// if no overlap, no intersection exists
		if (p_min > v_dist || v_dist > p_max)
			return false;
	}

	return true;
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
 function edgesVsVectorSat(vs: Vector[], v: Vector): Vector | undefined {
	let mtv = new Vector();
	let smallest = Number.MAX_VALUE;

	// use edges from vs as separating axis candidates
	for (let [p1, p2] of edges(vs)) {
		// separating axis canditate is the perpendicular of edge p1,p2
		let perp = calcPerp(p1, p2);

		// project the shapes onto the new axis
		let [p_min, p_max] = projectEdges(vs, perp);
		let v_dist = projectVector(v, perp);

		// if no overlap, no intersection exists
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

export function polygonInCircle(p: Polygon, c: Circle): boolean {
	for (let v of p.vertices) {
		if (!circleVsVector(c, v))
			return false;
	}

	return true;
}

export function polygonInPolygon(p1: Polygon, p2: Polygon): boolean {
	let ps = p2.vertices;

	for (let v of p1.vertices) {
		if (!edgesVsVector(ps, v))
			return false;
	}

	return true;
}

export function polygonInRect(p: Polygon, r: Rect): boolean {
	for (let v of p.vertices) {
		if (!rectVsVector(r, v))
			return false;
	}

	return true;
}

export function polygonInVector(p: Polygon, v: Vector): boolean {
	for (let v2 of p.vertices) {
		if (!v2.equals(v))
			return false;
	}

	return true;
}

export function polygonVsCircle(p: Polygon, c: Circle): boolean {
	return circleVsPolygon(c, p);
}

export function polygonVsCircleSat(p: Polygon, c: Circle): Vector | undefined {
	return circleVsPolygonSat(c, p)?.negate();
}

export function polygonVsPolygon(p1: Polygon, p2: Polygon): boolean {
	// coarse test
	if (!rectVsRect(p1.aabb, p2.aabb))
		return false;

	// fine test
	return edgesVsEdges(p1.vertices, p2.vertices);
}

export function polygonVsPolygonSat(p1: Polygon, p2: Polygon): Vector | undefined {
	// coarse test
	if (!rectVsRect(p1.aabb, p2.aabb))
		return undefined;

	// fine test
	return edgesVsEdgesSat(p1.vertices, p2.vertices);
}

export function polygonVsRect(p: Polygon, r: Rect): boolean {
	// coarse test
	if (!rectVsRect(p.aabb, r))
		return false;

	// fine test
	return edgesVsEdges(p.vertices, r.vertices);
}

export function polygonVsRectSat(poly: Polygon, rect: Rect): Vector | undefined {
	// coarse test
	if (!rectVsRect(poly.aabb, rect))
		return undefined;

	// fine test
	return edgesVsEdgesSat(poly.vertices, rect.vertices);
}

export function polygonVsVector(p: Polygon, v: Vector): boolean {
	// coarse test
	if (!rectVsVector(p.aabb, v))
		return false;

	// fine test
	return edgesVsVector(p.vertices, v);
}

export function polygonVsVectorSat(poly: Polygon, vect: Vector): Vector | undefined {
	// coarse test
	if (!rectVsVector(poly.aabb, vect))
		return undefined;

	// fine test
	return edgesVsVectorSat(poly.vertices, vect);
}

export function rectInCircle(r: Rect, c: Circle): boolean {
	for (let v of r.vertices) {
		if (!circleVsVector(c, v))
			return false;
	}

	return true;
}

export function rectInPolygon(r: Rect, p: Polygon): boolean {
	let ps = p.vertices;

	for (let v of r.vertices) {
		if (!edgesVsVector(ps, v))
			return false;
	}

	return true;
}

export function rectInRect(r1: Rect, r2: Rect): boolean {
	return (
		r1.l >= r2.l &&
		r1.b >= r2.b &&
		r1.r <= r2.r &&
		r1.t <= r2.t
	);
}

export function rectInVector(r: Rect, v: Vector): boolean {
	return (
		r.w === 0 &&
		r.h === 0 &&
		r.getCenter().equals(v)
	);
}

export function rectVsCircle(r: Rect, c: Circle): boolean {
	return circleVsRect(c, r);
}

export function rectVsCircleSat(r: Rect, c: Circle): Vector | undefined {
	return circleVsRectSat(c, r)?.negate();
}

export function rectVsPolygon(r: Rect, p: Polygon): boolean {
	return polygonVsRect(p, r);
}

export function rectVsPolygonSat(r: Rect, p: Polygon): Vector | undefined {
	return polygonVsRectSat(p, r)?.negate();
}

export function rectVsRect(rect1: Rect, rect2: Rect): boolean {
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

export function rectVsRectSat(rect1: Rect, rect2: Rect): Vector | undefined {
	let dl = rect1.l - rect2.r;
	let dt = rect1.t - rect2.b;
	let dr = rect1.r - rect2.l;
	let db = rect1.b - rect2.t;

	return rectMtvFromDeltas(dl, dt, dr, db);
}

export function rectVsVector(r: Rect, v: Vector): boolean {
	return (
		v.x >= r.l &&
		v.y >= r.b &&
		v.x <= r.r &&
		v.y <= r.t
	);
}

export function rectVsVectorSat(rect: Rect, vect: Vector): Vector | undefined {
	// re-orient rect relative to vect
	let l = rect.l - vect.x;
	let b = rect.b - vect.y;
	let r = l + rect.w;
	let t = b + rect.h;

	return rectMtvFromDeltas(l, t, r, b);
}

export function vectorInCircle(v: Vector, c: Circle): boolean {
	return circleVsVector(c, v);
}

export function vectorInPolygon(v: Vector, p: Polygon): boolean {
	return polygonVsVector(p, v);
}

export function vectorInRect(v: Vector, r: Rect): boolean {
	return rectVsVector(r, v);
}

export function vectorInVector(vect1: Vector, vect2: Vector): boolean {
	return vect1.equals(vect2);
}

export const vectorVsCircle = vectorInCircle;

export function vectorVsCircleSat(v: Vector, c: Circle): Vector | undefined {
	return circleVsVectorSat(c, v)?.negate();
}

export const vectorVsPolygon = vectorInPolygon;

export function vectorVsPolygonSat(v: Vector, p: Polygon): Vector | undefined {
	return polygonVsVectorSat(p, v)?.negate();
}

export const vectorVsRect = vectorInRect;

export function vectorVsRectSat(v: Vector, r: Rect): Vector | undefined {
	return rectVsVectorSat(r, v)?.negate();
}

export const vectorVsVector = vectorInVector;

export function vectorVsVectorSat(vect1: Vector, vect2: Vector): Vector | undefined {
	return vect1.equals(vect2) ? new Vector(0, 0) : undefined;
}

type containsTest = (shape1: any, shape2: any) => boolean;
let shapeInMap: containsTest[][] = [];
shapeInMap[ShapeId.Circle] = [];
shapeInMap[ShapeId.Circle][ShapeId.Circle] = circleInCircle;
shapeInMap[ShapeId.Circle][ShapeId.Polygon] = circleInPolygon;
shapeInMap[ShapeId.Circle][ShapeId.Rect] = circleInRect;
shapeInMap[ShapeId.Circle][ShapeId.Vector] = circleInVector;
shapeInMap[ShapeId.Polygon] = [];
shapeInMap[ShapeId.Polygon][ShapeId.Circle] = polygonInCircle;
shapeInMap[ShapeId.Polygon][ShapeId.Polygon] = polygonInPolygon;
shapeInMap[ShapeId.Polygon][ShapeId.Rect] = polygonInRect;
shapeInMap[ShapeId.Polygon][ShapeId.Vector] = polygonInVector;
shapeInMap[ShapeId.Rect] = [];
shapeInMap[ShapeId.Rect][ShapeId.Circle] = rectInCircle;
shapeInMap[ShapeId.Rect][ShapeId.Polygon] = rectInPolygon;
shapeInMap[ShapeId.Rect][ShapeId.Rect] = rectInRect;
shapeInMap[ShapeId.Rect][ShapeId.Vector] = rectInVector;
shapeInMap[ShapeId.Vector] = [];
shapeInMap[ShapeId.Vector][ShapeId.Circle] = vectorInCircle;
shapeInMap[ShapeId.Vector][ShapeId.Polygon] = vectorInPolygon;
shapeInMap[ShapeId.Vector][ShapeId.Rect] = vectorInRect;
shapeInMap[ShapeId.Vector][ShapeId.Vector] = vectorInVector;

export function shapeInShape(shape1: Shape2d, shape2: Shape2d): boolean {
	return shapeInMap[shape1.getShapeId()][shape2.getShapeId()](shape1, shape2);
}

type intersectTest = (shape1: any, shape2: any) => boolean;
let shapeMap: intersectTest[][] = [];
shapeMap[ShapeId.Circle] = [];
shapeMap[ShapeId.Circle][ShapeId.Circle] = circleVsCircle;
shapeMap[ShapeId.Circle][ShapeId.Polygon] = circleVsPolygon;
shapeMap[ShapeId.Circle][ShapeId.Rect] = circleVsRect;
shapeMap[ShapeId.Circle][ShapeId.Vector] = circleVsVector;
shapeMap[ShapeId.Polygon] = [];
shapeMap[ShapeId.Polygon][ShapeId.Circle] = polygonVsCircle;
shapeMap[ShapeId.Polygon][ShapeId.Polygon] = polygonVsPolygon;
shapeMap[ShapeId.Polygon][ShapeId.Rect] = polygonVsRect;
shapeMap[ShapeId.Polygon][ShapeId.Vector] = polygonVsVector;
shapeMap[ShapeId.Rect] = [];
shapeMap[ShapeId.Rect][ShapeId.Circle] = rectVsCircle;
shapeMap[ShapeId.Rect][ShapeId.Polygon] = rectVsPolygon;
shapeMap[ShapeId.Rect][ShapeId.Rect] = rectVsRect;
shapeMap[ShapeId.Rect][ShapeId.Vector] = rectVsVector;
shapeMap[ShapeId.Vector] = [];
shapeMap[ShapeId.Vector][ShapeId.Circle] = vectorVsCircle;
shapeMap[ShapeId.Vector][ShapeId.Polygon] = vectorVsPolygon;
shapeMap[ShapeId.Vector][ShapeId.Rect] = vectorVsRect;
shapeMap[ShapeId.Vector][ShapeId.Vector] = vectorVsVector;

export function shapeVsShape(shape1: Shape2d, shape2: Shape2d): boolean {
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
shapeMapSat[ShapeId.Polygon][ShapeId.Circle] = polygonVsCircleSat;
shapeMapSat[ShapeId.Polygon][ShapeId.Polygon] = polygonVsPolygonSat;
shapeMapSat[ShapeId.Polygon][ShapeId.Rect] = polygonVsRectSat;
shapeMapSat[ShapeId.Polygon][ShapeId.Vector] = polygonVsVectorSat;
shapeMapSat[ShapeId.Rect] = [];
shapeMapSat[ShapeId.Rect][ShapeId.Circle] = rectVsCircleSat;
shapeMapSat[ShapeId.Rect][ShapeId.Polygon] = rectVsPolygonSat;
shapeMapSat[ShapeId.Rect][ShapeId.Rect] = rectVsRectSat;
shapeMapSat[ShapeId.Rect][ShapeId.Vector] = rectVsVectorSat;
shapeMapSat[ShapeId.Vector] = [];
shapeMapSat[ShapeId.Vector][ShapeId.Circle] = vectorVsCircleSat;
shapeMapSat[ShapeId.Vector][ShapeId.Polygon] = vectorVsPolygonSat;
shapeMapSat[ShapeId.Vector][ShapeId.Rect] = vectorVsRectSat;
shapeMapSat[ShapeId.Vector][ShapeId.Vector] = vectorVsVectorSat;

export function shapeVsShapeSat(shape1: Shape2d, shape2: Shape2d): Vector | undefined {
	return shapeMapSat[shape1.getShapeId()][shape2.getShapeId()](shape1, shape2);
}
