import { Matrix } from "../../src/shape-2d/matrix";
import { Vector } from "../../src/shape-2d/vector";

export default t => {
	t.test("constructor", t => {
		t.equal(new Matrix().equals(new Matrix(1, 0, 0, 1, 0, 0)), true,
			"new Matrix() equals new Matrix(1, 0, 0, 1, 0, 0)");
	});

	t.test("clone()", t => {
		t.equal(new Matrix(1, 2, 3, 4, 5, 6).clone().equals(new Matrix(1, 2, 3, 4, 5, 6)),
			true, "(new Matrix(1, 2, 3, 4, 5, 6)).clone().equals(new Matrix(1, 2, 3, 4, 5, 6))");
	});

	t.test("combine()", t => {
		t.equal((new Matrix()).scale(2).combine((new Matrix()).rotate(0.75)).equals((new Matrix()).scale(2).rotate(0.75)),
			true, "(new Matrix()).scale(2).combine((new Matrix()).rotate(0.75)).equals((new Matrix()).scale(2).rotate(0.75))");
	});

	t.test("equals()", t => {
		t.equal((new Matrix()).equals(new Matrix()),
			true, "(new Matrix()).equals(new Matrix())");
		t.equal((new Matrix()).scale(2).equals(new Matrix()),
			false, "(new Matrix()).scale(2).equals(new Matrix())");
	});

	t.test("getDeterminant()", t => {
		t.equal((new Matrix()).scale(2, 3).rotate(Math.PI / 2).getDeterminant(),
			6, "(new Matrix()).scale(2, 3).rotate(Math.PI / 2).getDeterminant()");
	});

	t.test("invert()", t => {
		t.equal((new Matrix()).scale(2, 3).rotate(Math.PI / 2).invert().toString(),
                            new Matrix(3.061616997868383e-17, -0.3333333333333333, 0.5, 2.041077998578922e-17, 0, 0).toString(),
                            "(new Matrix()).scale(2, 3).rotate(Math.PI / 2).invert().equals(new Matrix(3.061616997868383e-17, -0.3333333333333333, 0.5, 2.041077998578922e-17, 0, 0))");
	});

	t.test("isIdentity()", t => {
		t.equal((new Matrix()).isIdentity(),
			true, "(new Matrix()).isIdentity()");
		t.equal((new Matrix()).scale(2).isIdentity(),
			false, "(new Matrix()).scale(2).isIdentity()");
	});

	t.test("isInvertible()", t => {
		t.equal((new Matrix()).scale(2, 3).rotate(Math.PI / 2).isInvertible(),
			true, "(new Matrix()).scale(2, 3).rotate(Math.PI / 2).isInvertible()");
		t.equal((new Matrix()).scale(0, 3).rotate(Math.PI / 2).isInvertible(),
			false, "(new Matrix()).scale(0, 3).rotate(Math.PI / 2).isInvertible()");
	});

	t.test("preRotate()", t => {
		t.equal((new Matrix()).preRotate(0).equals(new Matrix()),
			true, "(new Matrix()).preRotate(0).equals(new Matrix())");
		t.equal((new Matrix()).preRotate(Math.PI / 2).equals((new Matrix()).rotate(Math.PI / 2)),
			true, "(new Matrix()).preRotate(Math.PI / 2).equals((new Matrix()).rotate(Math.PI / 2))");
	});

	t.test("preScale()", t => {
		t.equal((new Matrix()).preScale(2).equals(new Matrix(2, 0, 0, 2, 0, 0)),
			true, "(new Matrix()).preScale(2).equals(new Matrix(2, 0, 0, 2, 0, 0))");
		t.equal((new Matrix()).preScale(2.5).equals((new Matrix()).scale(2.5)),
			true, "(new Matrix()).preScale(2.5).equals((new Matrix()).scale(2.5))");
	});

	t.test("preTranslate()", t => {
		t.equal((new Matrix()).preTranslate(1, 2).equals(new Matrix(1, 0, 0, 1, 1, 2)),
			true, "(new Matrix()).preTranslate(1, 2).equals(new Matrix(1, 0, 0, 1, 1, 2)");
		t.equal((new Matrix()).preTranslate(1, 2).equals((new Matrix()).translate(new Vector(1, 2))),
			true, "(new Matrix()).preTranslate(1, 2).equals((new Matrix()).translate(new Vector(1, 2)))");
		t.equal((new Matrix()).preTranslate(new Vector(1, 2)).equals(new Matrix(1, 0, 0, 1, 1, 2)),
			true, "(new Matrix()).preTranslate(new Vector(1, 2)).equals(new Matrix(1, 0, 0, 1, 1, 2))");
		t.equal((new Matrix()).preTranslate(new Vector(1, 2)).equals((new Matrix()).translate(new Vector(1, 2))),
			true, "(new Matrix()).preTranslate(new Vector(1, 2)).equals((new Matrix()).translate(new Vector(1, 2)))");
	});

	t.test("rotate()", t => {
		t.equal((new Matrix()).rotate(0).equals(new Matrix()),
			true, "(new Matrix()).rotate(0).equals(new Matrix())");
	});

	t.test("scale()", t => {
		t.equal((new Matrix()).scale(2, 3).equals(new Matrix(2, 0, 0, 3, 0, 0)),
			true, "(new Matrix()).scale(2, 3).equals(new Matrix(2, 0, 0, 3, 0, 0))");
	});

	t.test("set()", t => {
		t.equal(new Matrix().set(1, 2, 3, 4, 5, 6), new Matrix(1, 2, 3, 4, 5, 6),
			true, "(new Matrix()).set(1, 2, 3, 4, 5, 6).equals(new Matrix(1, 2, 3, 4, 5, 6))");
	});

	t.test("toString()", t => {
		t.equal((new Matrix()).toString(),
			"Matrix([1, 0, 0] [0, 1, 0] [0, 0, 1])", "(new Matrix()).toString()");
	});

	t.test("translate()", t => {
		t.equal((new Matrix()).translate(1, 2).equals(new Matrix(1, 0, 0, 1, 1, 2)),
			true, "(new Matrix()).translate(1, 2).equals(new Matrix(1, 0, 0, 1, 1, 2))");
		t.equal((new Matrix()).translate(new Vector(1, 2)).equals(new Matrix(1, 0, 0, 1, 1, 2)),
			true, "(new Matrix()).translate(new Vector(1, 2)).equals(new Matrix(1, 0, 0, 1, 1, 2))");
	});
};
