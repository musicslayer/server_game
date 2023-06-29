const Client = require("../client/Client.js");
const Account = require("../account/Account.js");
const EntityFactory = require("../entity/EntityFactory.js");

// Used to limit the amount of socket connections that an IP can form at once.
const numAllowedSockets = 10;
const numSocketsMap = new Map();

// Used to limit the amount of messages that any IP can send per second.
const numAllowedAccountOperations = 1;
const numAllowedInputOperations = 1000;
const numAllowedDataOperations = 1000;
const numAllowedDevOperations = 1000;

const numAccountCreationsMap = new Map();
const numCharacterCreationsMap = new Map();
const numLoginsMap = new Map();
const numInputsMap = new Map();
const numDatasMap = new Map();
const numDevsMap = new Map();

// Map of all currently logged in users.
const clientMap = new Map();

function createSocketIOServer(httpServer, accountManager, serverManager) {
	setInterval(() => {
		numAccountCreationsMap.clear();
		numCharacterCreationsMap.clear();
		numLoginsMap.clear();
		numInputsMap.clear();
		numDatasMap.clear();
		numDevsMap.clear();
	}, 1000);

	const io = new require("socket.io")(httpServer);

	io.on("connection", (socket) => {
		let ip = socket.handshake.address;
		let numSockets = numSocketsMap.get(ip) ?? 0;
		if(numSockets >= numAllowedSockets) {
			return;
		}

		numSockets++;
		numSocketsMap.set(ip, numSockets);

		socket.on("disconnect", (reason) => {
			let numSockets = numSocketsMap.get(ip);
			numSockets--;
			numSocketsMap.set(ip, numSockets);
		});

		attachAccountListeners(socket, accountManager, serverManager);
	});

	return io;
}

function attachAccountListeners(socket, accountManager, serverManager) {
	let ip = socket.handshake.address;

	// Respond to account creation.
	socket.on("on_account_creation", (username, password, callback) => {
		performAccountCreationTask(ip, () => {
			if(!validateCallback(callback)) {
				return;
			}
			if(!validateStrings(username, password)) {
				return;
			}

			let key = username + "-" + password;
			if(accountManager.getAccount(key)) {
				// The account already exists.
				callback({"isSuccess": false});
				return;
			}

			// Create a new account.
			let account = new Account();
			account.key = key;
			accountManager.addAccount(account);

			callback({"isSuccess": true});
		}, () => {
			if(!validateCallback(callback)) {
				return;
			}
			callback({"isSuccess": false, "error": "rate limit"});
		});
	});

	// Respond to character creation.
	socket.on("on_character_creation", (username, password, playerName, playerClass, callback) => {
		performCharacterCreationTask(ip, () => {
			if(!validateCallback(callback)) {
				return;
			}
			if(!validateStrings(username, password, playerName, playerClass)) {
				return;
			}

			let key = username + "-" + password;
			let account = accountManager.getAccount(key);
			if(!account) {
				// The account does not exist.
				callback({"isSuccess": false});
				return;
			}

			if(account.getCharacter(playerName)) {
				// The character already exists.
				callback({"isSuccess": false});
				return;
			}
			
			if(!["player_mage", "player_warrior"].includes(playerClass)) {
				callback({"isSuccess": false});
				return;
			}

			// Don't attach the screen here. This will be done on first login.
			// All new players will be spawned on a special tutorial map.
			let player = EntityFactory.createInstance(playerClass, 1);
			player.homeMapName = "city";
			player.homeScreenName = "field1";
			player.homeX = 0;
			player.homeY = 0;

			account.addCharacter(playerName, player);

			callback({"isSuccess": true});
		}, () => {
			if(!validateCallback(callback)) {
				return;
			}
			callback({"isSuccess": false, "error": "rate limit"});
		});
	});

	// Respond to login.
	socket.on("on_login", (username, password, playerName, serverName, worldName, callback) => {
		performLoginTask(ip, () => {
			if(!validateCallback(callback)) {
				return;
			}
			if(!validateStrings(username, password, playerName, serverName, worldName)) {
				return;
			}

			if(clientMap.has(username)) {
				// User is already logged in.
				callback({"isSuccess": false});
				return;
			}

			let key = username + "-" + password;

			let account = accountManager.getAccount(key);
			if(!account) {
				// The account does not exist.
				callback({"isSuccess": false});
				return;
			}

			let player = account.getCharacter(playerName);
			if(!player) {
				// The character does not exist.
				callback({"isSuccess": false});
				return;
			}

			let server = serverManager.getServerByName(serverName);
			let world = server?.universe.getWorldByName(worldName);
			if(!world) {
				callback({"isSuccess": false});
				return;
			}

			// If the player has never logged in before then default to their home screen on this world.
			let client = new Client(player);
			if(!client.player.screen) {
				let screen = world.getMapByName(client.player.homeMapName).getScreenByName(client.player.homeScreenName);
				if(!screen) {
					callback({"isSuccess": false});
					return;
				}
				client.player.screen = screen;
				client.player.x = client.player.homeX;
				client.player.y = client.player.homeY;
			}

			clientMap.set(username, client);

			client.player.getServerScheduler().scheduleTask(undefined, 0, () => {
                client.player.doSpawnInWorld(world);
            });

			socket.on("disconnect", (reason) => {
				clientMap.delete(username);
				client.player.getServerScheduler().scheduleTask(undefined, 0, () => {
					client.player.doDespawn();
				});
			});

			attachGameListeners(socket, client);

			callback({"isSuccess": true});
		}, () => {
			if(!validateCallback(callback)) {
				return;
			}
			callback({"isSuccess": false, "error": "rate limit"});
		});
	});
}

