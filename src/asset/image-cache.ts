export class ImageCache {
	protected cache: Map<string, HTMLImageElement> = new Map();

	get(path: string) {
		let img = this.cache.get(path);
		if (img !== undefined)
			return img;

		img = new Image();
		img.src = path;

		this.cache.set(path, img);

		return img;
	}

	clear() {
		this.cache.clear();
	}
};

export const images = new ImageCache();
