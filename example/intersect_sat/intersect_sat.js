"use strict";

const { Camera } = require("scene2d");
const { Circle, Intersect, Polygon, Rect, ShapeId, Vector } = require("shape2d")

class IntersectSatDemo {
	#camera;
	#canvas;
	#console;
	#ctx;
	#drawMap;
	#moving;
	#mouseOffset = new Vector(0, 0);
	#shapes;

	#clearCanvas() {
		this.#ctx.setTransform(1, 0, 0, 1, 0, 0);
		this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
	}

	#clearConsole() {
		this.#console.innerHTML = "";
	}

	#printDebug() {
		this.#clearConsole();

		for (let s of this.#shapes) {
			this.#printLn(s);
		}
	}

	#draw() {
		this.#clearCanvas();

		let m = this.#camera.getRenderMatrix();
		this.#ctx.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);

		for (let i = 0; i < this.#shapes.length; i++) {
			let s = this.#shapes[i];
			this.#drawMap[s.getShapeId()](this.#ctx, s, "#ffffff");
		}
	}

	#drawCircle(ctx, cir, strokeStyle) {
		ctx.beginPath();
		ctx.arc(cir.x, cir.y, cir.r, 0, Math.PI * 2, true);
		ctx.closePath();
		ctx.fillStyle = "#0080ff";
		ctx.fill();
		ctx.strokeStyle = strokeStyle;
		ctx.stroke();
	}

	#drawPolygon(ctx, poly, strokeStyle) {
		ctx.beginPath();
		for (let i = 1; i < poly._vertices.length; i++) {
			ctx.lineTo(poly._vertices[i-1].x, poly._vertices[i-1].y);
			ctx.lineTo(poly._vertices[i].x, poly._vertices[i].y);
		}

		ctx.closePath();
		ctx.fillStyle = "#00cc00";
		ctx.fill();
		ctx.strokeStyle = strokeStyle;
		ctx.stroke();
	}

	#drawRect(ctx, rect, strokeStyle) {
		ctx.fillStyle = "#ff8000";
		ctx.fillRect(rect.l, rect.b, rect.w, rect.h);
		ctx.strokeStyle = strokeStyle;
		ctx.strokeRect(rect.l, rect.b, rect.w, rect.h);
	}

	#drawVector(ctx, vect, strokeStyle) {
		ctx.strokeStyle = strokeStyle;
		ctx.strokeRect(vect.x, vect.y, 0.5, 0.5);
	}

	constructor(canvas, konsole) {
		this.#canvas = canvas;
		this.#camera = new Camera(canvas, 0, 0, 768, 480, 0);
		this.#console = konsole;
		this.#ctx = canvas.getContext("2d");

		this.#drawMap = [];
		this.#drawMap[ShapeId.Circle] = this.#drawCircle;
		this.#drawMap[ShapeId.Polygon] = this.#drawPolygon;
		this.#drawMap[ShapeId.Rect] = this.#drawRect;
		this.#drawMap[ShapeId.Vector] = this.#drawVector;

		this.#shapes = [
			new Circle(-80, 80, 64),
			new Circle(240, 80, 48),
			new Polygon([
				new Vector(-240, -139),
				new Vector(-178, -93),
				new Vector(-202, -21),
				new Vector(-278, -21),
				new Vector(-302, -93),
			]),
			new Polygon([
				new Vector(35, -50),
				new Vector(95, -20),
				new Vector(125, -140),
				new Vector(65, -110),
			]),
			new Rect(-304, 16, 128, 128),
			new Rect(38, 38, 84, 84),
			new Vector(-80, -80),
			new Vector(240, -80),
		];

		// draw visuals
		this.#draw();
		this.#printDebug();

		// add event handlers for mouse
		canvas.addEventListener('mousedown', this.#mouseDown.bind(this), false);
		canvas.addEventListener('mousemove', this.#mouseMove.bind(this), false);
		canvas.addEventListener('mouseup', this.#mouseUp.bind(this), false);

		this.#camera.resized.register(this.#draw.bind(this));
	}

	#mousePosition(e) {
		return new Vector(
			e.offsetX !== undefined ? e.offsetX : e.pageX - e.currentTarget.offsetLeft,
			e.offsetY !== undefined ? e.offsetY : e.pageY - e.currentTarget.offsetTop
		);
	}

	#mouseDown(e) {
		let mousePos = this.#mousePosition(e);
		let worldPos = this.#camera.canvasToWorld(mousePos);

		for (let s of this.#shapes) {
			if (!Intersect.shapeVsShape(s, worldPos))
				continue;

			this.#moving = s;
			this.#mouseOffset = s.getCenter().clone().subtract(worldPos);
		}
	}

	#mouseMove(e) {
		if (this.#moving === undefined)
			return;

		// back-translate mouse position into world coordinates
		let pos = this.#mousePosition(e);
		pos = this.#camera.canvasToWorld(pos).add(this.#mouseOffset);

		// move selected object
		this.#moving.setCenter(pos.x, pos.y);

		// test for intersections
		for (let s of this.#shapes) {
			if (this.#moving === s)
				continue;

			let mtv = Intersect.shapeVsShapeSat(this.#moving, s);
			if (mtv === undefined)
				continue;

			this.#moving.setCenter(this.#moving.getCenter().add(mtv));
			this.#mouseOffset.add(mtv);
		}

		this.#draw();
		this.#printDebug();
	}

	#mouseUp(e) {
		this.#moving = undefined;
	}

	#printLn(str) {
		this.#console.innerHTML += str + "<br />";
	}
};
