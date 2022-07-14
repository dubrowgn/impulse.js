"use strict";

const { Camera } = require("scene2d");
const { Vector } = require("shape2d");
const { AnimationState, SpriteSheet, TopDownList, TopDownSystem } = require("sprite2d");
const { MrArray } = require("data-struct/min-repeating-rand");
const { sounds } = require("asset/audio-cache");

let sheet = SpriteSheet.fromJson({
	"anims": {
		"stand": {
			"frames": [
				{ "seconds": 100, "tileX": 1 }
			],
			"tileY": 0
		},
		"walk": {
			"frames": [
				{ "seconds": 0.3, "tileX": 1 },
				{ "seconds": 0.3, "tileX": 2, "event": "step" },
				{ "seconds": 0.3, "tileX": 1 },
				{ "seconds": 0.3, "tileX": 0, "event": "step" }
			],
			"tileY": 0
		}
	},
	"matrix": { "a": 1, "b": 0, "c": 0, "d": 1, "e": -64, "f": -64 },
	"path": "image/td-player-128.png",
	"tileH": 128,
	"tileW": 128
});

let footsteps;
{
	let arr = [];
	for (let i = 1; i <= 8; i++) {
		arr.push(sounds.get(`sound/footstep/${i}.ogg`));
	}

	footsteps = new MrArray(arr);
}

class Demo {
	#camera;
	#console;
	#keyState = { w: false, a: false, s: false, d: false };
	#mousePos = new Vector(0, 0);
	#nowMs;
	#player;
	#playerS = 256;
	#playerV = new Vector(0, 0);
	#status;
	#topDowns;
	#topDownSystem;

	#aminEvent(name) {
		switch (name) {
			case "step":
				footsteps.next().play();
				break;
		}
	}

	#makePlayer() {
		let eid = 0;

		let pos = { eid, x: 0, y: 0 };

		let topDown = this.#topDowns.create(eid);
		topDown.pos = pos;
		topDown.anim = new AnimationState(sheet.anims.get("stand"));
		topDown.anim.register(this.#aminEvent);

		return { eid, pos, topDown };
	}

	constructor(canvas, console, status) {
		this.#camera = new Camera(canvas, 0, 0, 800, 500, 0);
		this.#console = console;
		this.#status = status;
		this.#topDowns = new TopDownList();
		this.#topDownSystem = new TopDownSystem();

		this.#player = this.#makePlayer();

		document.addEventListener('keydown', e => this.#onKey(e, true), false);
		document.addEventListener('keyup', e => this.#onKey(e, false), false);
		canvas.addEventListener('mousemove', this.#onMouseMove.bind(this), false);
	}

	#onKey(e, down) {
		if (e.altKey || e.ctrlKey || e.shiftKey)
			return;

		switch (e.key) {
			case "w":
			case "a":
			case "s":
			case "d":
				break;
			default:
				return;
		}

		this.#keyState[e.key] = down;

		let v = new Vector(0, 0);
		if (this.#keyState.a)
			v.x -= this.#playerS;
		if (this.#keyState.d)
			v.x += this.#playerS;
		if (this.#keyState.s)
			v.y -= this.#playerS;
		if (this.#keyState.w)
			v.y += this.#playerS;

		this.#playerV = v;
		let anim = sheet.anims.get(v.isZero() ? "stand" : "walk");
		if (this.#player.topDown.anim.animation !== anim)
			this.#player.topDown.anim.animation = anim;
	}

	#onMouseMove(e) {
		this.#mousePos = this.#camera.canvasToWorld(e.offsetX, e.offsetY);
	}

	#writeLine(msg) {
		this.#console.textContent += `${msg}\n`;
	}

	#step(tsMs) {
		let deltaMs = tsMs - this.#nowMs;
		this.#nowMs = tsMs;
		let deltaS = deltaMs / 1000;

		this.#status.textContent =
			`${(1/deltaS).toFixed(1)} fps\n` +
			`(${this.#mousePos.x.toFixed(2)}, ${this.#mousePos.y.toFixed(2)})`;

		let canvas = this.#camera.getCanvas();
		let ctx = this.#camera.drawContext;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		this.#updateRads();
		this.#player.pos.x += this.#playerV.x * deltaS;
		this.#player.pos.y += this.#playerV.y * deltaS;

		this.#topDownSystem.update(this.#topDowns, this.#camera, deltaS);

		requestAnimationFrame(this.#step.bind(this));
	}

	#updateRads() {
		let td = this.#player.topDown;
		td.rads = new Vector(td.pos.x, td.pos.y).angleTo(this.#mousePos);
	}

	start() {
		this.#writeLine("start!");
		this.#nowMs = performance.now();
		requestAnimationFrame(this.#step.bind(this));
	}
};
