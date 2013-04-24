"use strict";

var config = {
	host:"0.0.0.0",
	port: 1400
};

var WebSocketServer = require("ws").Server;
var wss = new WebSocketServer(config);
var clients = [];
var clientID = 1;
var entities = [];

function log(text) {
	var now = new Date();
	console.log("[%s %s] %s", now.toDateString(), now.toLocaleTimeString(), text);
} // log( )

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

function onConnection(ws) {
	ws.clientID = clientID++;
	clients[ws.clientID] = ws;
	log("connection opened (clientID " + ws.clientID + ")");

	var send = ws.send.bind(ws);
	ws.send = function(msg) {
		log(ws.clientID + " <-- " + msg);
		if (ws.readyState === 1)
			send(msg);
	};

	var propagate = function(msg) {
		for (var cid = 0; cid < clients.length; ++cid) {
			var client = clients[cid];
			if (client !== undefined && client != ws)
				client.send(msg);
		} // for( cid )
	};

	ws.on("close", function() {
		log("connection closed (clientID " + ws.clientID + ")");

		var client = clients[ws.clientID];
		clients[ws.clientID] = undefined;

		if (client !== undefined) {
			// remove player entity from game world
			entities[ws.clientID * 100000] = undefined;
			propagate(commandId.removeEntity + " " + (ws.clientID * 100000));

			// send remote disconnect to all other connected clients
			propagate(commandId.remoteDisconnect + " " + ws.clientID);
		} // if
	});
	ws.on('error', function(e) {
		log("Error (clientID " + ws.clientID + "): " + e.message);
	});
	ws.on("message", function(message) {
		log(ws.clientID + " --> " + message);

		var tokens = message.split(" ");
		var cmd = parseInt(tokens[0]);

		switch(cmd) {
			case commandId.localConnect: // cid
				// return local connect request with new clientID
				ws.send(commandId.localConnect + " " + ws.clientID);

				// send remote connect command to all other connected clients
				propagate(commandId.remoteConnect + " " + ws.clientID);

				break;
			case commandId.localDisconnect: // ...
				// release connection for requesting client
				clients[ws.clientID] = undefined;
				ws.send(commandId.localDisconnect + "");

				// remove player entity from game world
				entities[ws.clientID * 100000] = undefined;
				propagate(commandId.removeEntity + " " + (ws.clientID * 100000));

				// send remote disconnect to all other connected clients
				propagate(commandId.remoteDisconnect + " " + ws.clientID);

				break;
			case commandId.measurePing: // ...
				// return measure ping request
				ws.send(commandId.measurePing + "");

				break;
			case commandId.addEntity: // cid, eid, etid, x, y, dx, dy
				// create new entity object cache
				entities[parseInt(tokens[2])] = {
					cid: parseInt(tokens[1]),
					eid: parseInt(tokens[2]),
					etid: parseInt(tokens[3]),
					x: parseFloat(tokens[4]),
					y: parseFloat(tokens[5]),
					dx: parseFloat(tokens[6]),
					dy: parseFloat(tokens[7]),
					lastUpdated: new Date() | 0
				};

				// propagate message to all other connected clients
				propagate(message);

				break;
			case commandId.faceEntity: // eid, face
				// propagate message to all other connected clients
				propagate(message);

				break;
			case commandId.removeEntity: // eid
				// remove entity from server cache
				entities[parseInt(tokens[1])] = undefined;

				// propagate message to all other connected clients
				propagate(message);

				break;
			case commandId.moveEntity: // eid, x, y, dx, dy
				// update entity server cache
				var ent = entities[parseInt(tokens[1])];
				if (ent !== undefined) {
					ent.x = parseFloat(tokens[2]);
					ent.y = parseFloat(tokens[3]);
					ent.dx = parseFloat(tokens[4]);
					ent.dy = parseFloat(tokens[5]);
					ent.lastUpdated = new Date() | 0;
				} // if

				// propagate message to all other connected clients
				propagate(message);

				break;
			case commandId.playerDied: // cidDied, cidKilled
				// propagate message to all other connected clients
				propagate(message);

				break;
			default: // ...
				log("Received invalid message from client " + ws._clientId + ": " + message);
				break;
		} // switch
	});

	// sync existing clients back to newly connected client
	for (var cid = 0; cid < clients.length; ++cid) {
		if (clients[cid] !== undefined)
			ws.send(commandId.remoteConnect + " " + cid);
	} // for( i )

	// sync existing entities back to newly connected client
	for (var eid = 0; eid < entities.length; ++eid) {
		var ent = entities[eid];
		if (ent !== undefined) {
			//cid, eid, etid, x, y, dx, dy
			var dt = (new Date() - ent.lastUpdated) / 1000;
			ws.send(commandId.addEntity + " " + ent.cid + " " + ent.eid + " " + ent.etid + " " + (ent.x + ent.dx * dt).toFixed(3) + " " + (ent.y + ent.dy * dt).toFixed(3) + " " + ent.dx.toFixed(3) + " " + ent.dy.toFixed(3));
		} // if
	} // for( i )
} // onConnection( )

wss.on("connection", onConnection);

log("Server started on " + config.host + ":" + config.port);
