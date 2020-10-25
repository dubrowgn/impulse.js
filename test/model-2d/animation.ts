import { Animation } from "../../src/model-2d/animation"
import { Frame } from "../../src/model-2d/frame"

export default t => {
	let frames = [ new Frame(true, "image", 1, "sound", 2, 3) ];

	t.test("constructor-instance", t => {
		let a = new Animation(frames);
		t.equal(new Animation(a), a);
	});
	t.test("constructor-params", t => {
		let a = new Animation(frames);
		t.equal(a.frames, frames);
	});

	t.test("clone", t => {
		let a = new Animation(frames);
		t.equal(a.clone(), a);
	});

	t.test("fromJson", t => {
		let a = new Animation(frames);
		let o = { frames: frames.map(f => f.toJson()) };
		t.equal(Animation.fromJson(o), a);
	});

	t.test("json-round-trip", t => {
		let a = new Animation(frames);
		t.equal(Animation.fromJson(a.toJson()), a);
	});

	t.test("toJson", t => {
		let a = new Animation(frames);
		let o = { frames: frames.map(f => f.toJson()) };
		t.equal(a.toJson(), o);
	});
};
