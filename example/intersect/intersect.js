"use strict";

const { Camera } = require("scene2d");
const { Circle, Intersect, Polygon, Rect, ShapeId, Vector } = require("shape2d");

var intersect = (function() {
	var intersect = {};

	// constants
	var _borderColorNormal = "#ffffff";
	var _borderColorIntersect = "#ff0000";

	// private variables
	var _camera;
	var _canvas;
	var _console;
	var _ctx;
	var _intersecting;
	var _moving;
	var _mouseOffset;
	var _shapes;

	// public variables
	intersect.isInit = false;

	intersect.clearCanvas = function() {
		_ctx.setTransform(1, 0, 0, 1, 0, 0);
		_ctx.clearRect(0, 0, _canvas.width, _canvas.height);
	}; // clearCanvas( )

	intersect.clearConsole = function() {
		_console.innerHTML = "";
	}; // clearConsole( )

	intersect.printDebug = function() {
		this.clearConsole();

		for (var i = 0; i < _shapes.length; i++) {
			this.printLn(_shapes[i]);
		} // for( i )
	}; // printDebug( )

	intersect.draw = function() {
		this.clearCanvas();

		var m = _camera.getRenderMatrix();
		_ctx.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);

		for (var i = 0; i < _shapes.length; i++) {
			switch(_shapes[i].getShapeId()) {
				case ShapeId.Circle: intersect.drawCircle(_shapes[i], _intersecting[i]); break;
				case ShapeId.Polygon: intersect.drawPolygon(_shapes[i], _intersecting[i]); break;
				case ShapeId.Rect: intersect.drawRect(_shapes[i], _intersecting[i]); break;
				case ShapeId.Vector: intersect.drawVector(_shapes[i], _intersecting[i]); break;
			} // switch
		}
	};

	intersect.drawCircle = function(cir, intersecting) {
		_ctx.beginPath();
		_ctx.arc(cir.x, cir.y, cir.r, 0, Math.PI * 2, true);
		_ctx.closePath();
		_ctx.fillStyle = "#0080ff";
		_ctx.fill();
		_ctx.strokeStyle = intersecting ? _borderColorIntersect : _borderColorNormal;
		_ctx.stroke();
	};

	intersect.drawPolygon = function(poly, intersecting) {
		_ctx.beginPath();
		for (var i = 1; i < poly._vertices.length; i++) {
			_ctx.lineTo(poly._vertices[i-1].x, poly._vertices[i-1].y);
			_ctx.lineTo(poly._vertices[i].x, poly._vertices[i].y);
		} // for( i )
		_ctx.closePath();
		_ctx.fillStyle = "#00cc00";
		_ctx.fill();
		_ctx.strokeStyle = intersecting ? _borderColorIntersect : _borderColorNormal;
		_ctx.stroke();
	};

	intersect.drawRect = function(rect, intersecting) {
		_ctx.fillStyle = "#ff8000";
		_ctx.fillRect(rect.l, rect.b, rect.w, rect.h);
		_ctx.strokeStyle = intersecting ? _borderColorIntersect : _borderColorNormal;
		_ctx.strokeRect(rect.l, rect.b, rect.w, rect.h);
	};

	intersect.drawVector = function(vect, intersecting) {
		_ctx.strokeStyle = intersecting ? _borderColorIntersect : _borderColorNormal;
		_ctx.strokeRect(vect.x, vect.y, 0.5, 0.5);
	};

	intersect.init = function(canvas, console) {
		_canvas = canvas;
		_camera = new Camera(canvas, 0, 0, 768, 480, 0);
		_console = console;
		_ctx = canvas.getContext("2d");
		_mouseOffset = new Vector(0, 0);

		_shapes = [
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

		// generate intersecting flags
		_intersecting = [];
		for (var i = 0; i < _shapes.length; i++) {
			_intersecting.push(false);
		} // for( i )

		// draw visuals
		this.draw();
		this.printDebug();

		// add event handlers for mouse
		canvas.addEventListener('mousedown', this.mouseDown, false);
		canvas.addEventListener('mousemove', this.mouseMove, false);
		canvas.addEventListener('mouseup', this.mouseUp, false);

		_camera.resized.register(() => this.draw());

		// set init flag
		this.isInit = true;
	};

	intersect.mousePosition = function(e) {
		return new Vector(
			e.offsetX !== undefined ? e.offsetX : e.pageX - e.currentTarget.offsetLeft,
			e.offsetY !== undefined ? e.offsetY : e.pageY - e.currentTarget.offsetTop
		);
	}; // mousePosition( )

	intersect.mouseDown = function(e) {
		let mousePos = intersect.mousePosition(e);
		let worldPos = _camera.canvasToWorld(mousePos);

		for (var i = _shapes.length - 1; i >= 0; i--) {
			if (Intersect.shapeVsShape(_shapes[i], worldPos)) {
				_moving = _shapes[i];
				_mouseOffset = _moving.getCenter().clone().subtract(worldPos);
				break;
			} // if
		} // for( i )
	}; // mouseDown( )

	intersect.mouseMove = function(e) {
		if (_moving === undefined)
			return;

		// back-translate mouse position into world coordinates
		var pos = intersect.mousePosition(e);
		pos = _camera.canvasToWorld(pos).add(_mouseOffset);

		// move selected object
		_moving.setCenter(pos.x, pos.y);

		// test for intersections
		var overlap;
		for (var i = 0; i < _shapes.length; i++) {
			_intersecting[i] = false;
			for (var j = 0; j < _shapes.length; j++) {
				if (i != j) {
					overlap = Intersect.shapeVsShape(_shapes[i], _shapes[j]);
					_intersecting[i] = _intersecting[i] || overlap;
					_intersecting[j] = _intersecting[j] || overlap;
				} // if
			} // for( j )
		} // for( i )

		intersect.draw();
		intersect.printDebug();
	}; // mouseMove( )

	intersect.mouseUp = function(e) {
		_moving = undefined;
	}; // mouseUp( )

	intersect.printLn = function(str) {
		_console.innerHTML += str + "<br />";
	}; // printLn( )

	return intersect;
})();
