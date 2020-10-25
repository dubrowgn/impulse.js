import { Sound } from "../../src/model-2d/sound"

export default t => {
	let paths = [ "a", "b" ];

	t.test("constructor-instance", t => {
		let s = new Sound(paths);
		t.equal(new Sound(s), s);
	});
	t.test("constructor-params", t => {
		let s = new Sound(paths);
		t.equal(s.paths, paths);
	});

	t.test("clone", t => {
		let s = new Sound(paths);
		t.equal(s.clone(), s);
	});

	t.test("fromJson", t => {
		let s = new Sound(paths);
		let o = { paths };
		t.equal(Sound.fromJson(o), s);
	});

	t.test("json-round-trip", t => {
		let s = new Sound(paths);
		t.equal(Sound.fromJson(s.toJson()), s);
	});

	t.test("toJson", t => {
		let s = new Sound(paths);
		t.equal(s.toJson(), {...s});
	});
};
