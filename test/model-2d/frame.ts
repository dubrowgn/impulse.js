import { Frame } from "../../src/model-2d/frame"

export default t => {
	let attack = true;
	let image = "image";
	let length = 1;
	let sound = "sound";
	let x = 2;
	let y = 3;

	t.test("constructor-instance", t => {
		let f = new Frame(attack, image, length, sound, x, y);
		t.equal(new Frame(f), f);
	});
	t.test("constructor-params", t => {
		let f = new Frame(attack, image, length, sound, x, y);
		t.equal(f.attack, attack);
		t.equal(f.image, image);
		t.equal(f.length, length);
		t.equal(f.sound, sound);
		t.equal(f.x, x);
		t.equal(f.y, y);
	});

	t.test("clone", t => {
		let f = new Frame(attack, image, length, sound, x, y);
		t.equal(f.clone(), f);
	});

	t.test("fromJson", t => {
		let f = new Frame(attack, image, length, sound, x, y);
		let o = { attack, image, length, sound, x, y };
		t.equal(Frame.fromJson(o), f);
	});

	t.test("json-round-trip", t => {
		let f = new Frame(attack, image, length, sound, x, y);
		t.equal(Frame.fromJson(f.toJson()), f);
	});

	t.test("toJson", t => {
		let f = new Frame(attack, image, length, sound, x, y);
		t.equal(f.toJson(), {...f});
	});
};
