const Client = require("../client/Client.js");

// Used to limit the amount of messages that any client can send per second.
const numAllowedOperations = 1000;
const numLoginsMap = new Map();
const numInputsMap = new Map();
const numDatasMap = new Map();
const numDevsMap = new Map();

// Map of all currently logged in users.
const clientMap = new Map();

function createSocketIOServer(server, accountManager) {
	setInterval(() => {
		numLoginsMap.clear();
		numInputsMap.clear();
		numDatasMap.clear();
		numDevsMap.clear();
	}, 1000);

	const io = new require("socket.io")(server);

	io.on("connection", (socket) => {
		if(!socket.handshake.auth) {
			// Do not allow any handshakes without authentication.
			return;
		}

		let username = socket.handshake.auth.username;
		performLoginTask(username, () => {
			if(clientMap.has(username)) {
				// User is already logged in.
				// ??? We should probably error or offer a chance to force log out...
				return;
			}

			let password = socket.handshake.auth.password;
			let key = username + "-" + password;

			let account = accountManager.getAccount(key);
			if(!account) {
				// If the account doesn't exist, don't proceed any further.
				return;
			}

			let player = account.getCharacter(socket.handshake.query.name);
			if(!player) {
				// If the character does not exist, don't proceed any further.
				return;
			}

			let client = new Client(player);

			clientMap.set(username, client);
			client.player.spawn();

			attachListeners(socket, client, username);
		});
	});

	return io;
}

function attachListeners(socket, client, username) {
	// Respond to the client disconnecting.
	socket.on("disconnect", (reason) => {
		clientMap.delete(username);
		client.player.despawn();
	});

	// Respond to key presses.
	socket.on("on_key_press", (keys, callback) => {
		performInputTask(username, () => {
			if(!validateKeys(keys)) {
				return;
			}

			client.onKeyPress(keys);
			callback();
		});
	});

	// Respond to controller button presses.
	socket.on("on_controller_press", (buttons, callback) => {
		performInputTask(username, () => {
			if(!validateButtons(buttons)) {
				return;
			}

			client.onControllerPress(buttons);
			callback();
		});
	});

	// Respond to controller analog sticks.
	socket.on("on_controller_sticks", (axes, callback) => {
		performInputTask(username, () => {
			if(!validateAxes(axes)) {
				return;
			}

			client.onControllerSticks(axes);
			callback();
		});
	});

	// Respond to mouse clicks.
	socket.on("on_mouse_click", (button, location, info, callback) => {
		performInputTask(username, () => {
			if(!validateMouse(button, location, info)) {
				return;
			}

			client.onClick(button, location, info);
			callback();
		});
	});

	// Respond to mouse drags.
	socket.on("on_mouse_drag", (button, location1, info1, location2, info2, callback) => {
		performInputTask(username, () => {
			if(!validateMouse(button, location2, info2)) {
				return;
			}
			if(!validateMouse(button, location2, info2)) {
				return;
			}

			client.onDrag(button, location1, info1, location2, info2);
			callback();
		});
	});

	// Send the client all the data needed to draw the player's screen.
	socket.on("get_client_data", (callback) => {
		performDataTask(username, () => {
			let clientData = client.getClientData();
			callback(clientData);
		});
	});

	// Send certain developer data to the client.
	socket.on("get_dev_data", (callback) => {
		performDevTask(username, () => {
			let devData = client.getDevData();
			callback(devData);
		});
	});
}

function performLoginTask(username, task) {
	let N = numLoginsMap.get(username) ?? 0;
	if(N < numAllowedOperations) {
		N++;
		numLoginsMap.set(username, N);

		task();
	}
}

function performInputTask(username, task) {
	let N = numInputsMap.get(username) ?? 0;
	if(N < numAllowedOperations) {
		N++;
		numInputsMap.set(username, N);

		task();
	}
}

function performDataTask(username, task) {
	let N = numDatasMap.get(username) ?? 0;
	if(N < numAllowedOperations) {
		N++;
		numDatasMap.set(username, N);

		task();
	}
}

function performDevTask(username, task) {
	let N = numDevsMap.get(username) ?? 0;
	if(N < numAllowedOperations) {
		N++;
		numDevsMap.set(username, N);
		
		task();
	}
}

function validateKeys(keys) {
	return isNumberArray(keys, 20);
}

function validateButtons(buttons) {
	return isNumberArray(buttons, 20);
}

function validateAxes(axes) {
	return isNumberArray(axes, 4) && axes.length === 4
	&& axes[0] >= -1 && axes[0] <= 1
	&& axes[1] >= -1 && axes[1] <= 1
	&& axes[2] >= -1 && axes[2] <= 1
	&& axes[3] >= -1 && axes[3] <= 1;
}

function validateMouse(button, location, info) {
	return isNumber(button)
	&& isString(location)
	&& isNumberArray(info, 2)
	&& validateMouseInputs(location, info);
}

function validateMouseInputs(location, info) {
	if(location === "screen") {
		return info.length === 2;
	}
	else if(location === "inventory") {
		return info.length === 1;
	}
	else if(location === "purse") {
		return info.length === 0;
	}
	else {
		return false;
	}
}

function isString(value) {
	return typeof value === "string" || value instanceof String;
}

function isNumber(value) {
	return typeof value === "number" || value instanceof Number;
}

function isNumberArray(value, maxLength) {
	return Array.isArray(value) && value.length <= maxLength && value.every((v) => isNumber(v));
}

module.exports.createSocketIOServer = createSocketIOServer;