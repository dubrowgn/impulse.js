import { Circle } from "../../src/shape-2d/circle";
import { Intersect } from "../../src/shape-2d/intersect";
import { rand, twoPi } from "../../src/math";
import { Polygon } from "../../src/shape-2d/polygon";
import { Rect } from "../../src/shape-2d/rect";
import { Vector } from "../../src/shape-2d/vector";

function tryGenPoly(): Polygon {
	let v = new Vector(1, 0)
		.rotate(rand(0, twoPi));
	let p = new Vector(rand(-4, 4), rand(-4, 4));
	let ps = [ p ];

	let totalRads = 0;
	while (true) {
		let rads = rand(0.25 * Math.PI, 0.5 * Math.PI);
		totalRads += rads;
		if (totalRads > 1.75 * Math.PI)
			break;

		v.rotate(rads)
			.scaleToMagnitude(rand(0.5, 2));
		p = p.clone()
			.add(v);

		ps.push(p);
	}

	return new Polygon(ps);
}

function genPoly(): Polygon {
	let p = tryGenPoly();
	while (!p.isConvex()) {
		p = tryGenPoly()
	}

	return p;
}

function genCir(): Circle {
	return new Circle(rand(-4, 4), rand(-4, 4), rand(0.5, 2));
}

function genRect(): Rect {
	return new Rect(rand(-6, 2), rand(-6, 2), rand(0.5, 2), rand(0.5, 2));
}

function genVect() {
	return new Vector(rand(-4, 4), rand(-4, 4));
}

function ensureHit(t, s1, s2) {
	t.ok(Intersect.shapeVsShape(s1, s2), `${s1} should intersect ${s2}, but does not`);

	let mtv = Intersect.shapeVsShapeSat(s1, s2);
	if (t.notEq(mtv, undefined, `${s1} should intersect ${s2}, but produced no mtv`).pass) {
		t.ok(isFinite(mtv.x), `${s1} intersect ${s2} produced invalid mtv.x '${mtv.x}`);
		t.ok(isFinite(mtv.y), `${s1} intersect ${s2} produced invalid mtv.y '${mtv.y}`);
	}
}

function ensureMiss(t, s1, s2) {
	t.notOk(Intersect.shapeVsShape(s1, s2), `${s1} should NOT intersect ${s2}, but it does`);

	let mtv = Intersect.shapeVsShapeSat(s1, s2);
	t.eq(mtv, undefined, `${s1} does NOT intersect ${s2}, but produced mtv ${mtv}`);
}

export default t => {
	t.test("circle-vs-self", t => {
		let c = new Circle(2.955, 1.490, 0.941);
		ensureHit(t, c, c);
	});

	t.test("polygon-vs-self", t => {
		let p = new Polygon([
			new Vector(1.384, -1.843),
			new Vector(0.284, -0.608),
			new Vector(-1.027, -1.416),
			new Vector(-0.655, -1.960),
		]);
		ensureHit(t, p, p);
	});

	t.test("rect-vs-self", t => {
		let r = new Rect(-1.094, 1.427, 1.723, 1.966);
		ensureHit(t, r, r);
	});

	t.test("vector-vs-self", t => {
		let v = new Vector(1.164, -2.890);
		ensureHit(t, v, v);
	});

	t.test("rectVsRectSat", t => {
		let r = new Rect(-10, -10, 20, 20);

		t.equal(Intersect.rectVsRectSat(r, new Rect(20, -5, 5, 5)), undefined);

		t.equal(Intersect.rectVsRectSat(r, new Rect(0, 5, 5, 5)), new Vector(0, -5));
		t.equal(Intersect.rectVsRectSat(r, new Rect(5, -5, 5, 5)), new Vector(-5, 0));
		t.equal(Intersect.rectVsRectSat(r, new Rect(0, -10, 5, 5)), new Vector(0, 5));
		t.equal(Intersect.rectVsRectSat(r, new Rect(-10, -5, 5, 5)), new Vector(5, 0));

		t.equal(Intersect.rectVsRectSat(r, new Rect(-5, -30, 40, 40)), new Vector(-15, 0));
		t.equal(Intersect.rectVsRectSat(r, new Rect(-30, -45, 40, 40)), new Vector(0, 5));
		t.equal(Intersect.rectVsRectSat(r, new Rect(5, -10, 40, 40)), new Vector(-5, 0));
		t.equal(Intersect.rectVsRectSat(r, new Rect(-10, -35, 40, 40)), new Vector(0, 15));
	});

	t.test("rectVsVectorSat", t => {
		let r = new Rect(-10, -10, 20, 20);

		t.equal(Intersect.rectVsVectorSat(r, new Vector(20, 0)), undefined);
		t.equal(Intersect.rectVsVectorSat(r, new Vector(0, 5)), new Vector(0, -5));
		t.equal(Intersect.rectVsVectorSat(r, new Vector(5, 0)), new Vector(-5, 0));
		t.equal(Intersect.rectVsVectorSat(r, new Vector(0, -5)), new Vector(0, 5));
		t.equal(Intersect.rectVsVectorSat(r, new Vector(-5, 0)), new Vector(5, 0));
	});

	t.test("polygonVsVectorSat", t => {
		let p = new Polygon([
			new Vector(0, 0),
			new Vector(60, 30),
			new Vector(90, -90),
			new Vector(30, -60),
		]);

		t.equal(Intersect.polygonVsVectorSat(p, new Vector(0, 10)), undefined);
		t.ok(Intersect.polygonVsVectorSat(p, new Vector(40, -50)).isNear(new Vector(12, 6)));
		t.ok(Intersect.polygonVsVectorSat(p, new Vector(10, 0)).isNear(new Vector(2, -4)));
	});

	t.test("polygon-vs-vector", t => {
		ensureHit(
			t,
			new Polygon([
				new Vector(3.588, -3.027),
				new Vector(4.368, -1.722),
				new Vector(3.861, -1.422),
				new Vector(3.100, -2.485),
			]),
			new Vector(3.762, -1.934)
		);

		ensureMiss(
			t,
			new Polygon([
				new Vector(3.697, 3.260),
				new Vector(5.042, 1.869),
				new Vector(5.656, 2.161),
			]),
			new Vector(3.610, 3.099),
		);
	});

	t.skip("shape-gen", t => {
		// Generate random geometry and ensure various collision tests agree with each
		// other. Useful for finding new test cases. Disabled by default as random inputs
		// do not generate consistent test results.
		let shapes = [];
		for (let i = 0; i < 256; i++) {
			shapes.push(genCir());
			shapes.push(genPoly());
			shapes.push(genRect());
			shapes.push(genVect());
		}

		for (let s1 of shapes) {
			for (let s2 of shapes) {
				let hit = Intersect.shapeVsShape(s1, s2);
				let mtv = Intersect.shapeVsShapeSat(s1, s2);

				if (s1 === s2)
					t.ok(hit, `${s1} should intersect with itself, but does not`);

				if (hit)
					t.notEq(mtv, undefined, `${s1} intersects ${s2}, but produced no mtv`);
				else
					t.eq(mtv, undefined, `${s1} does NOT intersect ${s2}, but produced mtv ${mtv}`);

				if (mtv !== undefined) {
					t.ok(isFinite(mtv.x), `${s1} intersects ${s2}, but produced bad mtv.x '${mtv.x}'`);
					t.ok(isFinite(mtv.y), `${s1} intersects ${s2}, but produced bad mtv.y '${mtv.y}'`);
				}
			}
		}
	});
};
