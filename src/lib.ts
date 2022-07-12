export interface Clone {
	clone: () => any;
};

export interface ToString {
	toString: () => string;
};

export interface ToJson {
	toJson: () => {};
	toJSON: () => {};
}

export function deepEquals(left: any, right: any): boolean {
	if (left === right)
		return true;

	if (left instanceof Object && right instanceof Object) {
		let keys = new Set(Object.keys(left).concat(Object.keys(right)));
		for (let key of keys) {
			if (!deepEquals(left[key], right[key]))
				return false;
		}

		return true;
	}

	if (left instanceof Array && right instanceof Array) {
		if (left.length !== right.length)
			return false;

		for (let i = 0; i < left.length; i++) {
			if (!deepEquals(left[i], right[i]))
				return false;
		}

		return true;
	}

	return false;
};

export function mapToObj<T>(map: Map<string, T>): Record<string, T> {
	return Object.fromEntries(map);
}

export function mapToObjF<T, T2>(map: Map<string, T>, f: (o: T) => T2): Record<string, T2> {
	let obj: Record<string, T2> = {};

	for (let [k, v] of map.entries()) {
		obj[k] = f(v);
	}

	return obj;
}

export function mostCommon(objs: any[]): any | undefined {
	if (objs.length < 2)
		return undefined;

	let common: any = {};

	for (let field of Object.keys(objs[0])) {
		let counts: Map<string, number> = new Map();

		for (let obj of objs) {
			let val = obj[field];

			if (typeof val === "object")
				val = JSON.stringify(val);

			counts.set(val, (counts.get(val) ?? 0) + 1);
		}

		common[field] = [...counts].reduce(
			(max, current) => current[1] > max[1] ? current : max
		)[0];
	}

	return common;
}

export function objDiff(obj: Record<string, any>, base?: Record<string, any>): any {
	if (base === undefined)
		return obj;

	let o: any = {};

	for (let k of Object.keys(obj)) {
		if (!deepEquals(obj[k], base[k]))
			o[k] = obj[k];
	}

	return o;
}

export function objEmpty(obj: Record<string, any>): boolean {
	for (let _ in obj) {
		return false;
	}

	return true;
}

export function objMap<T, T2>(obj: Record<string, T>, f: (o: T) => T2): Record<string, T2> {
	let mapped = obj as any;

	for (let [k, v] of Object.entries(obj)) {
		mapped[k] = f(v);
	}

	return mapped;
}

export function objToMap<T>(obj: Record<string, T>): Map<string, T> {
	let m = new Map();

	for (let [k, v] of Object.entries(obj)) {
		m.set(k, v);
	}

	return m;
}

export function objToMapF<T, T2>(obj: Record<string, T>, f: (o: T) => T2): Map<string, T2> {
	let m = new Map();

	for (let [k, v] of Object.entries(obj)) {
		m.set(k, f(v));
	}

	return m;
}

export function toString(this: any): string {
	let name = (this as any).constructor.name;
	let fields = Object.keys(this)
		.map(k => `${k}: ${(this as any)[k]}`)
		.join(", ");

	return `${name} { ${fields} }`;
};
