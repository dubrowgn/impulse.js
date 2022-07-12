export class AudioCache {
	protected cache: Map<string, HTMLAudioElement> = new Map();

	get(path: string) {
		let audio = this.cache.get(path);
		if (audio !== undefined)
			return audio;

		audio = new Audio(path);

		this.cache.set(path, audio);

		return audio;
	}

	clear() {
		this.cache.clear();
	}
};

export const sounds = new AudioCache();
