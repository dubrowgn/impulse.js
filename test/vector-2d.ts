import { Vector } from "../src/Shape2D";

export default t => {
	t.test("constructor", t => {
		let v0 = new Vector();
		let v00 = new Vector(0, 0);
		let v12 = new Vector(1, 2);
		let v12_2 = new Vector(v12);

		t.equal(new Vector().equals(new Vector(0, 0)), true, "new Vector() equals new Vector(0, 0)");
		t.equal(v12.equals(v12_2), true, "new Vector(1, 2) equals new Vector(new Vector(1,2))");
	});

	t.test("add()", t => {
		let v12 = new Vector(1, 2);
		let v34 = new Vector(3, 4);
		let v = new Vector(4, 6);

		t.equal(v12.add(v34).equals(v), true, "<1,2> + <3,4> = <4,6>");
	});

	t.test("angleBetween()", t => {
		let v10 = new Vector(1, 0);
		let v_11 = new Vector(-1, 1);
		let v1_1 = new Vector(1, -1);

		t.equal(v10.angleBetween(v_11), 3 * Math.PI / 4, "<1,0>.angleBetween(<0,1>) = 3*PI/4");
		t.equal(v10.angleBetween(v1_1), -Math.PI / 4, "<1,0>.angleBetween(<1,-1>) = -PI/4");
	});

	t.test("angleTo()", t => {
		let v0 = new Vector();
		let v11 = new Vector(1, 1);
		let v10 = new Vector(1, 0);
		let v0_1 = new Vector(0, -1);

		t.equal(v0.angleTo(v11), Math.PI / 4, "<0,0>.angleTo(<1,1>) = PI/4");
		t.equal(v10.angleTo(v0_1), -3 * Math.PI / 4, "<1,0>.angleTo(<0,-1>) = -3*PI/4");
	});

	t.test("clone()", t => {
		let v0 = new Vector();
		let v3_7 = new Vector(3, -7);

		t.equal(v0.equals(v0.clone()), true, "<0,0> = <0,0>.clone()");
		t.equal(v3_7.clone().equals(v3_7), true, "<3,-7>.clone() = <3,-7>");
	});

	t.test("distance()", t => {
		let v0 = new Vector();
		let v10 = new Vector(1, 0);
		let v11 = new Vector(1, 1);

		t.equal(v10.distance(v11), 1, "<1,0>.distance(<1,1>) = 1");
		t.equal(v0.distance(v11), Math.sqrt(2), "<0,0>.distance(<1,1>) = sqrt(2)");
	});

	t.test("distanceSq()", t => {
		let v0 = new Vector();
		let v10 = new Vector(1, 0);
		let v11 = new Vector(1, 1);

		t.equal(v10.distanceSq(v11), 1, "<1,0>.distanceSq(<1,1>) = 1");
		t.equal(v0.distanceSq(v11), 2, "<0,0>.distanceSq(<1,1>) = 2");
	});

	t.test("divide()", t => {
		let v12 = new Vector(1, 2);
		let v34 = new Vector(3, 4);
		let v = new Vector(1/3, 2/4);

		t.equal(v12.divide(v34).equals(v), true, "<1,2> / <3,4> = <1/3,1/2>");
	});

	t.test("dotProduct()", t => {
		let v12 = new Vector(1, 2);
		let v34 = new Vector(3, 4);
		let v46 = new Vector(4, 6);

		t.equal(v12.dotProduct(v34), 11, "<1,2>.dotProduct(<3,4>) = 11");
		t.equal(v34.dotProduct(v46), 36, "<3,4>.dotProduct(<4,6>) = 36");
		t.equal(v46.dotProduct(v12), 16, "<4,6>.dotProduct(<1,2>) = 16");
	});

	t.test("equals()", t => {
		let v12 = new Vector(1, 2);
		let v34 = new Vector(3, 4);
		let v46 = new Vector(4, 6);

		t.equal(v12.equals(new Vector(1,2)), true, "<1,2>.equals(<1,2>) = true");
		t.equal(v34.equals(new Vector(3,4)), true, "<3,4>.equals(<3,4>) = true");
		t.equal(v46.equals(new Vector(4,6)), true, "<4,6>.equals(<4,6>) = true");
	});

	t.test("getNormal()", t => {
		let v10 = new Vector(1, 0);
		let v32 = new Vector(3, 2);

		t.equal(v10.getNormal().equals(new Vector(0,1)), true, "<1,0>.getNormal() = <0,1>");
		t.equal(v10.getNormal(v32).equals((new Vector(1,-1)).normalize()), true, "<1,0>.getNormal(<3,2>) = <sqrt(2)/2,-sqrt(2)/2>");
	});

	t.test("isZero()", t => {
		let v0 = new Vector();
		let v10 = new Vector(1, 0);

		t.equal(v0.isZero(), true, "<0,0>.isZero() = true");
		t.equal(v10.isZero(), false, "<1,0>.isZero() = false");
	});

	t.test("magnitude()", t => {
		let v0 = new Vector();
		let v10 = new Vector(1, 0);
		let v_79 = new Vector(-7, 9);

		t.equal(v0.magnitude(), 0, "<0,0>.magnitude() = 0");
		t.equal(v10.magnitude(), 1, "<1,0>.magnitude() = 1");
		t.equal(v_79.magnitude(), 11.40175425099138, "<-7,9>.magnitude() = 11.40175425099138");
	});

	t.test("magnitudeSq()", t => {
		let v0 = new Vector();
		let v10 = new Vector(1, 0);
		let v_79 = new Vector(-7, 9);

		t.equal(v0.magnitudeSq(), 0, "<0,0>.magnitudeSq() = 0");
		t.equal(v10.magnitudeSq(), 1, "<1,0>.magnitudeSq() = 1");
		t.equal(v_79.magnitudeSq(), 130, "<-7,9>.magnitudeSq() = 130");
	});

	t.test("multiply()", t => {
		let v12 = new Vector(1, 2);
		let v34 = new Vector(3, 4);
		let v = new Vector(3, 8);

		t.equal(v12.multiply(v34).equals(v), true, "<1,2> * <3,4> = <3,8>");
	});

	t.test("negate()", t => {
		let v_79 = new Vector(-7, 9);
		let v7_9 = new Vector(7, -9);

		t.equal(v_79.negate().equals(v7_9), true, "<-7,9>.negate() = <7,-9>");
	});

	t.test("normalize()", t => {
		let v0 = new Vector();
		let v01 = new Vector(0, 1);
		let v_79 = new Vector(-7, 9);

		t.equal(v0.normalize().equals(v0), true, "<0,0>.normalize() = <0,0>");
		t.equal(v01.normalize().equals(v01), true, "<0,1>.normalize() = <0,1>");
		t.equal(v_79.normalize().equals(new Vector(-0.6139406135149205,0.7893522173763263)), true, "<-7,9>.normalize() = <-0.6139406135149205,0.7893522173763263>");
	});

	t.test("scale()", t => {
		let v11 = new Vector(1, 1);

		t.equal(v11.scale(2).equals(new Vector(2, 2)), true, "<1,1>.scale(2) = <2,2>");
		t.equal(v11.scale(2, -3).equals(new Vector(4, -6)), true, "<2,2>.scale(2, -3) = <4,-6>");
	});

	t.test("magnitudeSq()", t => {
		let v34 = new Vector(3, 4);

		t.equal(v34.normalize().scaleToMagnitude(5).equals(new Vector(3, 4)), true, "<3,4>.normalize().scaleToMagnitude(5) = <3,4>");
	});

	t.test("subtract()", t => {
		let v12 = new Vector(1, 2);
		let v34 = new Vector(3, 4);
		let v = new Vector(-2, -2);

		t.equal(v12.subtract(v34).equals(v), true, "<1,2> - <3,4> = <-2,-2>");
	});

	t.test("toString()", t => {
		let v12 = new Vector(1, 2);

		t.equal(v12.toString(), "Vector(1, 2)", "<1,2> = \"Vector(1, 2)\"");
	});

	t.test("translate()", t => {
		let v11 = new Vector(1, 1);

		t.equal(v11.translate(2).equals(new Vector(3, 3)), true, "<1,1>.translate(2) = <3,3>");
		t.equal(v11.translate(2, -3).equals(new Vector(5, 0)), true, "<2,2>.translate(2, -3) = <5,0>");
	});

	t.test("tripleProduct()", t => {
		let va = new Vector(1, 2);
		let vb = new Vector(3, 4);
		let vc = new Vector(5, 6);
		let vtp = new Vector(12, -10);

		t.equal(Vector.tripleProduct(va, vb, vc).equals(vtp), true, "tripleProduct(<1,2>, <3,4>, <5,6>) = <10,-12>");
	});
};
