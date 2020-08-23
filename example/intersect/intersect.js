"use strict";

const { Camera } = require("Scene2D");
const { Circle, Intersect, Polygon, Rect, ShapeId, Vector } = require("Shape2D");

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

	var drawing = false;
	intersect.draw = function() {
		if (drawing)
			return;
			
		drawing = true;
		this.clearCanvas();

		for (var i = 0; i < _shapes.length; i++) {
			switch(_shapes[i].getShapeId()) {
				case ShapeId.Circle: intersect.drawCircle(_shapes[i], _intersecting[i]); break;
				case ShapeId.Polygon: intersect.drawPolygon(_shapes[i], _intersecting[i]); break;
				case ShapeId.Rect: intersect.drawRect(_shapes[i], _intersecting[i]); break;
				case ShapeId.Vector: intersect.drawVector(_shapes[i], _intersecting[i]); break;
			} // switch
		} // for( i )
		drawing = false;
	}; // draw( )

	intersect.drawCircle = function(cir, intersecting) {
		var m = _camera.getRenderMatrix();
		_ctx.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
		_ctx.beginPath();
		_ctx.arc(cir.x, cir.y, cir.r, 0, Math.PI * 2, true);
		_ctx.closePath();
		_ctx.fillStyle = "#0080ff";
		_ctx.fill();
		_ctx.strokeStyle = intersecting ? _borderColorIntersect : _borderColorNormal;
		_ctx.stroke();
	}; // drawCircle( )

	intersect.drawPolygon = function(poly, intersecting) {
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
		_ctx.strokeStyle = intersecting ? _borderColorIntersect : _borderColorNormal;
		_ctx.stroke();
	}; // drawPolygon( )

	intersect.drawRect = function(rect, intersecting) {
		var m = _camera.getRenderMatrix();
		_ctx.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
		_ctx.fillStyle = "#ff8000";
		_ctx.fillRect(rect.x, rect.y, rect.w, -rect.h);
		_ctx.strokeStyle = intersecting ? _borderColorIntersect : _borderColorNormal;
		_ctx.strokeRect(rect.x, rect.y, rect.w, -rect.h);
	}; // drawRect( )

	intersect.drawVector = function(vect, intersecting) {
		var m = _camera.getRenderMatrix();
		_ctx.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
		_ctx.fillStyle = "#ff00ff";
		_ctx.fillRect(vect.x, vect.y, 1, -1);
		_ctx.strokeStyle = intersecting ? _borderColorIntersect : _borderColorNormal;
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
		return new Vector(
			e.offsetX !== undefined ? e.offsetX : e.pageX - e.currentTarget.offsetLeft,
			e.offsetY !== undefined ? e.offsetY : e.pageY - e.currentTarget.offsetTop
		);
	}; // mousePosition( )
	
	intersect.mouseDown = function(e) {
		// back-translate mouse position into world coordinates
		var pos = intersect.mousePosition(e);
		pos.transform(_camera.getRenderMatrix().invert());

		for (var i = _shapes.length - 1; i >= 0; i--) {
			if (Intersect.shapeVsShape(_shapes[i], pos)) {
				_moving = _shapes[i];
				_mouseOffset = _moving.getCenter().transform(_camera.getRenderMatrix()).add(intersect.mousePosition(e).negate());
				break;
			} // if
		} // for( i )
	}; // mouseDown( )
	
	intersect.mouseMove = function(e) {
		if (_moving === undefined)
			return;
		
		// back-translate mouse position into world coordinates
		var pos = intersect.mousePosition(e).add(_mouseOffset);
		pos.transform(_camera.getRenderMatrix().invert());
		
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
