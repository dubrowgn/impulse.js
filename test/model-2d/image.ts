import { Image } from "../../src/model-2d/image"
import { Matrix } from "../../src/shape-2d/matrix"

export default t => {
	let fps = 1;
	let matrix = new Matrix();
	let path = "path";
	let tileH = 0;
	let tileW = 0;

	t.test("constructor-instance", t => {
		let i = new Image(fps, matrix, path, tileW, tileH);
		t.equal(new Image(i), i);
	});
	t.test("constructor-params", t => {
		let i = new Image(fps, matrix, path, tileW, tileH);
		t.equal(i.fps, fps);
		t.equal(i.tileH, tileH);
		t.equal(i.matrix, matrix);
		t.equal(i.path, path);
		t.equal(i.tileW, tileW);
	});

	t.test("clone", t => {
		let i = new Image(fps, matrix, path, tileW, tileH);
		t.equal(i.clone(), i);
	});

	t.test("fromJson", t => {
		let i = new Image(fps, matrix, path, tileW, tileH);
		let o = { fps, tileH, matrix: matrix.toJson(), path, tileW };
		t.equal(Image.fromJson(o), i);
	});

	t.test("json-round-trip", t => {
		let i = new Image(fps, matrix, path, tileW, tileH);
		t.equal(Image.fromJson(i.toJson()), i);
	});

	t.test("toJson", t => {
		let i = new Image(fps, matrix, path, tileW, tileH);
		let o = { fps, tileH, matrix: matrix.toJson(), path, tileW };
		t.equal(i.toJson(), o);
	});
};
