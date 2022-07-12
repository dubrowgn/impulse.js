import { EntityId } from "./entity-id";

export interface Component {
	eid: EntityId;
};

export class ComponentList<T extends Component> {
	protected type: { new():T };
	protected comps: Map<EntityId, T> = new Map();

	constructor(type: { new():T }) {
		this.type = type;
	}

	[Symbol.iterator](): Iterator<T> {
		return this.comps.values();
	}

	create(eid: EntityId): T {
		let c = new this.type();
		c.eid = eid;

		this.comps.set(eid, c);

		return c;
	}

	destroy(eid: EntityId): this {
		this.comps.delete(eid);

		return this;
	}

	get(eid: EntityId): T | undefined {
		return this.comps.get(eid);
	}
};

export interface ComponentSystem<T extends Component> {
	update(comps: ComponentList<T>): void;
};
