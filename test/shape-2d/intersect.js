import { Intersect, Polygon, Rect, Vector } from "../../src/Shape2D";

export default t => {
	t.test("rectVsVectorSat()", t => {
		let r = new Rect(-10, 10, 20, 20);

		t.equal(Intersect.rectVsVectorSat(r, new Vector(20, 0)), undefined);
		t.equal(Intersect.rectVsVectorSat(r, new Vector(0, 5)), new Vector(0, -5));
		t.equal(Intersect.rectVsVectorSat(r, new Vector(5, 0)), new Vector(-5, 0));
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
