import { MrIntRange } from "../../src/data-struct/min-repeating-rand";

export default t => {
	t.test("MrIntRange", t => {
		let size = 4;
		let rand = new MrIntRange(0, size);

		let bs = new Array(size);
		bs.fill(false);

		for (let i = 0; i < size; i++) {
			let idx = rand.next();

			t.ok(idx >= 0);
			t.ok(idx < size);

			t.notOk(bs[idx]);
			bs[idx] = true;
		}

		t.ok(bs[rand.next()]);
	});
};
