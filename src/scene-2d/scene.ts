import { Camera } from "./camera";
import { MouseAdapter } from "../Input";
import { SceneGraph } from "./scene-graph";
import { Timing } from "../util/timing";

export class Scene {
	protected camera: Camera;
	protected canvas: HTMLCanvasElement;
	protected context: CanvasRenderingContext2D;
	protected mouse: MouseAdapter;
	protected sceneGraph: SceneGraph;

	constructor(cam: Camera, sg: SceneGraph) {
		this.camera = cam;
		this.canvas = cam.getCanvas();

		let context = this.canvas.getContext("2d");
		if (!context)
			throw "Failed to instantiate 2d canvas context";

		this.context = context;
		this.mouse = new MouseAdapter(cam);
		this.sceneGraph = sg;
	}

	blank(rgb?: string): this {
		if (rgb === undefined) {
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		} else {
			this.context.fillStyle = rgb;
			this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
		}

		return this;
	}

	destroy() {
		this.mouse.destroy();
	}

	getCamera(): Camera {
		return this.camera;
	}

	getMouse(): MouseAdapter {
		return this.mouse;
	}

	getSceneGraph(): SceneGraph {
		return this.sceneGraph;
	}

	render(): this {
		let ents = this.sceneGraph.queryIntersectWith(this.camera.getViewport(true));
		let timeMs = Timing.now();
		let camMatrix = this.camera.getRenderMatrix();

		this.context.save();
		let lng = ents.length;
		for(let i = 0; i < lng; i++) {
			let animState = ents[i].getAnimationState(timeMs);
			if (animState === undefined)
				continue;

			let m = animState.matrix;
			let r = animState.frameRect;

			if (r != undefined && m != undefined) {
				// combine camera transformations
				m.combine(camMatrix);

				// init canvas transformation
				this.context.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);

				// draw the image sprite to the canvas
				this.context.drawImage(animState.image, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h);
			}
		}
		this.context.restore();

		return this;
	}
};
