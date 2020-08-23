export class Collection {
	protected arr: Array<any>;

	constructor(...args: any) {
		this.arr = Array.prototype.slice.call(args);
	}

	add(item: any): this {
		this.arr.push(item);
		return this;
	};

	at(index: number): any {
		return this.arr[index];
	}

	clear(): this {
		this.arr.splice(0, this.arr.length);
		return this;
	}

	contains(item: any): boolean {
		return this.arr.indexOf(item) >=0;
	}

	insert(index: number, item: any): this {
		this.arr.splice(index, 0, item);
		return this;
	}

	length(): number {
		return this.arr.length;
	}

	remove(item: any): this {
		let index = this.arr.indexOf(item);
		if (index >= 0)
			this.arr.splice(index, 1);

		return this;
	}

	removeAt(index: number): this {
		this.arr.splice(index, 1);
		return this;
	}

	toString(): string {
		return this.arr.toString();
	}
};