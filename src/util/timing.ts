// IE 9 has performance, but not performance.now
// make sure window exists for node.js compatability
const isHighResolution = (
	typeof window !== "undefined" &&
	window.performance !== undefined &&
	performance.now !== undefined
);

let now;
if (isHighResolution) {
	now = () => performance.now();
} else {
	let start = Date.now();
	now = () => Date.now() - start;
}

export const Timing = {
	isHighResolution,
	now,
};
