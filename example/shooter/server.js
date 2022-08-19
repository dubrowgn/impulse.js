"use strict";

let config = {
	host:"0.0.0.0",
	port: 1400
};

let WebSocketServer = require("ws").Server;
let wss = new WebSocketServer(config);
let clients = [];
let clientID = 1;
let entities = [];

function log(msg) {
	let ts = JSON.parse(JSON.stringify(new Date()));
	console.log(`[${ts}] ${msg}`);
};

let cmdId = {
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

function onConnection(ws) {
	ws.clientID = clientID++;
	clients[ws.clientID] = ws;
	log(`connection opened (clientID ${ws.clientID})`);

	let send = ws.send.bind(ws);
	ws.send = function(msg) {
		log(`${ws.clientID} <-- ${msg}`);
		if (ws.readyState === 1)
			send(msg);
	};

	let propagate = function(msg) {
		for (let cid = 0; cid < clients.length; ++cid) {
			let client = clients[cid];
			if (client !== undefined && client != ws)
				client.send(msg);
		}
	};

	ws.on("close", function() {
		log(`connection closed (clientID ${ws.clientID})`);

		let client = clients[ws.clientID];
		clients[ws.clientID] = undefined;

		if (client !== undefined) {
			// remove player entity from game world
			let entId = ws.clientID * 100000;
			entities[entId] = undefined;
			propagate(`${cmdId.removeEntity} ${entId}`);

			// send remote disconnect to all other connected clients
			propagate(`${cmdId.remoteDisconnect} ${ws.clientID}`);
		}
	});
	ws.on('error', function(e) {
		log(`Error (clientID ${ws.clientID}): ${e.message}`);
	});
	ws.on("message", function(binMsg) {
		let msg = new TextDecoder().decode(binMsg);
		log(`${ws.clientID} --> ${msg}`);

		let tokens = msg.split(" ");
		let cmd = parseInt(tokens[0]);

		switch(cmd) {
			case cmdId.localConnect: // cid
				// return local connect request with new clientID
				ws.send(`${cmdId.localConnect} ${ws.clientID}`);

				// send remote connect command to all other connected clients
				propagate(`${cmdId.remoteConnect} ${ws.clientID}`);

				break;
			case cmdId.localDisconnect: // ...
				// release connection for requesting client
				clients[ws.clientID] = undefined;
				ws.send(`${cmdId.localDisconnect}`);

				// remove player entity from game world
				entities[ws.clientID * 100000] = undefined;
				propagate(`${cmdId.removeEntity} ${ws.clientID * 100000}`);

				// send remote disconnect to all other connected clients
				propagate(`${cmdId.remoteDisconnect} ${ws.clientID}`);

				break;
			case cmdId.measurePing: // ...
				// return measure ping request
				ws.send(cmdId.measurePing + "");

				break;
			case cmdId.addEntity: // cid, eid, etid, x, y, dx, dy
				// create new entity object cache
				entities[parseInt(tokens[2])] = {
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
				propagate(msg);

				break;
			case cmdId.faceEntity: // eid, face
				// propagate message to all other connected clients
				propagate(msg);

				break;
			case cmdId.removeEntity: // eid
				// remove entity from server cache
				entities[parseInt(tokens[1])] = undefined;

				// propagate message to all other connected clients
				propagate(msg);

				break;
			case cmdId.moveEntity: // eid, x, y, dx, dy
				// update entity server cache
				let ent = entities[parseInt(tokens[1])];
				if (ent !== undefined) {
					ent.x = parseFloat(tokens[2]);
					ent.y = parseFloat(tokens[3]);
					ent.dx = parseFloat(tokens[4]);
					ent.dy = parseFloat(tokens[5]);
					ent.lastUpdated = performance.now();
				}

				// propagate message to all other connected clients
				propagate(msg);

				break;
			case cmdId.playerDied: // cidDied, cidKilled
				// propagate message to all other connected clients
				propagate(msg);

				break;
			default: // ...
				log(`Received invalid message from client #{ws._clientId}: ${msg}`);
				break;
		}
	});

	// sync existing clients back to newly connected client
	for (let cid = 0; cid < clients.length; ++cid) {
		if (clients[cid] !== undefined)
			ws.send(`${cmdId.remoteConnect} ${cid}`);
	}

	// sync existing entities back to newly connected client
	let now = performance.now();
	for (let eid = 0; eid < entities.length; ++eid) {
		let ent = entities[eid];
		if (ent !== undefined) {
			//cid, eid, etid, x, y, dx, dy
			let dt = (now - ent.lastUpdated) / 1000;
			ws.send(`${cmdId.addEntity} ${ent.cid} ${ent.eid} ${ent.etid} ${(ent.x + ent.dx * dt).toFixed(3)} ${(ent.y + ent.dy * dt).toFixed(3)} ${ent.dx.toFixed(3)} ${ent.dy.toFixed(3)}`);
		}
	}
}

wss.on("connection", onConnection);

log(`Server started on ${config.host}:${config.port}`);
