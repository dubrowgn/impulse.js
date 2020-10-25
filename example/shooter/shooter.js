"use strict";

(function() {

const { Animation, Frame, Image, Model } = require("model2d");
const { Camera, Entity, LinearSg, Scene } = require("scene2d");
const { Circle, Intersect, Matrix, Rect, Vector } = require("shape2d");
const { Collection, EventDelegate, Timing } = require("util");

window.NetAdapter = (function()  {
	// enumerations
	var commandId = {
		localConnect:0,
		localDisconnect:1,
		remoteConnect:2,
		remoteDisconnect:3,
		measurePing:10,
		addEntity:20,
		faceEntity:21,
		removeEntity:22,
		moveEntity:23,
		playerDied:24
	};

	// private methods
	var log = function(msg) {
		var d = new Date();
		console.log("[" +
			("0" + d.getHours()).substr(-2) + ":" +
			("0" + d.getMinutes()).substr(-2) + ":" +
			("0" + d.getSeconds()).substr(-2) + " " +
			("00" + d.getMilliseconds()).substr(-3) + "] " + msg);
	}; // log( )

	var NetAdapter = function(endpointAddress) {
		this._url = endpointAddress;

		// init event delegates
		this.closed = new EventDelegate();
		this.errored = new EventDelegate();
		this.opened = new EventDelegate();
		this.receivedAddEntity = new EventDelegate();
		this.receivedFaceEntity = new EventDelegate();
		this.receivedInvalidMessage = new EventDelegate();
		this.receivedLocalConnect = new EventDelegate();
		this.receivedLocalDisconnect = new EventDelegate();
		this.receivedMoveEntity = new EventDelegate();
		this.receivedMeasurePing = new EventDelegate();
		this.receivedPlayerDied = new EventDelegate();
		this.receivedRemoteConnect = new EventDelegate();
		this.receivedRemoteDisconnect = new EventDelegate();
		this.receivedRemoveEntity = new EventDelegate();

		// init web socket object
		try {
			// cache local reference to 'this'
			var this_ = this;

			// connect web socket
			this._ws = new WebSocket(endpointAddress);
			this._ws.onclose = function() { this_._onClose(); };
			this._ws.onerror = function(e) { this_._onError(e); };
			this._ws.onmessage = function(msg) { this_._onMessage(msg); };
			this._ws.onopen = function() { this_._onOpen(); };

			var send = this._ws.send.bind(this._ws);
			this._ws.send = function(msg) {
				log("--> " + endpointAddress + ": " + msg);
				send(msg);
			};
		} // try
		catch (ex) {
			log("Couldn't open connection to " + endpointAddress + ": " + ex);
		} // catch
	};

	NetAdapter.prototype.closed = undefined;
	NetAdapter.prototype.errored = undefined;
	NetAdapter.prototype.opened = undefined;
	NetAdapter.prototype.receivedAddEntity = undefined;
	NetAdapter.prototype.receivedFaceEntity = undefined;
	NetAdapter.prototype.receivedInvalidMessage = undefined;
	NetAdapter.prototype.receivedLocalConnect = undefined;
	NetAdapter.prototype.receivedLocalDisconnect = undefined;
	NetAdapter.prototype.receivedMoveEntity = undefined;
	NetAdapter.prototype.receivedMeasurePing = undefined;
	NetAdapter.prototype.receivedPlayerDied = undefined;
	NetAdapter.prototype.receivedRemoteConnect = undefined;
	NetAdapter.prototype.receivedRemoteDisconnect = undefined;
	NetAdapter.prototype.receivedRemoveEntity = undefined;
	NetAdapter.prototype._url = undefined;
	NetAdapter.prototype._ws = undefined;

	NetAdapter.prototype.close = function() {
		if (this._ws !== undefined) {
			this._ws.close();
			this._ws = undefined;
		} // if
	}; // close( )

	NetAdapter.prototype._onClose = function() {
		log("Closed connection to " + this._url);
		this.closed.dispatch();
	}; // _onClose( )

	NetAdapter.prototype._onError = function(e) {
		log("WebSocket error occurred: " + this._url);
		console.log(e.data);
		this.errored.dispatch(e.data);
	}; // _onError( )

	NetAdapter.prototype._onMessage = function(msg) {
		log("<-- " + this._url + ": " + msg.data);
		var tokens = msg.data.split(" ");
		var cmd = parseInt(tokens[0]);
		switch(cmd) {
			case commandId.localConnect:
				this.receivedLocalConnect.dispatch(parseInt(tokens[1]));
				break;
			case commandId.localDisconnect:
				this.receivedLocalDisconnect.dispatch();
				break;
			case commandId.remoteConnect:
				this.receivedRemoteConnect.dispatch(parseInt(tokens[1]));
				break;
			case commandId.remoteDisconnect:
				this.receivedRemoteDisconnect.dispatch(parseInt(tokens[1]));
				break;
			case commandId.measurePing:
				this.receivedMeasurePing.dispatch();
				break;
			case commandId.addEntity:
				this.receivedAddEntity.dispatch(parseInt(tokens[1]), parseInt(tokens[2]), parseInt(tokens[3]), parseFloat(tokens[4]), parseFloat(tokens[5]), parseFloat(tokens[6]), parseFloat(tokens[7]));
				break;
			case commandId.faceEntity:
				this.receivedFaceEntity.dispatch(parseInt(tokens[1]), parseFloat(tokens[2]));
				break;
			case commandId.removeEntity:
				this.receivedRemoveEntity.dispatch(parseInt(tokens[1]));
				break;
			case commandId.moveEntity:
				this.receivedMoveEntity.dispatch(parseInt(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3]), parseFloat(tokens[4]), parseFloat(tokens[5]));
				break;
			case commandId.playerDied:
				this.receivedPlayerDied.dispatch(parseInt(tokens[1]), parseInt(tokens[2]));
				break;
			default:
				this.receivedInvalidMessage.dispatch(msg.data);
				break;
		} // switch
	}; // _onMessage( )

	NetAdapter.prototype._onOpen = function() {
		log("Connection established to " + this._url);
		this.opened.dispatch();
	}; // _onOpen( )

	NetAdapter.prototype.sendLocalConnect = function() {
		this._ws.send(commandId.localConnect);
	}; // connect( )

	NetAdapter.prototype.sendLocalDisconnect = function() {
		this._ws.send(commandId.localDisconnect);
	}; // sendLocalDisconnect( )

	NetAdapter.prototype.sendAddEntity = function(cid, eid, etid, x, y, dx, dy) {
		this._ws.send(commandId.addEntity + " " + cid + " " + eid + " " + etid  + " " + x.toFixed(3) + " " + y.toFixed(3) + " " + dx.toFixed(3) + " " + dy.toFixed(3));
	}; // sendAddEntity( )

	NetAdapter.prototype.sendFaceEntity = function(eid, faceRads) {
		this._ws.send(commandId.faceEntity + " " + eid + " " + faceRads.toFixed(3));
	}; // sendFaceEntity( )

	NetAdapter.prototype.sendRemoveEntity = function(eid) {
		this._ws.send(commandId.removeEntity + " " + eid);
	}; // sendRemoveEntity( )

	NetAdapter.prototype.sendMoveEntity = function(eid, x, y, dx, dy) {
		this._ws.send(commandId.moveEntity + " " + eid + " " + x.toFixed(3) + " " + y.toFixed(3) + " " + dx.toFixed(3) + " " + dy.toFixed(3));
	}; // sendMoveEntity( )

	NetAdapter.prototype.sendMeasurePing = function() {
		this._ws.send(commandId.measurePing);
	}; // sendMeasurePing( )

	NetAdapter.prototype.sendPlayerDied = function(cidDied, cidKilled) {
		this._ws.send(commandId.playerDied + " " + cidDied + " " + cidKilled);
	}; // sendPlayerDied( )

	return NetAdapter;
})();

window.Shooter = (function() {
	// enumerations
	var entityFlag = {
		none:0,
		player:1,
		collidable:2,
		projectile:4,
		wall:8
	};
	var entityType = {
		player:1,
		projectile:2
	};

	// private functions
	var rand = function(min, max) {
		if (min === undefined)
			return Math.random();
		return min + Math.random() * (max - min);
	}; // rand( )

	var Shooter = function(canvas) {
		this.connected = new EventDelegate();
		this.deathsChanged = new EventDelegate();
		this.fpsChanged = new EventDelegate();
		this.healthChanged = new EventDelegate();
		this.killsChanged = new EventDelegate();
		this.pingChanged = new EventDelegate();

		// map
		this._map = this.loadMap();

		// scene
		var sg = new LinearSg();
		for (var i = 0; i < this._map.entities.grass.length; ++i) {
			sg.addEntity(this._map.entities.grass[i]);
		} // for( i )
		sg.addEntity(this._map.entities.dirt);
		for (var i = 0; i < this._map.entities.bushes.length; ++i) {
			sg.addEntity(this._map.entities.bushes[i]);
		} // for( i )
		for (var i = 0; i < this._map.entities.walls.length; ++i) {
			sg.addEntity(this._map.entities.walls[i]);
		} // for( i )

		this._scene = new Scene(new Camera(canvas, 0, 0, 1920, 1080, 32), sg);
		this._camera = this._scene.getCamera();
		this._mouse = this._scene.getMouse();
		this._sceneGraph = this._scene.getSceneGraph();
	}; // class

	Shooter.prototype.connected = undefined;
	Shooter.prototype.deathsChanged = undefined;
	Shooter.prototype.fpsChanged = undefined;
	Shooter.prototype.healthChanged = undefined;
	Shooter.prototype.killsChanged = undefined;
	Shooter.prototype.pingChanged = undefined;
	Shooter.prototype._camera = undefined;
	Shooter.prototype._clientId = -1;
	Shooter.prototype._deaths = 0;
	Shooter.prototype._eid = 1;
	Shooter.prototype._health = 100;
	Shooter.prototype._kills = 0;
	Shooter.prototype._inGameLoop = false;
	Shooter.prototype._lastDrawTime = 0;
	Shooter.prototype._lastGameTime = 0;
	Shooter.prototype._map = undefined;
	Shooter.prototype._mouse = undefined;
	Shooter.prototype._netAdapter = undefined;
	Shooter.prototype._paused = false;
	Shooter.prototype._player = undefined;
	Shooter.prototype._scene = undefined;
	Shooter.prototype._sceneGraph = undefined;

	Shooter.prototype._createPlayer = function(clientId, eid, x, y, dx, dy) {
		var models = [
			this._map.models.playerBlue,
			this._map.models.playerBrown,
			this._map.models.playerGreen,
			this._map.models.playerPurple
		];

		var player = new Entity(models[clientId % 4], new Vector(x, y), new Circle(0, 0, 70), undefined, entityFlag.player | entityFlag.collidable);
		player.modelState.playAnimation("stand");
		player.eid = eid;
		player.dx = dx;
		player.dy = dy;
		this._sceneGraph.addEntity(player);

		return player;
	}; // _initPlayer( )

	Shooter.prototype._createProjectile = function(cid, eid, x, y, dx, dy) {
		var models = [
			this._map.models.shotBlue,
			this._map.models.shotRed,
			this._map.models.shotGreen,
			this._map.models.shotPurple
		];

		var shot = new Entity(models[cid % 4], new Vector(x, y), new Circle(0, 0, 25), undefined, entityFlag.projectile);
		shot.modelState.playAnimation("stand");
		shot.cid = cid;
		shot.eid = eid;
		shot.dx = dx;
		shot.dy = dy;
		shot.bounce = 0;
		this._sceneGraph.addEntity(shot);

		return shot;
	}; // _createProjectile( )

	Shooter.prototype.connect = function() {
		var pingStarted = 0;
		var pingInterval;
		var this_ = this;

		var getEntityById = function(id, flags) {
			var ents = this_._sceneGraph.query(flags);
			for (var i = 0; i < ents.length; ++i) {
				if (ents[i].eid == id)
					return ents[i];
			} // for( i )

			return undefined;
		}; // getEntityById( )

		this._netAdapter = new NetAdapter('wss://impulsejs.com/shooter/server');

		this._netAdapter.closed.add(function() {
			if (pingInterval !== undefined)
				clearInterval(pingInterval);
		});

		this._netAdapter.opened.add(function() {
			this_._netAdapter.sendLocalConnect();
			pingInterval = setInterval(function() {
				pingStarted = Timing.now();
				this_._netAdapter.sendMeasurePing();
			}, 1500);
		});

		this._netAdapter.receivedAddEntity.add(function(cid, eid, etid, x, y, dx, dy) {
			switch (etid) {
				case entityType.player:
					this_._createPlayer(cid, eid, x, y, dx, dy);
					break;
				case entityType.projectile:
					this_._createProjectile(cid, eid, x, y, dx, dy);
					break;
				default:
					console.log("received invalid entity type id " + etid);
					break;
			} // switch
		});

		this._netAdapter.receivedFaceEntity.add(function(eid, faceRads) {
			var ent = getEntityById(eid);
			ent.setRotation(faceRads);
		});

		this._netAdapter.receivedInvalidMessage.add(function(data) {
			console.log("Received invalid message from server: " + data);
		});

		this._netAdapter.receivedLocalConnect.add(function(clientId) {
			this_._clientId = clientId;

			var eid = clientId * 100000;
			var x = rand(-1184, 1184);
			var y = rand(-1824, 1824);

			this_._player = this_._createPlayer(clientId, eid, x, y, 0, 0);
			this_._netAdapter.sendAddEntity(clientId, eid, entityType.player, x, y, 0, 0);

			this_.connected.dispatch(this_);
		});

		this._netAdapter.receivedMeasurePing.add(function() {
			this_.pingChanged.dispatch(Timing.now() - pingStarted);
		});

		this._netAdapter.receivedMoveEntity.add(function(eid, x, y, dx, dy) {
			var ent = getEntityById(eid);
			ent.setPosition(x, y);
			ent.dx = dx;
			ent.dy = dy;
		});

		this._netAdapter.receivedPlayerDied.add(function(cidDied, cidKilled) {
			if (cidKilled == this_._clientId) {
				this_._kills++;
				this_.killsChanged.dispatch(this_._kills);
			} // if
		});

		this._netAdapter.receivedRemoteConnect.add(function(clientId) {
		});

		this._netAdapter.receivedRemoteDisconnect.add(function(clientId) {
		});

		this._netAdapter.receivedRemoveEntity.add(function(eid) {
			var ent = getEntityById(eid);
			this_._sceneGraph.removeEntity(ent);
		});

		window.addEventListener("beforeunload", function(e) { this_._netAdapter.close(); });
	}; // _connect( )

	Shooter.prototype._draw = function() {
		// calculate time differential
		var time = Timing.now();
		var dtMs = time - this._lastDrawTime;
		this._lastDrawTime = time;

		// draw scene
		this._scene.blank("#000");
		this._scene.advance(dtMs);

		// dispatch fps changed event
		this.fpsChanged.dispatch(1000/dtMs);
	}; // _draw( )

	Shooter.prototype._fire = function() {
		var eid = this._clientId * 100000 + (this._eid++);
		var p = this._player;
		var dir = new Vector(1, 0).rotate(p.getRotation());
		var pos = dir.clone().scale(70).add(p.getPosition());

		var shot = this._createProjectile(this._clientId, eid, pos.x, pos.y, dir.x, dir.y);
		this._netAdapter.sendAddEntity(this._clientId, eid, entityType.projectile, pos.x, pos.y, dir.x, dir.y);

		new Audio("assets/audio/laser.ogg").play();
	}; // _fire( )

	Shooter.prototype._gameLoop = function() {
		// enforce loop lock
		if (this._inGameLoop)
			return;

		// set loop lock (should be ok, assuming single threaded event loop)
		this._inGameLoop = true;

		// calculate time differential
		var time = Timing.now();
		var dt = (time - this._lastGameTime) / 1000;
		this._lastGameTime = time;

		if (!this._paused) {
			// handle players
			var players = this._sceneGraph.query(entityFlag.player);
			for (var i = 0; i < players.length; ++i) {
				// move play entities
				var direction = new Vector(players[i].dx, players[i].dy);
				players[i].translate(direction.normalize().scale(900 * dt));

				// collision detection and response
				players[i].translate(this._sceneGraph.getMtv(players[i], entityFlag.collidable));
			} // for( i )

			// handle shots
			var shots = this._sceneGraph.query(entityFlag.projectile);
			for (var i = 0; i < shots.length; ++i) {
				// move play entities
				var direction = new Vector(shots[i].dx, shots[i].dy);
				shots[i].translate(direction.normalize().scale(1400 * dt));

				// collision detection and response
				if (shots[i].cid !== this._clientId) {
					if (Intersect.shapeVsShape(shots[i].getCollidable().getCenter(), this._player.getCollidable())) {
						this._health -= 7;
						if (this._health < 0)
							this._health = 0;

						this._sceneGraph.removeEntity(shots[i]);
						this._netAdapter.sendRemoveEntity(shots[i].eid);

						// respawn?
						if (this._health == 0) {
							this._health = 100;
							var p = this._player;
							var x = rand(-1184, 1184);
							var y = rand(-1824, 1824);
							p.setPosition(x, y);

							// increment death counter
							this._deaths++;
							this.deathsChanged.dispatch(this._deaths);

							// send network update commands
							this._netAdapter.sendMoveEntity(p.eid, x, y, p.dx, p.dy);
							this._netAdapter.sendPlayerDied(this._clientId, shots[i].cid);
						} // if

						this.healthChanged.dispatch(this._health, 100);

						continue;
					} // if
				} // if

				// collision detection and response
				var intersects = this._sceneGraph.queryCenterIn(shots[i], entityFlag.wall);
				if (intersects.length !== 0) {
					if (shots[i].bounce == 3) {
						this._sceneGraph.removeEntity(shots[i]);
						if (shots[i].cid == this._clientId)
							this._netAdapter.sendRemoveEntity(shots[i].eid);
					} // if
					else {
						// increment bounce counter
						shots[i].bounce++;

						// calculate MTV, and translate shot out of collision
						var mtv = this._sceneGraph.getMtv(shots[i], entityFlag.wall);
						shots[i].translate(mtv);

						// split direction into perpendicular and parallel vectors for bounce response
						var bounce = direction.clone().projectOnto(mtv);
						var slide = direction.clone().projectOnto(mtv.clone().perpendicular());

						var dir = bounce.negate().add(slide).normalize();
						shots[i].dx = dir.x;
						shots[i].dy = dir.y;

						if (shots[i].cid == this._clientId) {
							var pos = shots[i].getPosition();
							this._netAdapter.sendMoveEntity(shots[i].eid, pos.x, pos.y, dir.x, dir.y);
						} // if
					} // else
				} // if
			} // for( i )

			// update camera position
			this._camera.setPosition(this._player);

			// update player orientation
			this._player.face(this._mouse.getPosition());
		} // if

		// release loop lock
		this._inGameLoop = false;
	}; // _gameLoop( )

	Shooter.prototype.loadMap = function() {
		var map = {};

		// models
		let models = {
			bush: new Model(
				"bush",
				{ stand: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]) },
				{ main: new Image(1, new Matrix().translate(-128, -128), "assets/image/bush.png", 256, 256) },
				{},
			),
			dirt: new Model(
				"dirt",
				{ stand: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]) },
				{ main: new Image(1, new Matrix().translate(-320, -320), "assets/image/dirt_splat.png", 640, 640) },
				{},
			),
			grass: new Model(
				"grass",
				{ stand: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]) },
				{ main: new Image(1, new Matrix().translate(-320, -320), "assets/image/grass.jpg", 640, 640) },
				{},
			),
			innerWallH: new Model(
				"innerWallH",
				{ stand: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]) },
				{ main: new Image(1, new Matrix().translate(-533, -149.5), "assets/image/inner_wall_h.png", 1066, 299) },
				{},
			),
			innerWallV: new Model(
				"innerWallV",
				{ stand: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]) },
				{ main: new Image(1, new Matrix().translate(-148, -1232.5), "assets/image/inner_wall_v.png", 296, 2465) },
				{},
			),
			playerBrown: new Model(
				"playerBrown",
				{
					stand: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]),
					walk: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]),
					shoot: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]),
				},
				{ main: new Image(1, new Matrix().translate(-600, -600).scale(1 / 6), "assets/image/player_brown.png", 1200, 1200) },
				{},
			),
			playerBlue: new Model(
				"playerBlue",
				{
					stand: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]),
					walk: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]),
					shoot: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]),
				},
				{ main: new Image(1, new Matrix().translate(-600, -600).scale(1 / 6), "assets/image/player_blue.png", 1200, 1200) },
				{},
			),
			playerGreen: new Model(
				"playerGreen",
				{
					stand: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]),
					walk: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]),
					shoot: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]),
				},
				{ main: new Image(1, new Matrix().translate(-600, -600).scale(1 / 6), "assets/image/player_green.png", 1200, 1200) },
				{},
			),
			playerPurple: new Model(
				"playerPurple",
				{
					stand: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]),
					walk: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]),
					shoot: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]),
				},
				{ main: new Image(1, new Matrix().translate(-600, -600).scale(1 / 6), "assets/image/player_purple.png", 1200, 1200) },
				{},
			),
			outerWallL: new Model(
				"outerWallL",
				{ stand: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]) },
				{ main: new Image(1, new Matrix().translate(-96, -1920), "assets/image/outer_wall_l.png", 192, 3840) },
				{},
			),
			outerWallT: new Model(
				"outerWallT",
				{ stand: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]) },
				{ main: new Image(1, new Matrix().translate(-1088, -96), "assets/image/outer_wall_t.png", 2176, 192) },
				{},
			),
			outerWallR: new Model(
				"outerWallR",
				{ stand: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]) },
				{ main: new Image(1, new Matrix().translate(-96, -1920), "assets/image/outer_wall_r.png", 192, 3840) },
				{},
			),
			outerWallB: new Model(
				"outerWallB",
				{ stand: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]) },
				{ main: new Image(1, new Matrix().translate(-1088, -96), "assets/image/outer_wall_b.png", 2176, 192) },
				{},
			),
			shotBlue: new Model(
				"shotBlue",
				{ stand: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]) },
				{ main: new Image(1, new Matrix().translate(-320, -320).scale(.20), "assets/image/shot_blue.png", 640, 640) },
				{},
			),
			shotGreen: new Model(
				"shotGreen",
				{ stand: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]) },
				{ main: new Image(1, new Matrix().translate(-320, -320).scale(.20), "assets/image/shot_green.png", 640, 640) },
				{},
			),
			shotPurple: new Model(
				"shotPurple",
				{ stand: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]) },
				{ main: new Image(1, new Matrix().translate(-320, -320).scale(.20), "assets/image/shot_purple.png", 640, 640) },
				{},
			),
			shotRed: new Model(
				"shotRed",
				{ stand: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]) },
				{ main: new Image(1, new Matrix().translate(-320, -320).scale(.20), "assets/image/shot_red.png", 640, 640) },
				{},
			),
		};

		map.models = models;
		console.log(JSON.stringify(models, null, "\t"))

		// entities
		var entities = {};
		entities.bushes = [
			new Entity(map.models.bush, new Vector(-128, 1228), new Circle(0, 0, 128), undefined, entityFlag.collidable | entityFlag.wall),
			new Entity(map.models.bush, new Vector(128, 1100), new Circle(0, 0, 128), undefined, entityFlag.collidable | entityFlag.wall),
			new Entity(map.models.bush, new Vector(-512, 64), new Circle(0, 0, 128), undefined, entityFlag.collidable | entityFlag.wall),
			new Entity(map.models.bush, new Vector(256, -564), new Circle(0, 0, 128), undefined, entityFlag.collidable | entityFlag.wall),
			new Entity(map.models.bush, new Vector(128, -692), new Circle(0, 0, 128), undefined, entityFlag.collidable | entityFlag.wall),
			new Entity(map.models.bush, new Vector(832, -1460), new Circle(0, 0, 128), undefined, entityFlag.collidable | entityFlag.wall)
		];
		for (var i = 0; i < entities.bushes.length; ++i) {
			entities.bushes[i].modelState.playAnimation("stand");
		} // for( i )
		entities.grass = [
			new Entity(map.models.grass, new Vector(-960, 1600), new Rect(-320, 320, 640, 640), undefined, entityFlag.none),
			new Entity(map.models.grass, new Vector(-320, 1600), new Rect(-320, 320, 640, 640), undefined, entityFlag.none),
			new Entity(map.models.grass, new Vector(320, 1600), new Rect(-320, 320, 640, 640), undefined, entityFlag.none),
			new Entity(map.models.grass, new Vector(960, 1600), new Rect(-320, 320, 640, 640), undefined, entityFlag.none),

			new Entity(map.models.grass, new Vector(-960, 960), new Rect(-320, 320, 640, 640), undefined, entityFlag.none),
			new Entity(map.models.grass, new Vector(-320, 960), new Rect(-320, 320, 640, 640), undefined, entityFlag.none),
			new Entity(map.models.grass, new Vector(320, 960), new Rect(-320, 320, 640, 640), undefined, entityFlag.none),
			new Entity(map.models.grass, new Vector(960, 960), new Rect(-320, 320, 640, 640), undefined, entityFlag.none),

			new Entity(map.models.grass, new Vector(-960, 320), new Rect(-320, 320, 640, 640), undefined, entityFlag.none),
			new Entity(map.models.grass, new Vector(-320, 320), new Rect(-320, 320, 640, 640), undefined, entityFlag.none),
			new Entity(map.models.grass, new Vector(320, 320), new Rect(-320, 320, 640, 640), undefined, entityFlag.none),
			new Entity(map.models.grass, new Vector(960, 320), new Rect(-320, 320, 640, 640), undefined, entityFlag.none),

			new Entity(map.models.grass, new Vector(-960, -320), new Rect(-320, 320, 640, 640), undefined, entityFlag.none),
			new Entity(map.models.grass, new Vector(-320, -320), new Rect(-320, 320, 640, 640), undefined, entityFlag.none),
			new Entity(map.models.grass, new Vector(320, -320), new Rect(-320, 320, 640, 640), undefined, entityFlag.none),
			new Entity(map.models.grass, new Vector(960, -320), new Rect(-320, 320, 640, 640), undefined, entityFlag.none),

			new Entity(map.models.grass, new Vector(-960, -960), new Rect(-320, 320, 640, 640), undefined, entityFlag.none),
			new Entity(map.models.grass, new Vector(-320, -960), new Rect(-320, 320, 640, 640), undefined, entityFlag.none),
			new Entity(map.models.grass, new Vector(320, -960), new Rect(-320, 320, 640, 640), undefined, entityFlag.none),
			new Entity(map.models.grass, new Vector(960, -960), new Rect(-320, 320, 640, 640), undefined, entityFlag.none),

			new Entity(map.models.grass, new Vector(-960, -1600), new Rect(-320, 320, 640, 640), undefined, entityFlag.none),
			new Entity(map.models.grass, new Vector(-320, -1600), new Rect(-320, 320, 640, 640), undefined, entityFlag.none),
			new Entity(map.models.grass, new Vector(320, -1600), new Rect(-320, 320, 640, 640), undefined, entityFlag.none),
			new Entity(map.models.grass, new Vector(960, -1600), new Rect(-320, 320, 640, 640), undefined, entityFlag.none)
		];
		for (var i = 0; i < entities.grass.length; ++i) {
			entities.grass[i].modelState.playAnimation("stand");
		} // for( i )
		entities.dirt = new Entity(map.models.dirt, new Vector(-260, 240), new Rect(-320, 320, 640, 640), undefined, entityFlag.none);
		entities.dirt.modelState.playAnimation("stand");
		entities.walls = [
			new Entity(map.models.innerWallH, new Vector(-196, -1149.5), new Rect(-533, 149.5, 1066, 299), undefined, entityFlag.collidable | entityFlag.wall),
			new Entity(map.models.innerWallV, new Vector(702, 288.5), new Rect(-148, 1232.5, 296, 2465), undefined, entityFlag.collidable | entityFlag.wall),
			new Entity(map.models.outerWallL, new Vector(-1184, 0), new Rect(-60, 1920, 120, 3840), undefined, entityFlag.collidable | entityFlag.wall),
			new Entity(map.models.outerWallT, new Vector(0, 1824), new Rect(-1148, 60, 2296, 120), undefined, entityFlag.collidable | entityFlag.wall),
			new Entity(map.models.outerWallR, new Vector(1184, 0), new Rect(-60, 1920, 120, 3840), undefined, entityFlag.collidable | entityFlag.wall),
			new Entity(map.models.outerWallB, new Vector(0, -1824), new Rect(-1148, 60, 2296, 120), undefined, entityFlag.collidable | entityFlag.wall)
		];
		for (var i = 0; i < entities.walls.length; ++i) {
			entities.walls[i].modelState.playAnimation("stand");
		} // for( i )

		map.entities = entities;

		// return completed map object
		return map;
	}; // loadMap( )

	Shooter.prototype.run = function() {
		var _this = this;

		// init keyboard bindings
		var keyChanged = function() {
			var p = _this._player;

			if (p !== undefined) {
				p.dx = (key.isPressed("a") ? -1 : 0) + (key.isPressed("d") ? 1 : 0);
				p.dy = (key.isPressed("s") ? -1 : 0) + (key.isPressed("w") ? 1 : 0);

				var pos = p.getPosition();
				_this._netAdapter.sendMoveEntity(p.eid, pos.x, pos.y, p.dx, p.dy);
			} // if
		}; // keyChanged( )

		var keyCodes = new Collection(65, 68, 83, 87);
		var pressed = new Collection();

		document.addEventListener("keydown", function(e) {
			if (keyCodes.contains(e.keyCode) && !pressed.contains(e.keyCode)) {
				pressed.add(e.keyCode);
				keyChanged();
			} // if
		});
		document.addEventListener("keyup", function(e) {
			if (keyCodes.contains(e.keyCode) && pressed.contains(e.keyCode)) {
				pressed.remove(e.keyCode);
				keyChanged();
			} // if
		});

		// init limited key bindings
		setInterval(function() {
			if (_this._mouse.getButtons().left)
				_this._fire();
		}, 1000 / 10);

		// init mouse bindings
		var face = 0;
		setInterval(function() {
			if (_this._player !== undefined) {
				var faceTmp = _this._player.getRotation();
				// only push update if thousands of a degree changed
				if (((faceTmp * 100) | 0) != ((face * 100) | 0)) {
					_this._netAdapter.sendFaceEntity(_this._player.eid, _this._player.getRotation())
					face = faceTmp;
				} // if
			} // if
		}, 1000 / 30);

		// init regen timer (1hp/s)
		setInterval(function() {
			if (_this._health < 100) {
				_this._health += .04;
				_this.healthChanged.dispatch(_this._health, 100);
			} // if
		}, 40);

		// init game loop
		this._lastGameTime = Timing.now();
		setInterval(function() { _this._gameLoop(); }, 10);

		// init draw loop
		this._lastDrawTime = Timing.now();
		if (window.requestAnimationFrame !== undefined) {
			var callback = function() {
				_this._draw();
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
				_this._draw();

				// unset drawing lock
				drawing = false;
			}, 1000/59);
		} // else
	}; // run( )

	return Shooter;
})();

})();
