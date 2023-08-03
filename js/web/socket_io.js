//#EXCLUDE_REFLECTION

const IO = require("socket.io");

const Account = require("../account/Account.js");
const Character = require("../account/Character.js");
const Client = require("../client/Client.js");
const Entity = require("../entity/Entity.js");
const Reflection = require("../reflection/Reflection.js");
const ServerTask = require("../server/ServerTask.js");

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

function createSocketIOServer(httpServer, appState) {
	setInterval(() => {
		numAccountCreationsMap.clear();
		numCharacterCreationsMap.clear();
		numLoginsMap.clear();
		numInputsMap.clear();
		numDatasMap.clear();
		numDevsMap.clear();
	}, 1000);

	let io = IO(httpServer);

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

		attachAppListeners(socket, appState);
	});

	return io;
}

function attachAppListeners(socket, appState) {
	let ip = socket.handshake.address;

	// Respond to account creation.
	socket.on("on_account_creation", (username, password, callback) => {
		rateLimitAccountCreationTask(ip, () => {
			if(!validateCallback(callback)) {
				return;
			}
			if(!validateStrings(username, password)) {
				return;
			}

			let key = username + "-" + password;
			if(appState.accountManager.getAccount(key)) {
				// The account already exists.
				callback({"isSuccess": false});
				return;
			}

			// Create a new account.
			let account = new Account();
			account.key = key;
			appState.accountManager.addAccount(account);

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
		rateLimitCharacterCreationTask(ip, () => {
			if(!validateCallback(callback)) {
				return;
			}
			if(!validateStrings(username, password, playerName, playerClass)) {
				return;
			}

			let key = username + "-" + password;
			let account = appState.accountManager.getAccount(key);
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

			if(!Reflection.isSubclass(playerClass, "Player")) {
				callback({"isSuccess": false});
				return;
			}

			let player = Entity.createInstance(playerClass, 1);
			let character = new Character(player);
			account.addCharacter(playerName, character);

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
		rateLimitLoginTask(ip, () => {
			if(!validateCallback(callback)) {
				return;
			}
			if(!validateStrings(username, password, playerName, serverName, worldName)) {
				return;
			}

			let key = username + "-" + password;
			if(appState.clientManager.clientMap.has(key)) {
				// User is already logged in.
				callback({"isSuccess": false});
				return;
			}

			let account = appState.accountManager.getAccount(key);
			if(!account) {
				// The account does not exist.
				callback({"isSuccess": false});
				return;
			}

			let character = account.getCharacter(playerName);
			if(!character) {
				// The character does not exist.
				callback({"isSuccess": false});
				return;
			}

			let server = appState.serverManager.getServerByName(serverName);
			let world = server?.universe.getWorldByName(worldName);
			if(!world) {
				callback({"isSuccess": false});
				return;
			}

			let player = character.player;

			let screen;
			if(player.mapName === undefined || player.screenName === undefined) {
				// On the first login use a tutorial screen.
				let tutorialWorld = world.universe.getWorldByID("tutorial");
				entrance = tutorialWorld.createEntrance(world);

				screen = entrance.screen;
				player.x = entrance.x;
				player.y = entrance.y;
			}
			else {
				let map = world.getMapByName(player.mapName);
				screen = map?.getScreenByName(player.screenName);
			}

			if(!screen) {
				// Use a fallback screen.
				let fallbackWorld = world.universe.getWorldByID("fallback");
				let entrance = fallbackWorld.createEntrance(world);

				screen = entrance.screen;
				player.x = entrance.x;
				player.y = entrance.y;
			}

			player.setScreen(screen);

			let serverTask = new ServerTask((player) => {
				player.doSpawn();
			}, player);
	
			player.getServer().scheduleTask(undefined, 0, 1, serverTask);

			let client = new Client(playerName, player);
        	client.key = key;
			client.socket = socket;
			client.appState = appState;
			appState.clientManager.addClient(client);

			player.client = client;

			socket.on("disconnect", (reason) => {
				let client = appState.clientManager.getClient(key);
				appState.clientManager.removeClient(client);

				// It's possible that a client is present but then a state is loaded where the player was despawned or did not exist.
				if(client.player) {
					if(client.player.isSpawned) {
						let serverTask = new ServerTask((player) => {
							player.doDespawn();
						}, client.player);

						client.player.getServer().scheduleTask(undefined, 0, 1, serverTask);
					}

					client.player.client = undefined;
					client.player = undefined;
				}
			});

			attachClientListeners(socket, client);

			callback({"isSuccess": true});
		}, () => {
			if(!validateCallback(callback)) {
				return;
			}
			callback({"isSuccess": false, "error": "rate limit"});
		});
	});
}

function attachClientListeners(socket, client) {
	let ip = socket.handshake.address;

	// Respond to key presses.
	socket.on("on_key_press", async (keys, callback) => {
		await rateLimitInputTask(ip, async () => {
			if(!validateCallback(callback)) {
				return;
			}
			if(!validateKeys(keys)) {
				return;
			}

			await client.onKeyPress(keys);
			callback();
		}, async () => {
			if(!validateCallback(callback)) {
				return;
			}
			callback({"isSuccess": false, "error": "rate limit"});
		});
	});

	// Respond to controller button presses.
	socket.on("on_controller_press", (buttons, callback) => {
		rateLimitInputTask(ip, async () => {
			if(!validateCallback(callback)) {
				return;
			}
			if(!validateButtons(buttons)) {
				return;
			}

			client.onControllerPress(buttons);
			callback();
		}, async () => {
			if(!validateCallback(callback)) {
				return;
			}
			callback({"isSuccess": false, "error": "rate limit"});
		});
	});

	// Respond to controller analog sticks.
	socket.on("on_controller_sticks", (axes, callback) => {
		rateLimitInputTask(ip, async () => {
			if(!validateCallback(callback)) {
				return;
			}
			if(!validateAxes(axes)) {
				return;
			}

			client.onControllerSticks(axes);
			callback();
		}, async () => {
			if(!validateCallback(callback)) {
				return;
			}
			callback({"isSuccess": false, "error": "rate limit"});
		});
	});

	// Respond to mouse clicks.
	socket.on("on_mouse_click", (button, location, info, callback) => {
		rateLimitInputTask(ip, async () => {
			if(!validateCallback(callback)) {
				return;
			}
			if(!validateMouse(button, location, info)) {
				return;
			}

			client.onClick(button, location, info);
			callback();
		}, async () => {
			if(!validateCallback(callback)) {
				return;
			}
			callback({"isSuccess": false, "error": "rate limit"});
		});
	});

	// Respond to mouse drags.
	socket.on("on_mouse_drag", (button, location1, info1, location2, info2, callback) => {
		rateLimitInputTask(ip, async () => {
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
		}, async () => {
			if(!validateCallback(callback)) {
				return;
			}
			callback({"isSuccess": false, "error": "rate limit"});
		});
	});

	// Send the client all the data needed to draw the player's screen.
	socket.on("get_client_data", (callback) => {
		rateLimitDataTask(ip, () => {
			if(!validateCallback(callback)) {
				return;
			}

			let clientData = client.getClientData();
			callback(clientData);
		});
	});

	// Send developer data to the client.
	socket.on("get_dev_data", (callback) => {
		rateLimitDevTask(ip, () => {
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

function rateLimitAccountCreationTask(ip, task, rtask) {
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

function rateLimitCharacterCreationTask(ip, task, rtask) {
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

function rateLimitLoginTask(ip, task, rtask) {
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

async function rateLimitInputTask(ip, task, rtask) {
	let N = numInputsMap.get(ip) ?? 0;
	if(N < numAllowedInputOperations) {
		N++;
		numInputsMap.set(ip, N);

		await task();
	}
	else {
		await rtask();
	}
}

function rateLimitDataTask(ip, task, rtask) {
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

function rateLimitDevTask(ip, task, rtask) {
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
	return typeof value === "function" || (typeof value === "object" && value instanceof Function);
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