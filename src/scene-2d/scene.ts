import { Camera } from "./camera";
import { MouseAdapter } from "../input/mouse";
import { SceneGraph } from "./scene-graph";

export abstract class Scene {
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

	abstract advance(deltaMs: number): this;
};
