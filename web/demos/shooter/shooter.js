window.Shooter = (function() {
	// imports
	var Animation = Impulse.Model2D.Animation;
	var Camera = Impulse.Scene2D.Camera;
	var Circle = Impulse.Shape2D.Circle;
	var Entity = Impulse.Entity;
	var EventDelegate = Impulse.Util.EventDelegate;
	var LinearSG = Impulse.Scene2D.LinearSG;
	var Matrix = Impulse.Shape2D.Matrix;
	var Model = Impulse.Model2D.Model;
	var Rect = Impulse.Shape2D.Rect;
	var Scene = Impulse.Scene2D.Scene;
	var Timing = Impulse.Util.Timing;
	var Vector = Impulse.Shape2D.Vector;

	var animId = {
		stand:1,
		walk:2,
		shoot:3
	};

	var entityFlags = {
		none:0,
		player:1,
		collidable:2
	};

	var Shooter = function(canvas) {
		this.fpsChanged = new EventDelegate();

		var map = {};

		// images
		var images = {};
		images.bush = new Image();
		images.bush.src = "assets/image/bush.png";
		images.grass = new Image();
		images.grass.src = "assets/image/grass.jpg";
		images.innerWallH = new Image();
		images.innerWallH.src = "assets/image/inner_wall_h.png";
		images.innerWallV = new Image();
		images.innerWallV.src = "assets/image/inner_wall_v.png";
		images.player = new Image();
		images.player.src = "assets/image/player.png";
		images.outerWallL = new Image();
		images.outerWallL.src = "assets/image/outer_wall_l.png";
		images.outerWallT = new Image();
		images.outerWallT.src = "assets/image/outer_wall_t.png";
		images.outerWallR = new Image();
		images.outerWallR.src = "assets/image/outer_wall_r.png";
		images.outerWallB = new Image();
		images.outerWallB.src = "assets/image/outer_wall_b.png";

		map.images = images;

		// models
		var models = {};
		models.bush = new Model(map.images.bush);
		models.bush.animations[animId.stand] = new Animation(new Rect(0, 0, 256, 256), 1, 100, new Matrix().translate(-128, 128));
		models.grass = new Model(map.images.grass);
		models.grass.animations[animId.stand] = new Animation(new Rect(0, 0, 640, 640), 1, 100, new Matrix().translate(-320, 320));
		models.innerWallH = new Model(map.images.innerWallH);
		models.innerWallH.animations[animId.stand] = new Animation(new Rect(0, 0, 1066, 299), 1, 100, new Matrix().translate(-533, 149.5));
		models.innerWallV = new Model(map.images.innerWallV);
		models.innerWallV.animations[animId.stand] = new Animation(new Rect(0, 0, 296, 2465), 1, 100, new Matrix().translate(-148, 1232.5));
		models.player = new Model(map.images.player);
		models.player.animations[animId.stand] = new Animation(new Rect(0, 0, 1200, 1200), 1, 100, new Matrix().translate(-600, 600).scale(0.20));
		models.player.animations[animId.walk] = models.player.animations[animId.stand];
		models.player.animations[animId.shoot] = models.player.animations[animId.stand];
		models.outerWallL = new Model(map.images.outerWallL);
		models.outerWallL.animations[animId.stand] = new Animation(new Rect(0, 0, 192, 3840), 1, 100, new Matrix().translate(-96, 1920));
		models.outerWallT = new Model(map.images.outerWallT);
		models.outerWallT.animations[animId.stand] = new Animation(new Rect(0, 0, 2176, 192), 1, 100, new Matrix().translate(-1088, 96));
		models.outerWallR = new Model(map.images.outerWallR);
		models.outerWallR.animations[animId.stand] = new Animation(new Rect(0, 0, 192, 3840), 1, 100, new Matrix().translate(-96, 1920));
		models.outerWallB = new Model(map.images.outerWallB);
		models.outerWallB.animations[animId.stand] = new Animation(new Rect(0, 0, 2176, 192), 1, 100, new Matrix().translate(-1088, 96));

		map.models = models;

		// entities
		var bushes = [
			new Entity(map.models.bush, new Vector(-128, 1228), new Circle(0, 0, 128), undefined, entityFlags.collidable),
			new Entity(map.models.bush, new Vector(128, 1100), new Circle(0, 0, 128), undefined, entityFlags.collidable),
			new Entity(map.models.bush, new Vector(-512, 64), new Circle(0, 0, 128), undefined, entityFlags.collidable),
			new Entity(map.models.bush, new Vector(256, -564), new Circle(0, 0, 128), undefined, entityFlags.collidable),
			new Entity(map.models.bush, new Vector(128, -692), new Circle(0, 0, 128), undefined, entityFlags.collidable),
			new Entity(map.models.bush, new Vector(832, -1460), new Circle(0, 0, 128), undefined, entityFlags.collidable)
		];
		for (var i = 0; i < bushes.length; ++i) {
			bushes[i].modelState.playAnimation(animId.stand);
		} // for( i )
		var grass = [
			new Entity(map.models.grass, new Vector(-960, 1600), new Rect(-320, 320, 640, 640), undefined, entityFlags.none),
			new Entity(map.models.grass, new Vector(-320, 1600), new Rect(-320, 320, 640, 640), undefined, entityFlags.none),
			new Entity(map.models.grass, new Vector(320, 1600), new Rect(-320, 320, 640, 640), undefined, entityFlags.none),
			new Entity(map.models.grass, new Vector(960, 1600), new Rect(-320, 320, 640, 640), undefined, entityFlags.none),

			new Entity(map.models.grass, new Vector(-960, 960), new Rect(-320, 320, 640, 640), undefined, entityFlags.none),
			new Entity(map.models.grass, new Vector(-320, 960), new Rect(-320, 320, 640, 640), undefined, entityFlags.none),
			new Entity(map.models.grass, new Vector(320, 960), new Rect(-320, 320, 640, 640), undefined, entityFlags.none),
			new Entity(map.models.grass, new Vector(960, 960), new Rect(-320, 320, 640, 640), undefined, entityFlags.none),

			new Entity(map.models.grass, new Vector(-960, 320), new Rect(-320, 320, 640, 640), undefined, entityFlags.none),
			new Entity(map.models.grass, new Vector(-320, 320), new Rect(-320, 320, 640, 640), undefined, entityFlags.none),
			new Entity(map.models.grass, new Vector(320, 320), new Rect(-320, 320, 640, 640), undefined, entityFlags.none),
			new Entity(map.models.grass, new Vector(960, 320), new Rect(-320, 320, 640, 640), undefined, entityFlags.none),

			new Entity(map.models.grass, new Vector(-960, -320), new Rect(-320, 320, 640, 640), undefined, entityFlags.none),
			new Entity(map.models.grass, new Vector(-320, -320), new Rect(-320, 320, 640, 640), undefined, entityFlags.none),
			new Entity(map.models.grass, new Vector(320, -320), new Rect(-320, 320, 640, 640), undefined, entityFlags.none),
			new Entity(map.models.grass, new Vector(960, -320), new Rect(-320, 320, 640, 640), undefined, entityFlags.none),

			new Entity(map.models.grass, new Vector(-960, -960), new Rect(-320, 320, 640, 640), undefined, entityFlags.none),
			new Entity(map.models.grass, new Vector(-320, -960), new Rect(-320, 320, 640, 640), undefined, entityFlags.none),
			new Entity(map.models.grass, new Vector(320, -960), new Rect(-320, 320, 640, 640), undefined, entityFlags.none),
			new Entity(map.models.grass, new Vector(960, -960), new Rect(-320, 320, 640, 640), undefined, entityFlags.none),

			new Entity(map.models.grass, new Vector(-960, -1600), new Rect(-320, 320, 640, 640), undefined, entityFlags.none),
			new Entity(map.models.grass, new Vector(-320, -1600), new Rect(-320, 320, 640, 640), undefined, entityFlags.none),
			new Entity(map.models.grass, new Vector(320, -1600), new Rect(-320, 320, 640, 640), undefined, entityFlags.none),
			new Entity(map.models.grass, new Vector(960, -1600), new Rect(-320, 320, 640, 640), undefined, entityFlags.none)
		];
		for (var i = 0; i < grass.length; ++i) {
			grass[i].modelState.playAnimation(animId.stand);
		} // for( i )
		var player = new Entity(map.models.player, new Vector(0, 0), new Circle(0, 0, 60), undefined, entityFlags.player);
		player.modelState.playAnimation(animId.stand);
		var walls = [
			new Entity(map.models.innerWallH, new Vector(-196, -1149.5), new Rect(-533, 149.5, 1066, 299), undefined, entityFlags.collidable),
			new Entity(map.models.innerWallV, new Vector(702, 288.5), new Rect(-148, 1232.5, 296, 2465), undefined, entityFlags.collidable),
			new Entity(map.models.outerWallL, new Vector(-1184, 0), new Rect(-60, 1920, 120, 3840), undefined, entityFlags.collidable),
			new Entity(map.models.outerWallT, new Vector(0, 1824), new Rect(-1088, 60, 2176, 120), undefined, entityFlags.collidable),
			new Entity(map.models.outerWallR, new Vector(1184, 0), new Rect(-60, 1920, 120, 3840), undefined, entityFlags.collidable),
			new Entity(map.models.outerWallB, new Vector(0, -1824), new Rect(-1088, 60, 2176, 120), undefined, entityFlags.collidable)
		];
		for (var i = 0; i < walls.length; ++i) {
			walls[i].modelState.playAnimation(animId.stand);
		} // for( i )

		// scene
		var sg = new LinearSG();
		//sg.addEntity(background);
		for (var i = 0; i < grass.length; ++i) {
			sg.addEntity(grass[i]);
		} // for( i )
		for (var i = 0; i < bushes.length; ++i) {
			sg.addEntity(bushes[i]);
		} // for( i )
		for (var i = 0; i < walls.length; ++i) {
			sg.addEntity(walls[i]);
		} // for( i )

		sg.addEntity(player);

		var scene = new Scene(new Camera(canvas, 0, 0, 1920, 1080, 32), sg);

		// init draw timer
		var camera = scene.getCamera();
		var mouse = scene.getMouse();
		var speed = 960;
		var time = Timing.now();
		var sThis = this;
		var renderOneFrame = function() {
			// get/update time variables
			var newTime = Timing.now();
			var dt = (newTime - time) / 1000;
			time = newTime;

			// clear canvas
			scene.blank("#000");

			if (!this.paused) {
				// user keyboard input
				var x = (key.isPressed("a") ? -1 : 0) + (key.isPressed("d") ? 1 : 0);
				var y = (key.isPressed("s") ? -1 : 0) + (key.isPressed("w") ? 1 : 0);
				var direction = new Vector(x, y);
				player.translate(direction.normalize().scale(speed * dt));

				// collision response
				var mtv = sg.getMtv(player.getCollidable(), entityFlags.collidable);
				player.translate(mtv);

				// update camera position
				camera.setPosition(player);

				// update player orientation
				var mousePos = mouse.getPosition();
				if (mousePos !== undefined)
					player.face(mouse.getPosition());
			} // if

			// draw scene
			scene.render();

			// dispatch fps changed event
			sThis.fpsChanged.dispatch(1/dt);
		};

		if (window.requestAnimationFrame !== undefined) {
			var callback = function() {
				renderOneFrame();
				requestAnimationFrame(callback);
			};
			requestAnimationFrame(callback);
		} // if
		else {
			var drawing = false;
			setInterval(function() {
				if (drawing)
					return;

				// set drawing lock
				drawing = true;

				// draw the scene
				renderOneFrame();

				// unset drawing lock
				drawing = false;
			}, 1);
		} // else
	}; // class

	Shooter.prototype.fpsChanged = undefined;
	Shooter.prototype.paused = false;

	return Shooter;
})();
