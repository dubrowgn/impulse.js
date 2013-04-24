/**
 * @namespace
 */
Impulse.Scene2D = (function() {
	var Scene2D = {};

	// imports
	var Entity = Impulse.Entity;
	var EventDelegate = Impulse.Util.EventDelegate;
	var Intersect = Impulse.Shape2D.Intersect;
	var Matrix = Impulse.Shape2D.Matrix;
	var MouseAdapter = Impulse.Input.MouseAdapter;
	var Polygon = Impulse.Shape2D.Polygon;
	var Vector = Impulse.Shape2D.Vector;

	Scene2D.Camera = (function() {
		var Camera = function(canvas, x, y, w, h, viewportMargin) {
			this._cameraMatrix = new Matrix(1, 0, 0, 1, -x, -y);
			this._canvas = canvas;
			this.moved = new EventDelegate();
			this.rotated = new EventDelegate();
			this._targetH = h;
			this._targetW = w;
			this.viewportMargin = viewportMargin === undefined ? 0 : viewportMargin;
			this.zoomed = new EventDelegate();

			// hook into the window resize event handler
			var thisCamera = this;
			this._resizeHandler = function() { thisCamera._updateCanvasValues(); };
			window.addEventListener('resize', this._resizeHandler, false);

			// init the canvas related values for this camera
			this._updateCanvasValues();
		}; // class Camera

		Camera.prototype._cameraMatrix = undefined;
		Camera.prototype._canvas = undefined;
		Camera.prototype._canvasMatrix = undefined;
		Camera.prototype._h = undefined;
		Camera.prototype.moved = undefined;
		Camera.prototype._resizeHandler = undefined;
		Camera.prototype.rotated = undefined;
		Camera.prototype._targetH = 0;
		Camera.prototype._targetW = 0;
		Camera.prototype.viewportMargin = 0;
		Camera.prototype._w = undefined;
		Camera.prototype.zoomed = undefined;

		// Vector canvasToWorld(Number, Number);
		// Vector canvasToWorld(Vector);
		Camera.prototype.canvasToWorld = function(x, y) {
			if (typeof x === "number")
				x = new Vector(x, y);
			else
				x = x.clone();
			return x.applyTransform(this.getRenderMatrix().invert());
		}; // canvasToWorld( )

		// void destroy();
		Camera.prototype.destroy = function() {
			window.removeEventListener("resize", this._resizeHandler, false);
		}; // destroy( )

		// HTMLCanvas getCanvas();
		Camera.prototype.getCanvas = function() {
			return this._canvas;
		}; // getCanvas( )

		// Matrix getMatrix();
		Camera.prototype.getMatrix = function() {
			return this._cameraMatrix;
		}; // getMatrix( )

		// Vector2D getPosition();
		Camera.prototype.getPosition = function() {
			return new Vector(-this._cameraMatrix.e, -this._cameraMatrix.e);
		}; // getPosition( )

		// Matrix2D getRenderMatrix();
		Camera.prototype.getRenderMatrix = function() {
			return this._cameraMatrix.clone().combine(this._canvasMatrix);
		}; // getRenderMatrix( )

		// Polygon getViewport([Boolean]);
		Camera.prototype.getViewport = function(useMargin) {
			var hh = this._h / 2 + (useMargin === true ? this.viewportMargin : 0);
			var hw = this._w / 2 + (useMargin === true ? this.viewportMargin : 0);
			var vp = new Polygon([
				new Vector(-hw, hh),
				new Vector(hw, hh),
				new Vector(hw, -hh),
				new Vector(-hw, -hh)
			]);
			return vp.applyTransform(this._cameraMatrix.clone().invert());
		}; // getViewport( )

		// void rotate(Number)
		Camera.prototype.rotate = function(rads) {
			this._cameraMatrix.rotate(rads);
		};

		// void setPosition(Entity)
		// void setPosition(Vector)
		// void setPosition(Number, Number)
		Camera.prototype.setPosition = function(x, y) {
			if (x instanceof Entity)
				x = x.getPosition();

			if (x instanceof Vector) {
				this._cameraMatrix.e = -x.x;
				this._cameraMatrix.f = -x.y;
			} else {
				this._cameraMatrix.e = -x;
				this._cameraMatrix.f = -y;
			} // if / else

			this.moved.dispatch(this);
		}; // setPosition( )

		// void setRotation(Number)
		Camera.prototype.setRotation = function(rads) {
			this._cameraMatrix.rotate(rads - this._cameraMatrix.getRotation());
			this.rotated.dispatch(this);
		}; // setRotation( )

		Camera.prototype.setZoom = function(zoom) {
			this._cameraMatrix.preScale(zoom / this._cameraMatrix.getScale());
			this.zoomed.dispatch(this);
		}; // setZoom( )

		// void translate(Vector)
		// void translate(Number, Number)
		Camera.prototype.translate = function(x, y) {
			if (x instanceof Vector)
				this._cameraMatrix.preTranslate(-x.x, -x.y);
			else
				this._cameraMatrix.preTranslate(-x, -y);

			this.moved.dispatch(this);
		}; // translate( )

		// void _updateCanvasValues();
		Camera.prototype._updateCanvasValues = function() {
			// calculate zoom factor
			var zoom = Math.min(this._canvas.width / this._targetW, this._canvas.height / this._targetH);

			// update width/height values
			this._h = this._canvas.height / zoom;
			this._w = this._canvas.width / zoom;

			// rebuild the transformation matrix
			this._canvasMatrix = new Matrix(zoom, 0, 0, -zoom, this._canvas.width/2, this._canvas.height/2);

			// dispatch zoom changed event
			this.zoomed.dispatch(this);
		}; // _updateCanvasValues( )

		// Vector worldToCanvas(Number, Number);
		// Vector worldToCanvas(Vector);
		Camera.prototype.worldToCanvas = function(x, y) {
			if (typeof x === "number")
				x = new Vector(x, y);
			else
				x = x.clone();
			return x.applyTransform(this.getRenderMatrix());
		};

		// void zoom(Number)
		Camera.prototype.zoom = function(zoom) {
			this._cameraMatrix.preScale(zoom);
			this.zoomed(this);
		}; // zoom( )

		return Camera;
	});

	Scene2D.ISceneGraph = (function() {
		/**
		 * @abstract
		 */
		var SceneGraph = function() {}; // class Shape

		// void addEntity(Entity);
		SceneGraph.prototype.addEntity = function(ent) {
			throw "Not implemented!";
		}; // addEntity( )

		// void clear();
		SceneGraph.prototype.clear = function() {
			throw "Not implemented!";
		}; // clear( )

		// Vector getMtv(Shape, [Number], [Boolean]);
		SceneGraph.prototype.getMtv = function(shape, flags, useOr) {
			throw "Not implemented!";
		}; // getMtv( )

		// Array<Entity> query([Number], [Boolean]);
		SceneGraph.prototype.query = function(flags, useOr) {
			throw "Not implemented!";
		}; // query( )

		// Array<Entity> queryCenterIn(Shape, [Number], [Boolean]);
		SceneGraph.prototype.queryCenterIn = function(shape, flags, useOr) {
			throw "Not implemented!";
		}; // queryCenterIn( )

		// Array<Entity> queryContainedIn(Shape, [Number], [Boolean]);
		SceneGraph.prototype.queryContainedIn = function(shape, flags, useOr) {
			throw "Not implemented!";
		}; // queryContainedIn( )

		// Array<Entity> queryIntersectWith(Shape, [Number], [Boolean]);
		SceneGraph.prototype.queryIntersectWith = function(shape, flags, useOr) {
			throw "Not implemented!";
		}; // queryIntersectWith( )

		// Array<Entity> queryOutsideOf(Shape, [Number], [Boolean]);
		SceneGraph.prototype.queryOutsideOf = function(shape, flags, useOr) {
			throw "Not implemented!";
		}; // queryOutsideOf( )

		// void removeEntity(Entity);
		SceneGraph.prototype.removeEntity = function(ent) {
			throw "Not implemented!";
		}; // removeEntity( )

		return SceneGraph;
	});

	Scene2D.LinearSG = (function() {
		var Vector = Impulse.Shape2D.Vector;

		var LinearSG = function() {
			this._entities = [];
		}; // class LinearSG

		LinearSG.prototype = new Scene2D.ISceneGraph();
		LinearSG.prototype._entities = undefined;

		// void addEntity(Entity);
		LinearSG.prototype.addEntity = function(ent) {
			this._entities.push(ent);
		}; // addEntity( )

		// void clear();
		LinearSG.prototype.clear = function() {
			this._entities = [];
		}; // clear( )

		// Vector getMtv(Shape, [Number], [Boolean]);
		LinearSG.prototype.getMtv = function(shape, flags, useOr) {
			// init default values
			var entity = undefined;
			if (shape instanceof Entity) {
				entity = shape;
				shape = shape.getCollidable();
			} // if
			if (flags === undefined)
				flags = 0;
			if (useOr === undefined)
				useOr = true;

			var ent;
			var mtv = new Vector(0, 0);

			for (var i = 0; i < this._entities.length; i++) {
				ent = this._entities[i];

				// don't check against the original entity, if there is one
				if (ent === entity)
					continue;

				// test if ent.flags contain all of _flags
				if ((!flags || ((useOr && (ent.flags & flags) > 0) || (!useOr && (ent.flags & flags) === flags)))) {
					var localMtv = Intersect.shapeVsShapeSat(shape, ent.getCollidable());
					if (localMtv !== undefined)
						mtv.add(localMtv);
				} // if
			} // for( i )

			return mtv;
		}; // getMtv( )

		// Array<Entity> query([Number], [Boolean]);
		LinearSG.prototype.query = function(flags, useOr) {
			// init default values
			if (flags === undefined)
				flags = 0;
			if (useOr === undefined)
				useOr = true;

			var entArray = [];
			var ent;

			for (var i = 0; i < this._entities.length; i++) {
				ent = this._entities[i];
				// test if ent.flags contain all of _flags
				if ((!flags || ((useOr && (ent.flags & flags) > 0) || (!useOr && (ent.flags & flags) === flags))))
					entArray.push(ent);
			} // for( i )

			return entArray;
		}; // query( )

		// Array<Entity> queryCenterIn(Shape, [Number], [Boolean]);
		LinearSG.prototype.queryCenterIn = function(shape, flags, useOr) {
			// init default values
			var entity = undefined;
			if (shape instanceof Entity) {
				entity = shape;
				shape = shape.getCollidable();
			} // if
			shape = shape.getCenter();
			if (flags === undefined)
				flags = 0;
			if (useOr === undefined)
				useOr = true;

			var entArray = [];
			var ent;

			for (var i = 0; i < this._entities.length; i++) {
				ent = this._entities[i];

				// don't check against the original entity, if there is one
				if (ent === entity)
					continue;

				// test if ent.flags contain all of _flags
				if ((!flags || ((useOr && (ent.flags & flags) > 0) || (!useOr && (ent.flags & flags) === flags))) &&
					Intersect.shapeVsShape(shape, ent.getCollidable()))
					entArray.push(ent);
			} // for( i )

			return entArray;
		}; // queryCenterIn( )

		// Array<Entity> queryContainedIn(Shape, [Number], [Boolean]);
		LinearSG.prototype.queryContainedIn = function(shape, flags, useOr) {
			throw "Not implemented!";
		}; // queryContainedIn( )

		// Array<Entity> queryIntersectWith(Shape, [Number], [Boolean]);
		LinearSG.prototype.queryIntersectWith = function(shape, flags, useOr) {
			// init default values
			var entity = undefined;
			if (shape instanceof Entity) {
				entity = shape;
				shape = shape.getCollidable();
			} // if
			if (flags === undefined)
				flags = 0;
			if (useOr === undefined)
				useOr = true;

			var entArray = [];
			var ent;

			for (var i = 0; i < this._entities.length; i++) {
				ent = this._entities[i];

				// don't check against the original entity, if there is one
				if (ent === entity)
					continue;

				// test if ent.flags contain all of _flags
				if ((!flags || ((useOr && (ent.flags & flags) > 0) || (!useOr && (ent.flags & flags) === flags))) &&
					Intersect.shapeVsShape(shape, ent.getCollidable()))
					entArray.push(ent);
			} // for( i )

			return entArray;
		}; // queryIntersectWith( )

		// Array<Entity> queryOutsideOf(Shape, [Number], [Boolean]);
		LinearSG.prototype.queryOutsideOf = function(shape, flags, useOr) {
			throw "Not implemented!";
		}; // queryOutsideOf( )

		// void removeEntity(Entity);
		LinearSG.prototype.removeEntity = function(ent) {
			var index = this._entities.indexOf(ent);
			if (index >= 0)
				this._entities.splice(index, 1);
		}; // removeEntity( )

		return LinearSG;
	});

	Scene2D.QuadTreeSG = {}; // stub

	Scene2D.Scene = (function() {
		var Timing = Impulse.Util.Timing;

		var Scene = function(camera, sceneGraph) {
			this._camera = camera;
			this._canvas = camera.getCanvas();
			this._context = this._canvas.getContext("2d");
			this._mouse = new MouseAdapter(camera);
			this._sceneGraph = sceneGraph;
		}; // class Scene

		Scene.prototype._camera = undefined;
		Scene.prototype._canvas = undefined;
		Scene.prototype._context = undefined;
		Scene.prototype._lastRender = 0;
		Scene.prototype._mouse = undefined;
		Scene.prototype._sceneGraph = undefined;

		Scene.prototype.blank = function(rgb) {
			if (rgb === undefined) {
				this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
			} else {
				this._context.fillStyle = rgb;
				this._context.fillRect(0, 0, this._canvas.width, this._canvas.height);
			} // if/else
		}; // clear( )

		Scene.prototype.destroy = function() {
			this._mouse.destroy();
		}; // destroy( )

		Scene.prototype.getCamera = function() {
			return this._camera;
		}; // getCamera( )

		Scene.prototype.getMouse = function() {
			return this._mouse;
		}; // getMouse( )

		Scene.prototype.getSceneGraph = function() {
			return this._sceneGraph;
		}; // getSceneGraph( )

		Scene.prototype.render = function() {
			this._lastRender = this._lastRender || (new Date() | 0);
			var ents = this._sceneGraph.queryIntersectWith(this._camera.getViewport(true));
			var timeMs = Timing.now();
			var camMatrix = this._camera.getRenderMatrix();

			var animState = undefined;
			var r = undefined;
			var m = undefined;

			this._context.save();
			var lng = ents.length;
			for(var i = 0; i < lng; i++) {
				animState = ents[i].getAnimationState(timeMs);
				m = animState.matrix;
				r = animState.frameRect;

				if (r != undefined && m != undefined) {
					// combine camera transformations
					m.combine(camMatrix);

					// init canvas transformation
					this._context.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);

					// draw the image sprite to the canvas
					this._context.drawImage(animState.image, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h);
				} // if
			} // for( i )
			this._context.restore();

			this._lastRender += timeMs;
		}; // render( )

		return Scene;
	});

	// init in correct order
	Scene2D.Camera = Scene2D.Camera();
	Scene2D.ISceneGraph = Scene2D.ISceneGraph();
	Scene2D.LinearSG = Scene2D.LinearSG(); // requires ISceneGraph
	Scene2D.Scene = Scene2D.Scene(); // requires Camera, ISceneGraph

	return Scene2D;
});
