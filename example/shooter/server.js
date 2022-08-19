"use strict";

const WebSocketServer = require("ws").Server;

const serverConfig = {
	host: "0.0.0.0",
	port: 1400,
};

function log(msg, logger = console.log) {
	let ts = JSON.parse(JSON.stringify(new Date()));
	logger(`[${ts}]`, msg);
};

const dbg = msg => log(`D: ${msg}`, console.debug);
const info = msg => log(`I: ${msg}`, console.info);
const warn = msg => log(`W: ${msg}`, console.warn);

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

class ShooterServer {
	#clients = [];
	#entities = [];
	#nextClientId = 1;
	#wsServer;

	listen(config) {
		this.#wsServer = new WebSocketServer(config);
		this.#wsServer.on("connection", this.#onWsConnection.bind(this));

		info(`ShooterServer started on ${config.host}:${config.port}`);
	}

	#onWsClose(ws) {
		info(`connection closed (clientId ${ws._clientId})`);

		let client = this.#clients[ws._clientId];
		this.#clients[ws._clientId] = undefined;

		if (client === undefined)
			return;

		// remove player entity from game world
		let entId = ws._clientId * 100000;
		this.#entities[entId] = undefined;
		this.#propagate(ws, `${cmdId.removeEntity} ${entId}`);

		// send remote disconnect to all other connected clients
		this.#propagate(ws, `${cmdId.remoteDisconnect} ${ws._clientId}`);
	}

	#onWsConnection(ws) {
		ws._clientId = this.#nextClientId++;
		this.#clients[ws._clientId] = ws;
		info(`connection opened (clientId ${ws._clientId})`);

		let send = ws.send.bind(ws);
		ws.send = function(msg) {
			dbg(`${ws._clientId} <-- ${msg}`);
			if (ws.readyState === 1)
				send(msg);
		};

		ws.on("close", () => this.#onWsClose(ws));
		ws.on("error", e => this.#onWsError(ws, e));
		ws.on("message", binMsg => this.#onWsMessage(ws, binMsg));

		// sync existing clients back to newly connected client
		for (let cid = 0; cid < this.#clients.length; ++cid) {
			if (this.#clients[cid] !== undefined)
				ws.send(`${cmdId.remoteConnect} ${cid}`);
		}

		// sync existing entities back to newly connected client
		let now = performance.now();
		for (let eid = 0; eid < this.#entities.length; ++eid) {
			let ent = this.#entities[eid];
			if (ent !== undefined) {
				//cid, eid, etid, x, y, dx, dy
				let dt = (now - ent.lastUpdated) / 1000;
				let projX = ent.x + ent.dx * dt;
				let projY = ent.y + ent.dy * dt;
				ws.send(`${cmdId.addEntity} ${ent.cid} ${ent.eid} ${ent.etid} ${projX.toFixed(3)} ${projY.toFixed(3)} ${ent.dx.toFixed(3)} ${ent.dy.toFixed(3)}`);
			}
		}
	}

	#onWsError(ws, e) {
		warn(`Error (clientId ${ws._clientId}): ${e.message}`);
	}

	#onWsMessage(ws, binMsg) {
		let msg = new TextDecoder().decode(binMsg);
		dbg(`${ws._clientId} --> ${msg}`);

		let tokens = msg.split(" ");
		let cmd = parseInt(tokens[0]);

		switch(cmd) {
			case cmdId.localConnect: // cid
				// return local connect request with new clientId
				ws.send(`${cmdId.localConnect} ${ws._clientId}`);

				// send remote connect command to all other connected clients
				this.#propagate(ws, `${cmdId.remoteConnect} ${ws._clientId}`);

				break;
			case cmdId.localDisconnect: // ...
				// release connection for requesting client
				this.#clients[ws._clientId] = undefined;
				ws.send(`${cmdId.localDisconnect}`);

				// remove player entity from game world
				this.#entities[ws._clientId * 100000] = undefined;
				this.#propagate(ws, `${cmdId.removeEntity} ${ws._clientId * 100000}`);

				// send remote disconnect to all other connected clients
				this.#propagate(ws, `${cmdId.remoteDisconnect} ${ws._clientId}`);

				break;
			case cmdId.measurePing: // ...
				// return measure ping request
				ws.send(cmdId.measurePing + "");

				break;
			case cmdId.addEntity: // cid, eid, etid, x, y, dx, dy
				// create new entity object cache
				this.#entities[parseInt(tokens[2])] = {
					cid: parseInt(tokens[1]),
					eid: parseInt(tokens[2]),
					etid: parseInt(tokens[3]),
					x: parseFloat(tokens[4]),
					y: parseFloat(tokens[5]),
					dx: parseFloat(tokens[6]),
					dy: parseFloat(tokens[7]),
					lastUpdated: performance.now(),
				};

				// propagate message to all other connected clients
				this.#propagate(ws, msg);

				break;
			case cmdId.faceEntity: // eid, face
				// propagate message to all other connected clients
				this.#propagate(ws, msg);

				break;
			case cmdId.removeEntity: // eid
				// remove entity from server cache
				this.#entities[parseInt(tokens[1])] = undefined;

				// propagate message to all other connected clients
				this.#propagate(ws, msg);

				break;
			case cmdId.moveEntity: // eid, x, y, dx, dy
				// update entity server cache
				let ent = this.#entities[parseInt(tokens[1])];
				if (ent !== undefined) {
					ent.x = parseFloat(tokens[2]);
					ent.y = parseFloat(tokens[3]);
					ent.dx = parseFloat(tokens[4]);
					ent.dy = parseFloat(tokens[5]);
					ent.lastUpdated = performance.now();
				}

				// propagate message to all other connected clients
				this.#propagate(ws, msg);

				break;
			case cmdId.playerDied: // cidDied, cidKilled
				// propagate message to all other connected clients
				this.#propagate(ws, msg);

				break;
			default: // ...
				info(`Received invalid message from client ${ws._clientId}: ${msg}`);
				break;
		}
	}

	#propagate(srcWs, msg) {
		for (let ws of this.#clients) {
			if (ws === undefined || ws === srcWs)
				continue;

			ws.send(msg);
		}
	};
}

let server = new ShooterServer();
server.listen(serverConfig);
