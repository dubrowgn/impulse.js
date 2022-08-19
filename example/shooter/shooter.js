"use strict";

(function() {

const { Animation, Frame, Image, Model } = require("model2d");
const { Camera, Entity, LinearSg, SceneTopDown } = require("scene2d");
const { Circle, Intersect, Matrix, Rect, Vector } = require("shape2d");
const { Event, Timing } = require("util");

const serverEndpoint = "ws://localhost:1400"
//const serverEndpoint = "wss://impulsejs.com/shooter/server"

const cmdId = {
	localConnect: 0,
	localDisconnect: 1,
	remoteConnect: 2,
	remoteDisconnect: 3,
	measurePing: 10,
	addEntity: 20,
	faceEntity: 21,
	removeEntity: 22,
	moveEntity: 23,
	playerDied: 24,
};

function log(msg) {
	let d = new Date();

	let hh = d.getHours().toString().padStart(2, "0");
	let mm = d.getMinutes().toString().padStart(2, "0");
	let ss = d.getSeconds().toString().padStart(2, "0");
	let fff = d.getMilliseconds().toString().padStart(3, "0");

	console.log(`[${hh}:${mm}:${ss}.${fff}] ${msg}`);
};

class NetAdapter {
	closed = new Event();
	errored = new Event();
	opened = new Event();
	receivedAddEntity = new Event();
	receivedFaceEntity = new Event();
	receivedInvalidMessage = new Event();
	receivedLocalConnect = new Event();
	receivedLocalDisconnect = new Event();
	receivedMoveEntity = new Event();
	receivedMeasurePing = new Event();
	receivedPlayerDied = new Event();
	receivedRemoteConnect = new Event();
	receivedRemoteDisconnect = new Event();
	receivedRemoveEntity = new Event();
	#url;
	#ws;

	constructor(endpoint) {
		this.#url = endpoint;

		// init web socket object
		try {
			log(`Connecting to ${endpoint}...`);
			this.#ws = new WebSocket(endpoint);
			this.#ws.onclose = () => this.#onClose();
			this.#ws.onerror = e => this.#onError(e);
			this.#ws.onmessage = msg => this.#onMessage(msg);
			this.#ws.onopen = () => this.#onOpen();

			let send = this.#ws.send.bind(this.#ws);
			this.#ws.send = msg => {
				log("--> " + endpoint + ": " + msg);
				send(msg);
			};
		} catch (ex) {
			log(`Couldn't connect to ${endpoint}: ${ex}`);
		}
	}

	close() {
		if (this.#ws === undefined)
			return;

		this.#ws.close();
		this.#ws = undefined;
	}

	#onClose() {
		log(`Closed connection to ${this.#url}`);
		this.closed.dispatch();
	}

	#onError(e) {
		log(`WebSocket error occurred: ${this.#url}`);
		console.log(e.data);
		this.errored.dispatch(e.data);
	}

	#onMessage(msg) {
		log(`<-- ${this.#url}: ${msg.data}`);
		let tokens = msg.data.split(" ");
		let cmd = parseInt(tokens[0]);
		switch(cmd) {
			case cmdId.localConnect:
				this.receivedLocalConnect.dispatch(parseInt(tokens[1]));
				break;
			case cmdId.localDisconnect:
				this.receivedLocalDisconnect.dispatch();
				break;
			case cmdId.remoteConnect:
				this.receivedRemoteConnect.dispatch(parseInt(tokens[1]));
				break;
			case cmdId.remoteDisconnect:
				this.receivedRemoteDisconnect.dispatch(parseInt(tokens[1]));
				break;
			case cmdId.measurePing:
				this.receivedMeasurePing.dispatch();
				break;
			case cmdId.addEntity:
				this.receivedAddEntity.dispatch(parseInt(tokens[1]), parseInt(tokens[2]), parseInt(tokens[3]), parseFloat(tokens[4]), parseFloat(tokens[5]), parseFloat(tokens[6]), parseFloat(tokens[7]));
				break;
			case cmdId.faceEntity:
				this.receivedFaceEntity.dispatch(parseInt(tokens[1]), parseFloat(tokens[2]));
				break;
			case cmdId.removeEntity:
				this.receivedRemoveEntity.dispatch(parseInt(tokens[1]));
				break;
			case cmdId.moveEntity:
				this.receivedMoveEntity.dispatch(parseInt(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3]), parseFloat(tokens[4]), parseFloat(tokens[5]));
				break;
			case cmdId.playerDied:
				this.receivedPlayerDied.dispatch(parseInt(tokens[1]), parseInt(tokens[2]));
				break;
			default:
				this.receivedInvalidMessage.dispatch(msg.data);
				break;
		}
	}

	#onOpen() {
		log(`Connected to ${this.#url}`);
		this.opened.dispatch();
	}

	sendLocalConnect() {
		this.#ws.send(cmdId.localConnect);
	}

	sendLocalDisconnect() {
		this.#ws.send(cmdId.localDisconnect);
	}

	sendAddEntity(cid, eid, etid, x, y, dx, dy) {
		this.#ws.send(`${cmdId.addEntity} ${cid} ${eid} ${etid} ${x.toFixed(3)} ${y.toFixed(3)} ${dx.toFixed(3)} ${dy.toFixed(3)}`);
	}

	sendFaceEntity(eid, faceRads) {
		this.#ws.send(`${cmdId.faceEntity} ${eid} ${faceRads.toFixed(3)}`);
	}

	sendRemoveEntity(eid) {
		this.#ws.send(`${cmdId.removeEntity} ${eid}`);
	}

	sendMoveEntity(eid, x, y, dx, dy) {
		this.#ws.send(`${cmdId.moveEntity} ${eid} ${x.toFixed(3)} ${y.toFixed(3)} ${dx.toFixed(3)} ${dy.toFixed(3)}`);
	}

	sendMeasurePing() {
		this.#ws.send(cmdId.measurePing);
	}

	sendPlayerDied(cidDied, cidKilled) {
		this.#ws.send(`${cmdId.playerDied} ${cidDied} ${cidKilled}`);
	}
}

