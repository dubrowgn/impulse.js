import { Polygon } from "../../src/shape-2d/polygon";
import { Vector } from "../../src/shape-2d/vector";

export default t => {
	t.test("isConvex", t => {
		let convex = new Polygon([
			new Vector(3.588, -3.027),
			new Vector(4.368, -1.722),
			new Vector(3.861, -1.422),
			new Vector(3.100, -2.485),
		]);
		t.ok(convex.isConvex());

		let concave = new Polygon([
			new Vector(3.588, -3.027),
			new Vector(4.368, -1.722),
			new Vector(3.361, -1.422),
			new Vector(3.600, -2.485),
		]);
		t.notOk(concave.isConvex());

		let complex = new Polygon([
			new Vector(3.588, -3.027),
			new Vector(4.368, -1.722),
			new Vector(3.861, -1.422),
			new Vector(4.100, -2.485),
		]);
		t.notOk(complex.isConvex());

		complex = new Polygon([
			new Vector(-1.784, 3.866),
			new Vector(-2.306, 3.540),
			new Vector(-2.530, 1.592),
			new Vector(-1.946, 2.114),
			new Vector(-2.933, 3.298),
			new Vector(-3.458, 2.773),
		]);
		t.notOk(complex.isConvex());
	});
};
