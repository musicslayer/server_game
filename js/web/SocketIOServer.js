const IO = require("socket.io");

const Account = require("../account/Account.js");
const Character = require("../account/Character.js");
const Client = require("../client/Client.js");
const Entity = require("../entity/Entity.js");
const RateLimit = require("../security/RateLimit.js");
const Reflection = require("../reflection/Reflection.js");
const ServerTask = require("../server/ServerTask.js");

// Used to limit the amount of socket connections that an IP can form at once.
// TODO put in a class?
const numAllowedSockets = 10;
const numSocketsMap = new Map();

class SocketIOServer {
	server;
	appState;
	rateLimiter;

	constructor(httpServer, appState) {
		this.server = IO(httpServer.server, {
			// Use these options to only allow websockets and avoid memory leaks.
			allowUpgrades: false,
			transports: ["websocket"]
		});

		this.appState = appState;

		this.attachConnectionListeners();
	}

	attachConnectionListeners() {
		this.server.on("connection", (socket) => {
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
	
			this.attachAppListeners(socket);
		});
	}

	attachAppListeners(socket) {
		let ip = socket.handshake.address;
		socket.secretValue = "ABCDEFG"

		// Respond to account creation.
		socket.on("on_account_creation", (username, password, callback) => {
			RateLimit.rateLimitTask("create_account", ip, () => {
				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}
				if(!validateStrings(username, password)) {
					socket.disconnect(true);
					return;
				}

				let key = username + "-" + password;
				if(this.appState.accountManager.getAccount(key)) {
					// The account already exists.
					callback({"isSuccess": false});
					return;
				}

				// Create a new account.
				let account = new Account();
				account.key = key;
				this.appState.accountManager.addAccount(account);

				callback({"isSuccess": true});
			}, () => {
				socket.disconnect(true);
			});
		});

		// Respond to character creation.
		socket.on("on_character_creation", (username, password, playerName, playerClass, callback) => {
			RateLimit.rateLimitTask("create_character", ip, () => {
				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}
				if(!validateStrings(username, password, playerName, playerClass)) {
					socket.disconnect(true);
					return;
				}

				let key = username + "-" + password;
				let account = this.appState.accountManager.getAccount(key);
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
				socket.disconnect(true);
			});
		});

		// Respond to login.
		socket.on("on_login", (username, password, playerName, serverName, worldName, callback) => {
			RateLimit.rateLimitTask("login", ip, () => {
				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}
				if(!validateStrings(username, password, playerName, serverName, worldName)) {
					socket.disconnect(true);
					return;
				}

				let key = username + "-" + password;
				if(this.appState.clientManager.clientMap.has(key)) {
					// User is already logged in.
					callback({"isSuccess": false});
					return;
				}

				let account = this.appState.accountManager.getAccount(key);
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

				let server = this.appState.serverManager.getServerByName(serverName);
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
					let entrance = tutorialWorld.createEntrance(world);

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
				
				let serverTask = new ServerTask(undefined, 0, 1, "spawn", player);
				player.getServer().scheduleTask(serverTask);

				let client = new Client(playerName, player);
				client.key = key;
				client.socket = socket;
				client.appState = this.appState;
				this.appState.clientManager.addClient(client);

				player.client = client;

				socket.on("disconnect", (reason) => {
					let client = this.appState.clientManager.getClient(key);
					this.appState.clientManager.removeClient(client);

					// It's possible that a client is present but then a state is loaded where the player was despawned or did not exist.
					if(client.player) {
						if(client.player.isSpawned) {
							let serverTask = new ServerTask(undefined, 0, 1, "despawn", client.player);
							client.player.getServer().scheduleTask(serverTask);
						}

						client.player.client = undefined;
						client.player = undefined;
					}
				});

				this.attachClientListeners(socket, client);

				callback({"isSuccess": true});
			}, () => {
				socket.disconnect(true);
			});
		});
	}

	attachClientListeners(socket, client) {
		let ip = socket.handshake.address;
	
		// Respond to key presses.
		socket.on("on_key_press", (keys, callback) => {
			RateLimit.rateLimitTask("input", ip, () => {
				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}
				if(!validateKeys(keys)) {
					socket.disconnect(true);
					return;
				}
	
				client.onKeyPress(keys);
				callback();
			}, () => {
				socket.disconnect(true);
			});
		});
	
		// Respond to controller button presses.
		socket.on("on_controller_press", (buttons, callback) => {
			RateLimit.rateLimitTask("input", ip, () => {
				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}
				if(!validateButtons(buttons)) {
					socket.disconnect(true);
					return;
				}
	
				client.onControllerPress(buttons);
				callback();
			}, () => {
				socket.disconnect(true);
			});
		});
	
		// Respond to controller analog sticks.
		socket.on("on_controller_sticks", (axes, callback) => {
			RateLimit.rateLimitTask("input", ip, () => {
				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}
				if(!validateAxes(axes)) {
					socket.disconnect(true);
					return;
				}
	
				client.onControllerSticks(axes);
				callback();
			}, () => {
				socket.disconnect(true);
			});
		});
	
		// Respond to mouse clicks.
		socket.on("on_mouse_click", (button, location, info, callback) => {
			RateLimit.rateLimitTask("input", ip, () => {
				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}
				if(!validateMouse(button, location, info)) {
					socket.disconnect(true);
					return;
				}
	
				client.onClick(button, location, info);
				callback();
			}, () => {
				socket.disconnect(true);
			});
		});
	
		// Respond to mouse drags.
		socket.on("on_mouse_drag", (button, location1, info1, location2, info2, callback) => {
			RateLimit.rateLimitTask("input", ip, () => {
				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}
				if(!validateMouse(button, location2, info2)) {
					socket.disconnect(true);
					return;
				}
				if(!validateMouse(button, location2, info2)) {
					socket.disconnect(true);
					return;
				}
	
				client.onDrag(button, location1, info1, location2, info2);
				callback();
			}, () => {
				socket.disconnect(true);
			});
		});
	
		// Send the client all the data needed to draw the player's screen.
		socket.on("get_client_data", (callback) => {
			RateLimit.rateLimitTask("data", ip, () => {
				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}
	
				let clientData = client.getClientData();
				callback({"isSuccess": true, "clientData": clientData});
			}, () => {
				socket.disconnect(true);
			});
		});
	
		// Send developer data to the client.
		socket.on("get_dev_data", (callback) => {
			RateLimit.rateLimitTask("dev", ip, () => {
				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}
	
				let devData = client.getDevData();
				callback({"isSuccess": true, "devData": devData});
			}, () => {
				socket.disconnect(true);
			});
		});
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

module.exports = SocketIOServer;