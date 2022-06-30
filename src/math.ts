export function rand(min: number, max: number) {
	let spread = max - min;
	return Math.random() * spread + min;
}

export function sign(n: number) {
	return n >= 0 ? 1 : -1;
}

export const pi = Math.PI;
export const twoPi = 2 * Math.PI;
