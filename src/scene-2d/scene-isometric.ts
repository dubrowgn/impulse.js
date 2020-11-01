import { Camera } from "./camera";
import { Scene } from "./scene";
import { SceneGraph } from "./scene-graph";

export interface IsometricStep {
	dx: number;
	dy: number;
	flipX: boolean;
};

export class SceneIsometric extends Scene {
	protected stepRads: number;
	protected halfStepRads: number;
	protected stepTable: IsometricStep[];

	constructor(cam: Camera, sg: SceneGraph, stepTable: IsometricStep[]) {
		super(cam, sg);
		this.halfStepRads = Math.PI / stepTable.length;
		this.stepRads = 2 * Math.PI / stepTable.length;
		this.stepTable = stepTable;
	}

	protected getStep(rads: number): IsometricStep {
		const stepCount = this.stepTable.length;

		let idx = Math.floor((rads - this.halfStepRads) / this.stepRads % stepCount);
		if (idx < 0)
			idx += stepCount;

		return this.stepTable[idx];
	}

	advance(deltaMs: number): this {
		const steps = this.stepTable.length;
		const halfStepRads = Math.PI / steps;

		let ents = this.sceneGraph.queryIntersectWith(this.camera.getViewport(true));
		let camMatrix = this.camera.getRenderMatrix();

		this.context.save();
		for(let ent of ents) {
			let update = ent.advance(deltaMs);
			let m = update.matrix;
			let r = update.frameRect;

			let rot = ent.getRotation();
			let step = this.getStep(rot);

			m.rotate(-rot);
			if (step.flipX)
				m.scale(-1, 0);

			r.x += step.dx;
			r.y += step.dx;

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
