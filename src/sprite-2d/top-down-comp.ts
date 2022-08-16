import { Component, ComponentList, ComponentSystem } from "../ecs/component";
import { EntityId } from "../ecs/entity-id";
import { Camera } from "../scene-2d/camera";
import { PositionComp } from "../scene-2d/position-comp";
import { Matrix } from "../shape2d";
import { AnimationState } from "./animation-state";

export class TopDownComp implements Component {
	anim!: AnimationState;
	eid!: EntityId;
	pos!: PositionComp;
	rads: number = 0;
};
export class TopDownList extends ComponentList<TopDownComp> {
	constructor() {
		super(TopDownComp);
	}
};

export class TopDownSystem implements ComponentSystem<TopDownComp> {
	update(comps: TopDownList, camera: Camera, deltaSec: number): this {
		let camMatrix = camera.getRenderMatrix();
		let ctx = camera.drawContext;

		ctx.save();
		for (let c of comps) {
			let update = c.anim.advance(deltaSec);

			// combine camera transformations
			let m = new Matrix()
				.translate(c.pos.x, c.pos.y)
				.preRotate(c.rads);
			m = update.matrix
				.combine(m)
				.combine(camMatrix);

			// init canvas transformation
			ctx.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);

			// draw the image sprite to the canvas
			let r = update.frameRect;
			ctx.drawImage(update.img, r.l, r.b, r.w, r.h, 0, 0, r.w, r.h);
		}
		ctx.restore();

		return this;
	}
};
