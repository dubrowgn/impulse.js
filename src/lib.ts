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
	for (let key in obj) {
		return false;
	}

	return true;
}

export function objMap<T, T2>(obj: Record<string, T>, f: (o: T) => T2): Record<string, T2> {
	let mapped: Record<string, T2> = {};

	for (let k of Object.keys(obj)) {
		mapped[k] = f(obj[k]);
	}

	return mapped;
}

export function toString(this: any): string {
	let name = (this as any).constructor.name;
	let fields = Object.keys(this)
		.map(k => `${k}: ${(this as any)[k]}`)
		.join(", ");

	return `${name} { ${fields} }`;
};
