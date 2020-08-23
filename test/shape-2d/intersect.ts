import { Intersect } from "../../src/shape-2d/intersect";
import { Polygon } from "../../src/shape-2d/polygon";
import { Rect } from "../../src/shape-2d/rect";
import { Vector } from "../../src/shape-2d/vector";

export default t => {
	t.test("rectVsRectSat()", t => {
		let r = new Rect(-10, 10, 20, 20);

		t.equal(Intersect.rectVsRectSat(r, new Rect(20, 0, 5, 5)), undefined);

		t.equal(Intersect.rectVsRectSat(r, new Rect(0, 10, 5, 5)), new Vector(0, -5));
		t.equal(Intersect.rectVsRectSat(r, new Rect(5, 0, 5, 5)), new Vector(-5, 0));
		t.equal(Intersect.rectVsRectSat(r, new Rect(0, -5, 5, 5)), new Vector(0, 5));
		t.equal(Intersect.rectVsRectSat(r, new Rect(-10, 0, 5, 5)), new Vector(5, 0));

		t.equal(Intersect.rectVsRectSat(r, new Rect(-5, 10, 40, 40)), new Vector(-15, 0));
		t.equal(Intersect.rectVsRectSat(r, new Rect(-30, -5, 40, 40)), new Vector(0, 5));
		t.equal(Intersect.rectVsRectSat(r, new Rect(5, 30, 40, 40)), new Vector(-5, 0));
		t.equal(Intersect.rectVsRectSat(r, new Rect(-10, 5, 40, 40)), new Vector(0, 15));
	});

	t.test("rectVsVectorSat()", t => {
		let r = new Rect(-10, 10, 20, 20);

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
