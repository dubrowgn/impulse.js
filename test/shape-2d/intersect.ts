import { Intersect } from "../../src/shape-2d/intersect";
import { Polygon } from "../../src/shape-2d/polygon";
import { Rect } from "../../src/shape-2d/rect";
import { Vector } from "../../src/shape-2d/vector";

function ensureHit(t, s1, s2) {
	t.ok(Intersect.shapeVsShape(s1, s2), `${s1} should intersect ${s2}, but does not`);

	let mtv = Intersect.shapeVsShapeSat(s1, s2);
	if (t.notEq(mtv, undefined, `${s1} should intersect ${s2}, but produced no mtv`).pass) {
			t.ok(isFinite(mtv.x), `${s1} intersect ${s2} produced invalid mtv.x '${mtv.x}`);
			t.ok(isFinite(mtv.y), `${s1} intersect ${s2} produced invalid mtv.y '${mtv.y}`);
	}
}

export default t => {
	t.test("rect-vs-self", t => {
		let r = new Rect(-1.094, 1.427, 1.723, 1.966);
		ensureHit(t, r, r);
	});

	t.test("rectVsRectSat()", t => {
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

	t.test("rectVsVectorSat()", t => {
		let r = new Rect(-10, -10, 20, 20);

		t.equal(Intersect.rectVsVectorSat(r, new Vector(20, 0)), undefined);
		t.equal(Intersect.rectVsVectorSat(r, new Vector(0, 5)), new Vector(0, -5));
		t.equal(Intersect.rectVsVectorSat(r, new Vector(5, 0)), new Vector(-5, 0));
		t.equal(Intersect.rectVsVectorSat(r, new Vector(0, -5)), new Vector(0, 5));
		t.equal(Intersect.rectVsVectorSat(r, new Vector(-5, 0)), new Vector(5, 0));
	});

	t.test("polygonVsVectorSat()", t => {
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
};