class Metric {
	#count = 0;
	#max = Number.NEGATIVE_INFINITY;
	#min = Number.POSITIVE_INFINITY;
	#total = 0;

	get avg() { return this.#total / this.#count; }
	get count() { return this.#count; }
	get max() { return this.#max; }
	get min() { return this.#min; }
	get total() { return this.#total; }

	reset() {
		this.#count = 0;
		this.#max = Number.NEGATIVE_INFINITY;
		this.#min = Number.POSITIVE_INFINITY;
		this.#total = 0;
	}

	sample(val) {
		this.#min = Math.min(this.#min, val);
		this.#max = Math.max(this.#max, val);
		this.#total += val;
		this.#count++;
	}
}

const entityFlag = {
	none: 0,
	player: 1,
	collidable: 2,
	projectile: 4,
	wall: 8,
};

const entityType = {
	player: 1,
	projectile: 2,
};

function rand(min = 0, max = 1) {
	return min + Math.random() * (max - min);
}

class Shooter {
	#camera;
	#clientId = -1;
	connected = new Event();
	#deaths = 0;
	deathsChanged = new Event();
	#eid = 1;
	fpsChanged = new Event();
	#fpsMetric = new Metric();
	#health = 100;
	healthChanged = new Event();
	#kills = 0;
	killsChanged = new Event();
	#lastDrawTime = 0;
	#lastGameTime = 0;
	#map;
	#mouse;
	#netAdapter;
	#paused = false;
	pingChanged = new Event();
	#player;
	#scene;
	#sceneGraph;

	constructor(canvas) {
		// map
		this.#map = this.#loadMap();

		// scene
		let sg = new LinearSg();
		for (let grass of this.#map.entities.grass) {
			sg.addEntity(grass);
		}
		sg.addEntity(this.#map.entities.dirt);
		for (let bush of this.#map.entities.bushes) {
			sg.addEntity(bush);
		}
		for (let wall of this.#map.entities.walls) {
			sg.addEntity(wall);
		}

		this.#scene = new SceneTopDown(new Camera(canvas, 0, 0, 1920, 1080, 32), sg);
		this.#camera = this.#scene.getCamera();
		this.#mouse = this.#scene.getMouse();
		this.#sceneGraph = this.#scene.getSceneGraph();
	};

	_createPlayer(clientId, eid, x, y, dx, dy) {
		let models = [
			this.#map.models.playerBlue,
			this.#map.models.playerBrown,
			this.#map.models.playerGreen,
			this.#map.models.playerPurple
		];

		let player = new Entity(models[clientId % 4], new Vector(x, y), new Circle(0, 0, 70), undefined, entityFlag.player | entityFlag.collidable);
		player.modelState.playAnimation("stand");
		player.eid = eid;
		player.dx = dx;
		player.dy = dy;
		this.#sceneGraph.addEntity(player);

		return player;
	}

	_createProjectile(cid, eid, x, y, dx, dy) {
		let models = [
			this.#map.models.shotBlue,
			this.#map.models.shotRed,
			this.#map.models.shotGreen,
			this.#map.models.shotPurple
		];

		let shot = new Entity(models[cid % 4], new Vector(x, y), new Circle(0, 0, 25), undefined, entityFlag.projectile);
		shot.modelState.playAnimation("stand");
		shot.cid = cid;
		shot.eid = eid;
		shot.dx = dx;
		shot.dy = dy;
		shot.bounce = 0;
		this.#sceneGraph.addEntity(shot);

		return shot;
	}

	connect() {
		let pingStarted = 0;
		let pingInterval;

		let getEntityById = (id, flags) => {
			for (let ent of this.#sceneGraph.query(flags)) {
				if (ent.eid == id)
					return ent;
			}

			return undefined;
		};

		this.#netAdapter = new NetAdapter(serverEndpoint);

		this.#netAdapter.closed.register(() => {
			if (pingInterval !== undefined)
				clearInterval(pingInterval);
		});

		this.#netAdapter.opened.register(() => {
			this.#netAdapter.sendLocalConnect();
			pingInterval = setInterval(() => {
				pingStarted = Timing.now();
				this.#netAdapter.sendMeasurePing();
			}, 1500);
		});

		this.#netAdapter.receivedAddEntity.register((cid, eid, etid, x, y, dx, dy) => {
			switch (etid) {
				case entityType.player:
					this._createPlayer(cid, eid, x, y, dx, dy);
					break;
				case entityType.projectile:
					this._createProjectile(cid, eid, x, y, dx, dy);
					break;
				default:
					console.log("received invalid entity type id " + etid);
					break;
			}
		});

		this.#netAdapter.receivedFaceEntity.register((eid, faceRads) => {
			getEntityById(eid)
				.setRotation(faceRads);
		});

		this.#netAdapter.receivedInvalidMessage.register(data => {
			console.log(`Received invalid message from server: ${data}`);
		});

		this.#netAdapter.receivedLocalConnect.register(clientId => {
			this.#clientId = clientId;

			let eid = clientId * 100000;
			let x = rand(-1184, 1184);
			let y = rand(-1824, 1824);

			this.#player = this._createPlayer(clientId, eid, x, y, 0, 0);
			this.#netAdapter.sendAddEntity(clientId, eid, entityType.player, x, y, 0, 0);

			this.connected.dispatch(this);
		});

		this.#netAdapter.receivedMeasurePing.register(() => {
			this.pingChanged.dispatch(Timing.now() - pingStarted);
		});

		this.#netAdapter.receivedMoveEntity.register((eid, x, y, dx, dy) => {
			let ent = getEntityById(eid);
			if (ent === undefined) {
				console.warn(`Entity id ${eid} already removed`);
				return;
			}

			ent.setPosition(x, y);
			ent.dx = dx;
			ent.dy = dy;
		});

		this.#netAdapter.receivedPlayerDied.register((cidDied, cidKilled) => {
			if (cidKilled !== this.#clientId)
				return;

			this.#kills++;
			this.killsChanged.dispatch(this.#kills);
		});

		this.#netAdapter.receivedRemoteConnect.register(clientId => { });

		this.#netAdapter.receivedRemoteDisconnect.register(clientId => { });

		this.#netAdapter.receivedRemoveEntity.register(eid => {
			this.#sceneGraph.removeEntity(getEntityById(eid));
		});

		window.addEventListener("beforeunload", e => this.#netAdapter.close());
	}

	_draw() {
		// calculate time differential
		let time = Timing.now();
		let dtMs = time - this.#lastDrawTime;
		this.#lastDrawTime = time;

		// draw scene
		this.#scene.blank("#000");
		this.#scene.advance(dtMs);

		// update fps metrics
		this.#fpsMetric.sample(1000 / dtMs);
	}

	_fire() {
		let eid = this.#clientId * 100000 + (this.#eid++);
		let p = this.#player;
		let dir = new Vector(1, 0).rotate(p.getRotation());
		let pos = dir.clone().scale(70).add(p.getPosition());

		this._createProjectile(this.#clientId, eid, pos.x, pos.y, dir.x, dir.y);
		this.#netAdapter.sendAddEntity(this.#clientId, eid, entityType.projectile, pos.x, pos.y, dir.x, dir.y);

		new Audio("assets/audio/laser.ogg").play();
	}

	_gameLoop() {
		// calculate time differential
		let time = Timing.now();
		let dt = (time - this.#lastGameTime) / 1000;
		this.#lastGameTime = time;

		if (this.#paused)
			return;

		// handle players
		for (let player of this.#sceneGraph.query(entityFlag.player)) {
			// move play entities
			let direction = new Vector(player.dx, player.dy);
			player.translate(direction.normalize().scale(900 * dt));

			// collision detection and response
			player.translate(this.#sceneGraph.getMtv(player, entityFlag.collidable));
		}

		// handle shots
		for (let shot of this.#sceneGraph.query(entityFlag.projectile)) {
			// move play entities
			let direction = new Vector(shot.dx, shot.dy);
			shot.translate(direction.normalize().scale(1400 * dt));

			// shot-vs-player collision detection and response
			if (shot.cid !== this.#clientId) {
				if (Intersect.shapeVsShape(shot.getCollidable().getCenter(), this.#player.getCollidable())) {
					this.#health -= 7;
					if (this.#health < 0)
						this.#health = 0;

					this.#sceneGraph.removeEntity(shot);
					this.#netAdapter.sendRemoveEntity(shot.eid);

					// respawn?
					if (this.#health === 0) {
						this.#health = 100;
						let p = this.#player;
						let x = rand(-1184, 1184);
						let y = rand(-1824, 1824);
						p.setPosition(x, y);

						// increment death counter
						this.#deaths++;
						this.deathsChanged.dispatch(this.#deaths);

						// send network update commands
						this.#netAdapter.sendMoveEntity(p.eid, x, y, p.dx, p.dy);
						this.#netAdapter.sendPlayerDied(this.#clientId, shot.cid);
					}

					this.healthChanged.dispatch(this.#health, 100);

					continue;
				}
			}

			// shot-vs-wall collision detection and response
			let intersects = this.#sceneGraph.queryCenterIn(shot, entityFlag.wall);
			if (intersects.length === 0)
				continue;

			if (shot.bounce === 3) {
				this.#sceneGraph.removeEntity(shot);
				if (shot.cid === this.#clientId)
					this.#netAdapter.sendRemoveEntity(shot.eid);

				continue;
			}

			// increment bounce counter
			shot.bounce++;

			// calculate MTV, and translate shot out of collision
			let mtv = this.#sceneGraph.getMtv(shot, entityFlag.wall);
			shot.translate(mtv);

			// split direction into perpendicular and parallel vectors for bounce response
			let bounce = direction.clone().projectOnto(mtv);
			let slide = direction.clone().projectOnto(mtv.clone().perpendicular());

			let dir = bounce.negate().add(slide).normalize();
			shot.dx = dir.x;
			shot.dy = dir.y;

			if (shot.cid == this.#clientId) {
				let pos = shot.getPosition();
				this.#netAdapter.sendMoveEntity(shot.eid, pos.x, pos.y, dir.x, dir.y);
			}
		}

		// update camera position
		this.#camera.setPosition(this.#player);

		// update player orientation
		this.#player.face(this.#mouse.getPosition());
	}

	#loadMap() {
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
				{ main: new Image(1, new Matrix().translate(-161, -161), "assets/image/grass.png", 322, 322) },
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
				{ main: new Image(4, new Matrix().translate(-128, -128).scale(0.7), "assets/image/player_brown.png", 256, 256) },
				{},
			),
			playerBlue: new Model(
				"playerBlue",
				{
					stand: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]),
					walk: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]),
					shoot: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]),
				},
				{ main: new Image(4, new Matrix().translate(-128, -128).scale(0.7), "assets/image/player_blue.png", 256, 256) },
				{},
			),
			playerGreen: new Model(
				"playerGreen",
				{
					stand: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]),
					walk: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]),
					shoot: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]),
				},
				{ main: new Image(4, new Matrix().translate(-128, -128).scale(0.7), "assets/image/player_green.png", 256, 256) },
				{},
			),
			playerPurple: new Model(
				"playerPurple",
				{
					stand: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]),
					walk: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]),
					shoot: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]),
				},
				{ main: new Image(4, new Matrix().translate(-128, -128).scale(0.7), "assets/image/player_purple.png", 256, 256) },
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
				{ main: new Image(1, new Matrix().translate(-96, -96).scale(0.5), "assets/image/shot_blue.png", 192, 192) },
				{},
			),
			shotGreen: new Model(
				"shotGreen",
				{ stand: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]) },
				{ main: new Image(1, new Matrix().translate(-96, -96).scale(0.5), "assets/image/shot_green.png", 192, 192) },
				{},
			),
			shotPurple: new Model(
				"shotPurple",
				{ stand: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]) },
				{ main: new Image(1, new Matrix().translate(-96, -96).scale(0.5), "assets/image/shot_purple.png", 192, 192) },
				{},
			),
			shotRed: new Model(
				"shotRed",
				{ stand: new Animation([new Frame(false, "main", 1, undefined, 0, 0)]) },
				{ main: new Image(1, new Matrix().translate(-96, -96).scale(0.5), "assets/image/shot_red.png", 192, 192) },
				{},
			),
		};

		// entities
		let entities = {};
		entities.bushes = [
			new Entity(models.bush, new Vector(-128, 1228), new Circle(0, 0, 128), undefined, entityFlag.collidable | entityFlag.wall),
			new Entity(models.bush, new Vector(128, 1100), new Circle(0, 0, 128), undefined, entityFlag.collidable | entityFlag.wall),
			new Entity(models.bush, new Vector(-512, 64), new Circle(0, 0, 128), undefined, entityFlag.collidable | entityFlag.wall),
			new Entity(models.bush, new Vector(256, -564), new Circle(0, 0, 128), undefined, entityFlag.collidable | entityFlag.wall),
			new Entity(models.bush, new Vector(128, -692), new Circle(0, 0, 128), undefined, entityFlag.collidable | entityFlag.wall),
			new Entity(models.bush, new Vector(832, -1460), new Circle(0, 0, 128), undefined, entityFlag.collidable | entityFlag.wall)
		];
		for (let bush of entities.bushes) {
			bush.modelState.playAnimation("stand");
		}

		entities.grass = [];
		for (let ix = 0; ix < 8; ix++) {
			const tile = 320;
			const tile_2 = tile / 2;
			const rect = new Rect(-tile_2, -tile_2, tile, tile);

			let x = -tile_2 * 7 + ix * tile;
			for (let iy = 12; iy > 0; iy--) {
				let y = -tile_2 * 13 + iy * tile;
				let grass = new Entity(models.grass, new Vector(x, y), rect.clone(), undefined, entityFlag.none);
				grass.modelState.playAnimation("stand")
				entities.grass.push(grass);
			}
		}

		entities.dirt = new Entity(models.dirt, new Vector(-260, 240), new Rect(-320, -320, 640, 640), undefined, entityFlag.none);
		entities.dirt.modelState.playAnimation("stand");

		entities.walls = [
			new Entity(models.innerWallH, new Vector(-196, -1149.5), new Rect(-533, -149.5, 1066, 299), undefined, entityFlag.collidable | entityFlag.wall),
			new Entity(models.innerWallV, new Vector(702, 288.5), new Rect(-148, -1232.5, 296, 2465), undefined, entityFlag.collidable | entityFlag.wall),
			new Entity(models.outerWallL, new Vector(-1184, 0), new Rect(-60, -1920, 120, 3840), undefined, entityFlag.collidable | entityFlag.wall),
			new Entity(models.outerWallT, new Vector(0, 1824), new Rect(-1148, -60, 2296, 120), undefined, entityFlag.collidable | entityFlag.wall),
			new Entity(models.outerWallR, new Vector(1184, 0), new Rect(-60, -1920, 120, 3840), undefined, entityFlag.collidable | entityFlag.wall),
			new Entity(models.outerWallB, new Vector(0, -1824), new Rect(-1148, -60, 2296, 120), undefined, entityFlag.collidable | entityFlag.wall)
		];
		for (let wall of entities.walls) {
			wall.modelState.playAnimation("stand");
		}

		// return completed map object
		return { entities, models };
	}

	run() {
		// init keyboard bindings
		let keyChanged = () => {
			let p = this.#player;
			if (p === undefined)
				return;

			p.dx = (key.isPressed("a") ? -1 : 0) + (key.isPressed("d") ? 1 : 0);
			p.dy = (key.isPressed("s") ? -1 : 0) + (key.isPressed("w") ? 1 : 0);

			let pos = p.getPosition();
			this.#netAdapter.sendMoveEntity(p.eid, pos.x, pos.y, p.dx, p.dy);
		};

		let keyFilter = new Set(["w", "a", "s", "d"]);
		let pressed = new Set();
		document.addEventListener("keydown", e => {
			if (!keyFilter.has(e.key) || pressed.has(e.key))
				return;

			pressed.add(e.key);
			keyChanged();
		});
		document.addEventListener("keyup", e => {
			if (!keyFilter.has(e.key) || !pressed.has(e.key))
				return;

			pressed.delete(e.key);
			keyChanged();
		});

		// init limited key bindings
		setInterval(() => {
			if (this.#mouse.getButtons().left)
				this._fire();
		}, 1000 / 10);

		// init rotation bcast
		let lastFace = 0;
		setInterval(() => {
			if (this.#player === undefined)
				return;

			let face = this.#player.getRotation();
			// only push update if thousands of a degree changed
			if ((face * 100 | 0) === (lastFace * 100 | 0))
				return;

			this.#netAdapter.sendFaceEntity(this.#player.eid, this.#player.getRotation())
			lastFace = face;
		}, 1000 / 30);

		// init regen timer (1hp/s)
		setInterval(() => {
			if (this.#health < 100) {
				this.#health += .04;
				this.healthChanged.dispatch(this.#health, 100);
			}
		}, 40);

		// init game loop
		this.#lastGameTime = Timing.now();
		setInterval(() => this._gameLoop(), 10);

		// init draw loop
		this.#lastDrawTime = Timing.now();
		let callback = () => {
			this._draw();
			requestAnimationFrame(callback);
		};
		requestAnimationFrame(callback);

		// init fps handling
		setInterval(() => {
			this.fpsChanged.dispatch(this.#fpsMetric);
			this.#fpsMetric.reset();
		}, 1000);
	}

	setPixelRatio(ratio) {
		this.#camera.pixelRatio = ratio;
	}
};

window.Shooter = Shooter;

})();
