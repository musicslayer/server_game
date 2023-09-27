const IO = require("socket.io");

const Account = require("../account/Account.js");
const Character = require("../account/Character.js");
const Client = require("../client/Client.js");
const Constants = require("../constants/Constants.js");
const Entity = require("../entity/Entity.js");
const RateLimit = require("../security/RateLimit.js");
const Reflection = require("../reflection/Reflection.js");
const ServerTask = require("../server/ServerTask.js");

class SocketIOServer {
	server;

	accountManager;
    clientManager;
    serverManager;
	
	// Used to limit the amount of socket connections that an IP can form at once.
	numSocketsMap = new Map();

	constructor(httpServer, accountManager, clientManager, serverManager) {
		this.server = IO(httpServer.server, {
			// Use these options to only allow websockets and avoid memory leaks.
			allowUpgrades: false,
			transports: ["websocket"],

			// Use this so we don't serve clients extra files that we don't need.
			serveClient: false
		});

		this.accountManager = accountManager;
		this.clientManager = clientManager;
		this.serverManager = serverManager;

		this.attachConnectionListeners();
	}

	terminate() {
        this.server.close();
    }

	attachConnectionListeners() {
		this.server.on("connection", (socket) => {
			try {
				let ip = socket.handshake.address;
				let numSockets = this.numSocketsMap.get(ip) ?? 0;
				if(numSockets >= Constants.server.numAllowedSockets) {
					return;
				}
		
				numSockets++;
				this.numSocketsMap.set(ip, numSockets);
		
				socket.on("disconnect", (reason) => {
					try {
						let numSockets = this.numSocketsMap.get(ip);
						numSockets--;
						this.numSocketsMap.set(ip, numSockets);
					}
					catch(err) {
						console.error(err);
						socket.disconnect(true);
					}
				});
		
				this.attachAppListeners(socket);
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
			}
		});
	}

	attachAppListeners(socket) {
		let ip = socket.handshake.address;

		socket.on("on_account_creation", (username, hash, email, callback) => {
			try {
				if(RateLimit.isRateLimited("create_account", ip)) {
					socket.disconnect(true);
					return;
				}

				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}
				if(!validateStrings(username, hash, email)) {
					socket.disconnect(true);
					return;
				}

				let account = this.accountManager.getAccount(username);
				if(account) {
					// The account with this username already exists.
					callback({"isSuccess": false});
					return;
				}

				// Create a new account.
				let newAccount = new Account(username, hash, email);
				this.accountManager.addAccount(newAccount);

				callback({"isSuccess": true});
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
			}
		});

