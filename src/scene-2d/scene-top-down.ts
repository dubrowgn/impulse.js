import { Camera } from "./camera";
import { Scene } from "./scene";
import { SceneGraph } from "./scene-graph";

export class SceneTopDown extends Scene {
	constructor(cam: Camera, sg: SceneGraph) {
		super(cam, sg);
	}

	advance(deltaMs: number): this {
		let ents = this.sceneGraph.queryIntersectWith(this.camera.getViewport(true));
		let camMatrix = this.camera.getRenderMatrix();

		this.context.save();
		for(let ent of ents) {
			let update = ent.advance(deltaMs);

			let m = update.matrix;
			let r = update.frameRect;

			// combine camera transformations
			m.combine(camMatrix);

			// init canvas transformation
			this.context.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);

			// draw the image sprite to the canvas
			let img = new Image();
			img.src = update.imagePath;
			this.context.drawImage(img, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h);

			for (let path of update.soundPaths) {
				new Audio(path).play();
			}
		}
		this.context.restore();

		return this;
	}
};
