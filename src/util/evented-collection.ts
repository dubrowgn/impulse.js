import { Collection } from "./collection";
import { Event } from "./event";

type EventHandler = (collection: EventedCollection, item: any) => void;

export class EventedCollection extends Collection {
	added: Event<EventHandler>;
	removed: Event<EventHandler>;

	constructor(...args: any) {
		super(args);
		this.added = new Event();
		this.removed = new Event();
	};

	add(item: any): this {
		this.arr.push(item);
		this.added.dispatch(this, item);
		return this;
	}

	clear(): this {
		let arr = this.arr.splice(0, this.arr.length);
		for (let i = 0; i < arr.length; i++) {
			this.removed.dispatch(this, arr[i]);
		}

		return this;
	}

	insert(index: number, item: any): this {
		this.arr.splice(index, 0, item);
		this.added.dispatch(this, item);
		return this;
	}

	remove(item: any): this {
		let index = this.arr.indexOf(item);
		if (index >= 0) {
			this.arr.splice(index, 1);
			this.removed.dispatch(this, item);
		}

		return this;
	}

	removeAt(index: number): this {
		let dispatch = this.arr.length > 0;
		let item = this.arr.splice(index, 1);
		if (dispatch)
			this.removed.dispatch(this, item);

		return this;
	}
};