		socket.on("on_account_deletion", (username, hash, email, callback) => {
			try {
				if(RateLimit.isRateLimited("delete_account", ip)) {
					socket.disconnect(true);
					return;
				}

				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}
				if(!validateStrings(username, hash, email)) {
					socket.disconnect(true);
					return;
				}

				let account = this.accountManager.getAccount(username);
				if(!account) {
					// The account with this username does not exist.
					callback({"isSuccess": false});
					return;
				}

				if(account.hash !== hash) {
					// The account exists but this hash is wrong.
					callback({"isSuccess": false});
					return;
				}

				if(account.email !== email) {
					// The account exists but this email is wrong.
					callback({"isSuccess": false});
					return;
				}

				// Delete the account.
				this.accountManager.removeAccount(account);

				callback({"isSuccess": true});
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
			}
		});

		socket.on("on_character_creation", (username, hash, characterName, characterClass, callback) => {
			try {
				if(RateLimit.isRateLimited("create_character", ip)) {
					socket.disconnect(true);
					return;
				}

				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}
				if(!validateStrings(username, hash, characterName, characterClass)) {
					socket.disconnect(true);
					return;
				}

				let account = this.accountManager.getAccount(username);
				if(!account) {
					// The account with this username does not exist.
					callback({"isSuccess": false});
					return;
				}

				if(account.hash !== hash) {
					// The account exists but this hash is wrong.
					callback({"isSuccess": false});
					return;
				}

				if(!account.isEnabled) {
					// The account is disabled.
					callback({"isSuccess": false});
					return;
				}

				if(account.getCharacter(characterName)) {
					// The character already exists.
					callback({"isSuccess": false});
					return;
				}

				if(!Reflection.isSubclass(characterClass, "Player")) {
					callback({"isSuccess": false});
					return;
				}

				let player = Entity.createInstance(characterClass, 1);
				let character = new Character(characterName, player);
				account.addCharacter(character);

				callback({"isSuccess": true});
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
			}
		});

		socket.on("on_character_deletion", (username, hash, email, characterName, callback) => {
			try {
				if(RateLimit.isRateLimited("delete_character", ip)) {
					socket.disconnect(true);
					return;
				}

				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}
				if(!validateStrings(username, hash, email, characterName)) {
					socket.disconnect(true);
					return;
				}

				let account = this.accountManager.getAccount(username);
				if(!account) {
					// The account with this username does not exist.
					callback({"isSuccess": false});
					return;
				}

				if(account.hash !== hash) {
					// The account exists but this hash is wrong.
					callback({"isSuccess": false});
					return;
				}

				if(account.email !== email) {
					// The account exists but this email is wrong.
					callback({"isSuccess": false});
					return;
				}

				let character = account.getCharacter(characterName);
				if(!character) {
					// The character does not exist.
					callback({"isSuccess": false});
					return;
				}

				// Delete the character.
				account.removeCharacter(character);

				callback({"isSuccess": true});
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
			}
		});

		// TODO Rename "on_character_listing"?
		socket.on("on_character_select", (username, hash, callback) => {
			try {
				if(RateLimit.isRateLimited("select_character", ip)) {
					socket.disconnect(true);
					return;
				}

				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}
				if(!validateStrings(username, hash)) {
					socket.disconnect(true);
					return;
				}

				let account = this.accountManager.getAccount(username);
				if(!account) {
					// The account with this username does not exist.
					callback({"isSuccess": false});
					return;
				}

				if(account.hash !== hash) {
					// The account exists but this hash is wrong.
					callback({"isSuccess": false});
					return;
				}

				if(!account.isEnabled) {
					// The account is disabled.
					callback({"isSuccess": false});
					return;
				}

				// Return to the client a list of characters they can log in as.
				let characterNames = [];
				for(let characterName of account.characterMap.keys()) {
					characterNames.push(characterName);
				}

				callback({"isSuccess": true, "characterNames": characterNames});
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
			}
		});

		socket.on("on_login", (username, hash, characterName, serverName, worldName, callback) => {
			try {
				if(RateLimit.isRateLimited("login", ip)) {
					socket.disconnect(true);
					return;
				}

				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}
				if(!validateStrings(username, hash, characterName, serverName, worldName)) {
					socket.disconnect(true);
					return;
				}

				let account = this.accountManager.getAccount(username);
				if(!account) {
					// The account with this username does not exist.
					callback({"isSuccess": false});
					return;
				}

				if(account.hash !== hash) {
					// The account exists but this hash is wrong.
					callback({"isSuccess": false});
					return;
				}

				if(!account.isEnabled) {
					// The account is disabled.
					callback({"isSuccess": false});
					return;
				}

				let character = account.getCharacter(characterName);
				if(!character) {
					// The character does not exist.
					callback({"isSuccess": false});
					return;
				}

				// TODO Does this prevent a second login?
				if(this.clientManager.getClient(username, characterName)) {
					// The character on this account is already logged in.
					callback({"isSuccess": false});
					return;
				}

				let server = this.serverManager.getServerByName(serverName);
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

				let client = new Client(username, characterName, player);
				client.socket = socket;
				this.clientManager.addClient(client);

				player.client = client;

				socket.on("disconnect", (reason) => {
					let client = this.clientManager.getClient(username, characterName); 
					this.clientManager.removeClient(client);

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
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
			}
		});

		socket.on("on_change_password", (username, newHash, email, callback) => {
			try {
				if(RateLimit.isRateLimited("change_password", ip)) {
					socket.disconnect(true);
					return;
				}

				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}
				if(!validateStrings(username, newHash, email)) {
					socket.disconnect(true);
					return;
				}

				let account = this.accountManager.getAccount(username);
				if(!account) {
					// The account with this username does not exist.
					callback({"isSuccess": false});
					return;
				}

				if(account.email !== email) {
					// The account exists but this email is wrong.
					callback({"isSuccess": false});
					return;
				}

				if(account.hash === newHash) {
					// The new hash is the same as the old hash.
					callback({"isSuccess": false});
					return;
				}

				// Change the hash to the new one.
				account.hash = newHash;

				callback({"isSuccess": true});
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
			}
		});

		socket.on("on_change_email", (username, hash, currentEmail, newEmail, callback) => {
			try {
				if(RateLimit.isRateLimited("change_email", ip)) {
					socket.disconnect(true);
					return;
				}

				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}
				if(!validateStrings(username, hash, currentEmail, newEmail)) {
					socket.disconnect(true);
					return;
				}

				let account = this.accountManager.getAccount(username);
				if(!account) {
					// The account with this username does not exist.
					callback({"isSuccess": false});
					return;
				}

				if(account.hash !== hash) {
					// The account exists but this hash is wrong.
					callback({"isSuccess": false});
					return;
				}

				if(account.email !== currentEmail) {
					// The account exists but this email is wrong.
					callback({"isSuccess": false});
					return;
				}

				if(currentEmail === newEmail) {
					// The new email is the same as the old email.
					callback({"isSuccess": false});
					return;
				}

				// Change the email to the new one.
				account.email = newEmail;

				callback({"isSuccess": true});
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
			}
		});

		socket.on("on_forced_logout", (username, hash, email, callback) => {
			try {
				if(RateLimit.isRateLimited("force_logout", ip)) {
					socket.disconnect(true);
					return;
				}

				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}
				if(!validateStrings(username, hash, email)) {
					socket.disconnect(true);
					return;
				}

				let account = this.accountManager.getAccount(username);
				if(!account) {
					// The account with this username does not exist.
					callback({"isSuccess": false});
					return;
				}

				if(account.hash !== hash) {
					// The account exists but this hash is wrong.
					callback({"isSuccess": false});
					return;
				}

				if(account.email !== email) {
					// The account exists but this email is wrong.
					callback({"isSuccess": false});
					return;
				}

				// Log out all characters on this account that are currently logged in.
				for(let character of account.characters) {
					let client = this.clientManager.getClient(username, character.name);
					client?.socket.disconnect(true);
				}

				callback({"isSuccess": true});
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
			}
		});

		socket.on("on_enable_account", (username, hash, email, callback) => {
			try {
				if(RateLimit.isRateLimited("enable_account", ip)) {
					socket.disconnect(true);
					return;
				}

				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}
				if(!validateStrings(username, hash, email)) {
					socket.disconnect(true);
					return;
				}

				let account = this.accountManager.getAccount(username);
				if(!account) {
					// The account with this username does not exist.
					callback({"isSuccess": false});
					return;
				}

				if(account.hash !== hash) {
					// The account exists but this hash is wrong.
					callback({"isSuccess": false});
					return;
				}

				if(account.email !== email) {
					// The account exists but this email is wrong.
					callback({"isSuccess": false});
					return;
				}

				// Enable the account.
				account.isEnabled = true;

				callback({"isSuccess": true});
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
			}
		});

		socket.on("on_disable_account", (username, hash, email, callback) => {
			try {
				if(RateLimit.isRateLimited("disable_account", ip)) {
					socket.disconnect(true);
					return;
				}

				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}
				if(!validateStrings(username, hash, email)) {
					socket.disconnect(true);
					return;
				}

				let account = this.accountManager.getAccount(username);
				if(!account) {
					// The account with this username does not exist.
					callback({"isSuccess": false});
					return;
				}

				if(account.hash !== hash) {
					// The account exists but this hash is wrong.
					callback({"isSuccess": false});
					return;
				}

				if(account.email !== email) {
					// The account exists but this email is wrong.
					callback({"isSuccess": false});
					return;
				}

				// Disable the account and log out all characters on this account that are currently logged in.
				account.isEnabled = false;

				for(let character of account.characters) {
					let client = this.clientManager.getClient(username, character.name);
					client?.socket.disconnect(true);
				}

				callback({"isSuccess": true});
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
			}
		});
	}

	attachClientListeners(socket, client) {
		let ip = socket.handshake.address;

		socket.on("on_key_press", (keys, callback) => {
			try {
				if(RateLimit.isRateLimited("input", ip)) {
					socket.disconnect(true);
					return;
				}

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
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
			}
		});

		socket.on("on_controller_press", (buttons, callback) => {
			try {
				if(RateLimit.isRateLimited("input", ip)) {
					socket.disconnect(true);
					return;
				}

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
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
			}
		});

		socket.on("on_controller_sticks", (axes, callback) => {
			try {
				if(RateLimit.isRateLimited("input", ip)) {
					socket.disconnect(true);
					return;
				}

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
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
			}
		});

		socket.on("on_mouse_click", (button, location, info, callback) => {
			try {
				if(RateLimit.isRateLimited("input", ip)) {
					socket.disconnect(true);
					return;
				}

				if(!validateMouse(button, location, info)) {
					socket.disconnect(true);
					return;
				}

				client.onClick(button, location, info);
				callback();
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
			}
		});

		socket.on("on_mouse_drag", (button, location1, info1, location2, info2, callback) => {
			try {
				if(RateLimit.isRateLimited("input", ip)) {
					socket.disconnect(true);
					return;
				}

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
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
			}
		});
	
		socket.on("get_client_data", (callback) => {
			try {
				if(RateLimit.isRateLimited("data", ip)) {
					socket.disconnect(true);
					return;
				}

				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}

				let clientData = client.getClientData();
				callback({"isSuccess": true, "clientData": clientData});
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
			}
		});

		socket.on("get_dev_data", (callback) => {
			try {
				if(RateLimit.isRateLimited("dev", ip)) {
					socket.disconnect(true);
					return;
				}

				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}

				let devData = client.getDevData();
				callback({"isSuccess": true, "devData": devData});
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
			}
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