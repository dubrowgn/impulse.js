/**
 * A Minimally Repeating (MR) random integer range.
 *
 * This is a random number generator that trades off some randomness in
 * exchange for:
 * 1) guaranteed short(er) term uniform distribution
 * 2) improved sense of "fairness"
 *
 * For example, if a loot table has a 1/n chance of a specific item dropping,
 * this can be used to guarantee said item drops once in 2n-1 drops while
 * maintaining a random drop order. Meanwhile, traditional random number
 * generators can legally produce zero instances for 100s of drops, and then
 * produce several over a relatively short period of time.
 *
 * Values are organized as two contiguous pools of available and used values.
 * As available values are randomly selected, they are swapped with the end of
 * the available pool, and the available pool size is decremented by one. This
 * effectively shrinks the available pool and grows the used pool. When the
 * available pool is depleted, it is replenished by simply setting the available
 * pool size equal to the size of the used pool, and the process starts over.
 */
export class MrIntRange {
	protected values!: number[];
	protected len!: number;

	constructor(min: number, max: number) {
		if (max <= min)
			throw `min (${min}), must be strictly less than max (${max})`;

		let range = max - min;

		this.values = new Array(range);
		for (let i = 0; i < range; i++) {
			this.values[i] = i + min;
		}

		this.reset();
	}

	protected reset() {
		this.len = this.values.length;
	}

	next(): number {
		if (this.len === 0)
			this.reset();

		let idx = (Math.random() * this.len) | 0;

		// swap
		let val = this.values[idx];
		this.values[idx] = this.values[this.len - 1];
		this.values[this.len - 1] = val;

		this.len--;

		return val;
	}
};

/**
 * A Minimally Repeating (MR) random array.
 *
 * Samples random values from an array in a minimally repeating way.
 * See: MrIntRange
 */
export class MrArray<T> {
	protected rand: MrIntRange;
	protected values: Array<T>;

	constructor(arr: Array<T>) {
		if (arr.length === 0)
			throw `arr must contain at least one value`;

		this.values = arr;
		this.rand = new MrIntRange(0, arr.length);
	}

	next(): T {
		return this.values[this.rand.next()];
	}
};
