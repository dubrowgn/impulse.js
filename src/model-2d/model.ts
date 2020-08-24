import { Animation } from "./animation";

export class Model {
	animations: Animation[];
	image: HTMLImageElement;

	constructor(img: HTMLImageElement) {
		this.animations = [];
		this.image = img;
	};
};