function attachGameListeners(socket, client) {
	let ip = socket.handshake.address;

	// Respond to key presses.
	socket.on("on_key_press", (keys, callback) => {
		performInputTask(ip, () => {
			if(!validateCallback(callback)) {
				return;
			}
			if(!validateKeys(keys)) {
				return;
			}

			client.onKeyPress(keys);
			callback();
		}, () => {
			if(!validateCallback(callback)) {
				return;
			}
			callback({"isSuccess": false, "error": "rate limit"});
		});
	});

	// Respond to controller button presses.
	socket.on("on_controller_press", (buttons, callback) => {
		performInputTask(ip, () => {
			if(!validateCallback(callback)) {
				return;
			}
			if(!validateButtons(buttons)) {
				return;
			}

			client.onControllerPress(buttons);
			callback();
		}, () => {
			if(!validateCallback(callback)) {
				return;
			}
			callback({"isSuccess": false, "error": "rate limit"});
		});
	});

	// Respond to controller analog sticks.
	socket.on("on_controller_sticks", (axes, callback) => {
		performInputTask(ip, () => {
			if(!validateCallback(callback)) {
				return;
			}
			if(!validateAxes(axes)) {
				return;
			}

			client.onControllerSticks(axes);
			callback();
		}, () => {
			if(!validateCallback(callback)) {
				return;
			}
			callback({"isSuccess": false, "error": "rate limit"});
		});
	});

	// Respond to mouse clicks.
	socket.on("on_mouse_click", (button, location, info, callback) => {
		performInputTask(ip, () => {
			if(!validateCallback(callback)) {
				return;
			}
			if(!validateMouse(button, location, info)) {
				return;
			}

			client.onClick(button, location, info);
			callback();
		}, () => {
			if(!validateCallback(callback)) {
				return;
			}
			callback({"isSuccess": false, "error": "rate limit"});
		});
	});

	// Respond to mouse drags.
	socket.on("on_mouse_drag", (button, location1, info1, location2, info2, callback) => {
		performInputTask(ip, () => {
			if(!validateCallback(callback)) {
				return;
			}
			if(!validateMouse(button, location2, info2)) {
				return;
			}
			if(!validateMouse(button, location2, info2)) {
				return;
			}

			client.onDrag(button, location1, info1, location2, info2);
			callback();
		}, () => {
			if(!validateCallback(callback)) {
				return;
			}
			callback({"isSuccess": false, "error": "rate limit"});
		});
	});

	// Send the client all the data needed to draw the player's screen.
	socket.on("get_client_data", (callback) => {
		performDataTask(ip, () => {
			if(!validateCallback(callback)) {
				return;
			}

			let clientData = client.getClientData();
			callback(clientData);
		});
	});

	// Send certain developer data to the client.
	socket.on("get_dev_data", (callback) => {
		performDevTask(ip, () => {
			if(!validateCallback(callback)) {
				return;
			}

			let devData = client.getDevData();
			callback(devData);
		}, () => {
			if(!validateCallback(callback)) {
				return;
			}
			callback({"isSuccess": false, "error": "rate limit"});
		});
	});
}

// TODO Rename to say "rate" or "rate limit"
function performAccountCreationTask(ip, task, rtask) {
	let N = numAccountCreationsMap.get(ip) ?? 0;
	if(N < numAllowedAccountOperations) {
		N++;
		numAccountCreationsMap.set(ip, N);

		task();
	}
	else {
		rtask();
	}
}

function performCharacterCreationTask(ip, task, rtask) {
	let N = numCharacterCreationsMap.get(ip) ?? 0;
	if(N < numAllowedAccountOperations) {
		N++;
		numCharacterCreationsMap.set(ip, N);

		task();
	}
	else {
		rtask();
	}
}

function performLoginTask(ip, task, rtask) {
	let N = numLoginsMap.get(ip) ?? 0;
	if(N < numAllowedAccountOperations) {
		N++;
		numLoginsMap.set(ip, N);

		task();
	}
	else {
		rtask();
	}
}

function performInputTask(ip, task, rtask) {
	let N = numInputsMap.get(ip) ?? 0;
	if(N < numAllowedInputOperations) {
		N++;
		numInputsMap.set(ip, N);

		task();
	}
	else {
		rtask();
	}
}

function performDataTask(ip, task, rtask) {
	let N = numDatasMap.get(ip) ?? 0;
	if(N < numAllowedDataOperations) {
		N++;
		numDatasMap.set(ip, N);

		task();
	}
	else {
		rtask();
	}
}

function performDevTask(ip, task, rtask) {
	let N = numDevsMap.get(ip) ?? 0;
	if(N < numAllowedDevOperations) {
		N++;
		numDevsMap.set(ip, N);
		
		task();
	}
	else {
		rtask();
	}
}

function validateCallback(callback) {
	return isFunction(callback);
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

function validateStrings(...args) {
	return isStringArray(args, 5);
}

function isFunction(value) {
	return typeof value === "function" || value instanceof Function;
}

function isNumber(value) {
	return typeof value === "number" || value instanceof Number;
}

function isNumberArray(value, maxLength) {
	return Array.isArray(value) && value.length <= maxLength && value.every((v) => isNumber(v));
}

function isString(value) {
	return typeof value === "string" || value instanceof String;
}

function isStringArray(value, maxLength) {
	return Array.isArray(value) && value.length <= maxLength && value.every((v) => isString(v));
}

module.exports.createSocketIOServer = createSocketIOServer;