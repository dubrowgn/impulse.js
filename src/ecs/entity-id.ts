export type EntityId = number;

let nextId: number = 0;
export let EntityId = {
	create(): EntityId {
		return nextId++;
	},
	export(): number {
		return nextId;
	},
	import(seed: EntityId) {
		nextId = seed;
	},
};
