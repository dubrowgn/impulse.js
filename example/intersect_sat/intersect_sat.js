"use strict";

const { Scene2D, Shape2D } = require("impulse");

var intersect = (function() {
	var intersect = {};

	// imports
	var Camera = Scene2D.Camera;
	var Circle = Shape2D.Circle;
	var Intersect = Shape2D.Intersect;
	var Polygon = Shape2D.Polygon;
	var Rect = Shape2D.Rect;
	var Vector = Shape2D.Vector;

	// constants
	var _borderColorNormal = "#ffffff";

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

	var drawing = false;
	intersect.draw = function() {
		if (drawing)
			return;
			
		drawing = true;
		this.clearCanvas();

		for (var i = 0; i < _shapes.length; i++) {
			switch(_shapes[i].getShapeID()) {
				case 0: intersect.drawCircle(_shapes[i]); break;
				case 1: intersect.drawPolygon(_shapes[i]); break;
				case 2: intersect.drawRect(_shapes[i]); break;
				case 3: intersect.drawVector(_shapes[i]); break;
			} // switch
		} // for( i )
		drawing = false;
	}; // draw( )

	intersect.drawCircle = function(cir) {
		var m = _camera.getRenderMatrix();
		_ctx.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
		_ctx.beginPath();
		_ctx.arc(cir.x, cir.y, cir.r, 0, Math.PI * 2, true);
		_ctx.closePath();
		_ctx.fillStyle = "#0080ff";
		_ctx.fill();
		_ctx.strokeStyle = _borderColorNormal;
		_ctx.stroke();
	}; // drawCircle( )

	intersect.drawPolygon = function(poly) {
		var m = _camera.getRenderMatrix();
		_ctx.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
		_ctx.beginPath();
		for (var i = 1; i < poly._vertices.length; i++) {
			_ctx.lineTo(poly._vertices[i-1].x, poly._vertices[i-1].y);
			_ctx.lineTo(poly._vertices[i].x, poly._vertices[i].y);
		} // for( i )
		_ctx.closePath();
		_ctx.fillStyle = "#00cc00";
		_ctx.fill();
		_ctx.strokeStyle = _borderColorNormal;
		_ctx.stroke();
	}; // drawPolygon( )

	intersect.drawRect = function(rect) {
		var m = _camera.getRenderMatrix();
		_ctx.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
		_ctx.fillStyle = "#ff8000";
		_ctx.fillRect(rect.x, rect.y, rect.w, -rect.h);
		_ctx.strokeStyle = _borderColorNormal;
		_ctx.strokeRect(rect.x, rect.y, rect.w, -rect.h);
	}; // drawRect( )

	intersect.drawVector = function(vect) {
		var m = _camera.getRenderMatrix();
		_ctx.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
		_ctx.fillStyle = "#ff00ff";
		_ctx.fillRect(vect.x, vect.y, 1, -1);
		_ctx.strokeStyle = _borderColorNormal;
		_ctx.strokeRect(vect.x, vect.y, 1, -1);
	}; // drawVector( )

	intersect.init = function(canvas, console) {
		_canvas = canvas;
		_camera = new Camera(canvas, 0, 0, 768, 480, 0);
		_console = console;
		_ctx = canvas.getContext("2d");
		_mouseOffset = new Vector(0, 0);

		var s;
		_shapes = [];

		// circle 1
		s = (new Circle(0, 0, 64)).setCenter(-80, 80);
		_shapes.push(s);
		// circle 2
		s = s.clone();
		s.r = 48;
		s.setCenter(240, 80);
		_shapes.push(s);

		// polygon 1
		s = new Polygon([
			new Vector(64, 4),
			new Vector(126, 50),
			new Vector(102, 122),
			new Vector(26, 122),
			new Vector(2, 50)]);
		s.setCenter(new Vector(-240, -80));
		_shapes.push(s);
		// polygon 2
		s = new Polygon([
			new Vector(0, 0),
			new Vector(60, 30),
			new Vector(90, -90),
			new Vector(30, -60)]);
		s.setCenter(new Vector(80, -80));
		_shapes.push(s);

		// rect 1
		s = new Rect(-64, 64, 128, 128).setCenter(-240, 80);
		_shapes.push(s);
		// rect 2
		s = s.clone();
		s.h = 84;
		s.w = 84;
		s.setCenter(80, 80);
		_shapes.push(s);

		// vector 1
		s = new Vector(0, 0).setCenter(-80, -80);
		_shapes.push(s);
		// vector 2
		s = s.clone().setCenter(240, -80);
		_shapes.push(s);

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

		// set init flag
		this.isInit = true;
	};

	intersect.mousePosition = function(e) {
		return new Vector(e.offsetX !== undefined ? e.offsetX : e.pageX - e.currentTarget.offsetLeft,
			e.offsetY !== undefined ? e.offsetY : e.pageY - e.currentTarget.offsetTop);
	}; // mousePosition( )
	
	intersect.mouseDown = function(e) {
		// back-translate mouse position into world coordinates
		var mousePos = intersect.mousePosition(e);
		var pos = mousePos.clone().applyTransform(_camera.getRenderMatrix().invert());

		for (var i = _shapes.length - 1; i >= 0; i--) {
			if (Intersect.shapeVsShape(_shapes[i], pos)) {
				_moving = _shapes[i];
				_mouseOffset = _moving.getCenter().applyTransform(_camera.getRenderMatrix()).add(mousePos.negate());
				break;
			} // if
		} // for( i )
	}; // mouseDown( )
	
	intersect.mouseMove = function(e) {
		if (_moving === undefined)
			return;
		
		// back-translate mouse position into world coordinates
		var pos = intersect.mousePosition(e).add(_mouseOffset);
		pos.applyTransform(_camera.getRenderMatrix().invert());
		
		// move selected object
		_moving.setCenter(pos.x, pos.y);

		// test for intersections
		for (var i = 0; i < _shapes.length; i++) {
			_intersecting[i] = false;
			if (_moving !== _shapes[i]) {
				var mtv = Intersect.shapeVsShapeSat(_moving, _shapes[i]);
				if (mtv !== undefined)
					_moving.setCenter(_moving.getCenter().add(mtv));
			} // if
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
