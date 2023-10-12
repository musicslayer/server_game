const util = require("util");
const IO = require("socket.io");

const Account = require("../account/Account.js");
const Character = require("../account/Character.js");
const Client = require("../client/Client.js");
const Constants = require("../constants/Constants.js");
const Entity = require("../entity/Entity.js");
const Logger = require("../log/Logger.js");
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

	logger = new Logger("server");

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
						this.logServerError(err);
					}
				});
		
				this.attachAppListeners(socket);
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
				this.logServerError(err);
			}
		});
	}

	attachAppListeners(socket) {
		let ip = socket.handshake.address;

		socket.on("on_create_account", (username, hash, email, callback) => {
			try {
				if(RateLimit.isRateLimited("create_account", ip)) {
					socket.disconnect(true);
					return;
				}

				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}
				if(!validateStrings(username, email)) {
					socket.disconnect(true);
					return;
				}
				if(!validateHashString(hash)) {
					socket.disconnect(true);
					return;
				}

				let account = this.accountManager.getAccount(username);
				if(account) {
					callback({
						"isSuccess": false,
						"errString": "An account with this username already exists."
					});
					return;
				}

				// Create a new account.
				let newAccount = new Account(username, hash, email);
				this.accountManager.addAccount(newAccount);

				this.logServerEvent("create_account", ip, username, email); // Don't log hash
				callback({"isSuccess": true});
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
				this.logServerError(err);
			}
		});

		socket.on("on_delete_account", (username, hash, email, callback) => {
			try {
				if(RateLimit.isRateLimited("delete_account", ip)) {
					socket.disconnect(true);
					return;
				}

				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}
				if(!validateStrings(username, email)) {
					socket.disconnect(true);
					return;
				}
				if(!validateHashString(hash)) {
					socket.disconnect(true);
					return;
				}

				let account = this.accountManager.getAccount(username);
				if(!account) {
					callback({
						"isSuccess": false,
						"errString": "An account with this username does not exist."
					});
					return;
				}

				if(account.hash !== hash) {
					callback({
						"isSuccess": false,
						"errString": "The password is incorrect."
					});
					return;
				}

				if(account.email !== email) {
					callback({
						"isSuccess": false,
						"errString": "The email is incorrect."
					});
					return;
				}

				// Delete the account.
				this.accountManager.removeAccount(account);

				this.logServerEvent("delete_account", ip, username, email); // Don't log hash
				callback({"isSuccess": true});
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
				this.logServerError(err);
			}
		});

		socket.on("on_create_character", (username, hash, characterName, characterClass, callback) => {
			try {
				if(RateLimit.isRateLimited("create_character", ip)) {
					socket.disconnect(true);
					return;
				}

				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}
				if(!validateStrings(username, characterName, characterClass)) {
					socket.disconnect(true);
					return;
				}
				if(!validateHashString(hash)) {
					socket.disconnect(true);
					return;
				}

				let account = this.accountManager.getAccount(username);
				if(!account) {
					callback({
						"isSuccess": false,
						"errString": "An account with this username does not exist."
					});
					return;
				}

				if(account.hash !== hash) {
					callback({
						"isSuccess": false,
						"errString": "The password is incorrect."
					});
					return;
				}

				if(!account.isEnabled) {
					callback({
						"isSuccess": false,
						"errString": "The account is disabled."
					});
					return;
				}

				if(account.getCharacter(characterName)) {
					callback({
						"isSuccess": false,
						"errString": "A character with this name already exists on the account."
					});
					return;
				}

				if(!Reflection.isSubclass(characterClass, "Player")) {
					callback({
						"isSuccess": false,
						"errString": "The character class is invalid."
					});
					return;
				}

				let player = Entity.createInstance(characterClass, 1);
				let character = new Character(characterName, player);
				account.addCharacter(character);

				this.logServerEvent("create_character", ip, username, characterName, characterClass); // Don't log hash
				callback({"isSuccess": true});
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
				this.logServerError(err);
			}
		});

		socket.on("on_delete_character", (username, hash, email, characterName, callback) => {
			try {
				if(RateLimit.isRateLimited("delete_character", ip)) {
					socket.disconnect(true);
					return;
				}

				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}
				if(!validateStrings(username, email, characterName)) {
					socket.disconnect(true);
					return;
				}
				if(!validateHashString(hash)) {
					socket.disconnect(true);
					return;
				}

				let account = this.accountManager.getAccount(username);
				if(!account) {
					callback({
						"isSuccess": false,
						"errString": "An account with this username does not exist."
					});
					return;
				}

				if(account.hash !== hash) {
					callback({
						"isSuccess": false,
						"errString": "The password is incorrect."
					});
					return;
				}

				if(account.email !== email) {
					callback({
						"isSuccess": false,
						"errString": "The email is incorrect."
					});
					return;
				}

				let character = account.getCharacter(characterName);
				if(!character) {
					callback({
						"isSuccess": false,
						"errString": "A character with this name does not exist on the account."
					});
					return;
				}

				// Delete the character.
				account.removeCharacter(character);

				this.logServerEvent("delete_character", ip, username, email, characterName); // Don't log hash
				callback({"isSuccess": true});
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
				this.logServerError(err);
			}
		});

		socket.on("on_login_account", (username, hash, callback) => {
			try {
				if(RateLimit.isRateLimited("login_account", ip)) {
					socket.disconnect(true);
					return;
				}

				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}
				if(!validateStrings(username)) {
					socket.disconnect(true);
					return;
				}
				if(!validateHashString(hash)) {
					socket.disconnect(true);
					return;
				}

				let account = this.accountManager.getAccount(username);
				if(!account) {
					callback({
						"isSuccess": false,
						"errString": "An account with this username does not exist."
					});
					return;
				}

				if(account.hash !== hash) {
					callback({
						"isSuccess": false,
						"errString": "The password is incorrect."
					});
					return;
				}

				if(!account.isEnabled) {
					callback({
						"isSuccess": false,
						"errString": "The account is disabled."
					});
					return;
				}

				// Return to the client:
				// - Information from when the account was last logged in.
				// - All available servers and their worlds, not including generator worlds.
				// - A list of character names and whether they are already logged in.
				let accountData = {
					lastServerName: account.lastServerName,
					lastWorldName: account.lastWorldName,
					lastCharacterName: account.lastCharacterName
				};

				let serverData = [];
				for(let server of this.serverManager.servers) {
					let worldData = [];
					for(let world of server.universe.worlds) {
						if(!world.isGeneratorWorld) {
							worldData.push({
								name: world.name,
								playerCount: world.playerCount,
								maxPlayerCount: world.maxPlayerCount
							});
						}
					}

					serverData.push({
						name: server.name,
						worldData: worldData
					});
				}

				let characterData = [];
				for(let characterName of account.characterMap.keys()) {
					characterData.push({
						name: characterName,
						isLoggedIn: this.clientManager.getClient(username, characterName) !== undefined
					});
				}

				this.logServerEvent("login_account", ip, username); // Don't log hash

				callback({
					"isSuccess": true, 
					"accountData": accountData,
					"serverData": serverData,
					"characterData": characterData
				});
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
				this.logServerError(err);
			}
		});

		socket.on("on_login_character", (username, hash, characterName, serverName, worldName, callback) => {
			try {
				if(RateLimit.isRateLimited("login_character", ip)) {
					socket.disconnect(true);
					return;
				}

				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}
				if(!validateStrings(username, characterName, serverName, worldName)) {
					socket.disconnect(true);
					return;
				}
				if(!validateHashString(hash)) {
					socket.disconnect(true);
					return;
				}

				let account = this.accountManager.getAccount(username);
				let isDevAccount = account.isDevAccount;

				if(!account) {
					callback({
						"isSuccess": false,
						"errString": "An account with this username does not exist."
					});
					return;
				}

				if(account.hash !== hash) {
					callback({
						"isSuccess": false,
						"errString": "The password is incorrect."
					});
					return;
				}

				if(!account.isEnabled) {
					callback({
						"isSuccess": false,
						"errString": "The account is disabled."
					});
					return;
				}

				let character = account.getCharacter(characterName);
				if(!character) {
					callback({
						"isSuccess": false,
						"errString": "A character with this name does not exist on the account."
					});
					return;
				}

				if(this.clientManager.getClient(username, characterName)) {
					callback({
						"isSuccess": false,
						"errString": "The character is already logged in."
					});
					return;
				}

				let server = this.serverManager.getServerByName(serverName);
				if(!server) {
					callback({
						"isSuccess": false,
						"errString": "The server does not exist."
					});
					return;
				}

				let world = server.universe.getWorldByName(worldName);
				if(!world) {
					callback({
						"isSuccess": false,
						"errString": "The world does not exist."
					});
					return;
				}
				if(world.isFull() && !isDevAccount) {
					callback({
						"isSuccess": false,
						"errString": "The world is full."
					});
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

					// Set the player's home location to the tutorial screen.
					player.homeMapName = screen.map.name;
					player.homeScreenName = screen.name;
					player.homeX = 0;
					player.homeY = 0;
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

				let client = new Client(account.isDevAccount, username, characterName, player);
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
							if(!isDevAccount) {
								client.player.screen.map.world.playerCount--;
							}
						}

						client.player.client = undefined;
						client.player = undefined;
					}

					this.logServerEvent("logout_character", ip, username, characterName, serverName, worldName); // Don't log hash
				});

				this.attachClientListeners(socket, client);

				// Update the account's last values.
				account.lastServerName = serverName;
				account.lastWorldName = worldName;
				account.lastCharacterName = characterName;

				// Update world population count.
				if(!isDevAccount) {
					world.playerCount++;
				}

				this.logServerEvent("login_character", ip, username, characterName, serverName, worldName); // Don't log hash
				callback({"isSuccess": true});
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
				this.logServerError(err);
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
				if(!validateStrings(username, email)) {
					socket.disconnect(true);
					return;
				}
				if(!validateHashString(newHash)) {
					socket.disconnect(true);
					return;
				}

				let account = this.accountManager.getAccount(username);
				if(!account) {
					callback({
						"isSuccess": false,
						"errString": "An account with this username does not exist."
					});
					return;
				}

				if(account.email !== email) {
					callback({
						"isSuccess": false,
						"errString": "The email is incorrect."
					});
					return;
				}

				if(account.hash === newHash) {
					callback({
						"isSuccess": false,
						"errString": "The new password is the same as the old password."
					});
					return;
				}

				// Change the hash to the new one.
				account.hash = newHash;

				this.logServerEvent("change_password", ip, username, email); // Don't log hash
				callback({"isSuccess": true});
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
				this.logServerError(err);
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
				if(!validateStrings(username, currentEmail, newEmail)) {
					socket.disconnect(true);
					return;
				}
				if(!validateHashString(hash)) {
					socket.disconnect(true);
					return;
				}

				let account = this.accountManager.getAccount(username);
				if(!account) {
					callback({
						"isSuccess": false,
						"errString": "An account with this username does not exist."
					});
					return;
				}

				if(account.hash !== hash) {
					callback({
						"isSuccess": false,
						"errString": "The password is incorrect."
					});
					return;
				}

				if(account.email !== currentEmail) {
					callback({
						"isSuccess": false,
						"errString": "The email is incorrect."
					});
					return;
				}

				if(currentEmail === newEmail) {
					callback({
						"isSuccess": false,
						"errString": "The new email is the same as the old email."
					});
					return;
				}

				// Change the email to the new one.
				account.email = newEmail;

				this.logServerEvent("change_email", ip, username, currentEmail, newEmail); // Don't log hash
				callback({"isSuccess": true});
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
				this.logServerError(err);
			}
		});

		socket.on("on_logout_account", (username, hash, email, callback) => {
			try {
				if(RateLimit.isRateLimited("logout_account", ip)) {
					socket.disconnect(true);
					return;
				}

				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}
				if(!validateStrings(username, email)) {
					socket.disconnect(true);
					return;
				}
				if(!validateHashString(hash)) {
					socket.disconnect(true);
					return;
				}

				let account = this.accountManager.getAccount(username);
				if(!account) {
					callback({
						"isSuccess": false,
						"errString": "An account with this username does not exist."
					});
					return;
				}

				if(account.hash !== hash) {
					callback({
						"isSuccess": false,
						"errString": "The password is incorrect."
					});
					return;
				}

				if(account.email !== email) {
					callback({
						"isSuccess": false,
						"errString": "The email is incorrect."
					});
					return;
				}

				// Log out all characters on this account that are currently logged in.
				for(let character of account.characters) {
					let client = this.clientManager.getClient(username, character.name);
					client?.socket.disconnect(true);
				}

				this.logServerEvent("logout_account", ip, username, email); // Don't log hash
				callback({"isSuccess": true});
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
				this.logServerError(err);
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
				if(!validateStrings(username, email)) {
					socket.disconnect(true);
					return;
				}
				if(!validateHashString(hash)) {
					socket.disconnect(true);
					return;
				}

				let account = this.accountManager.getAccount(username);
				if(!account) {
					callback({
						"isSuccess": false,
						"errString": "An account with this username does not exist."
					});
					return;
				}

				if(account.hash !== hash) {
					callback({
						"isSuccess": false,
						"errString": "The password is incorrect."
					});
					return;
				}

				if(account.email !== email) {
					callback({
						"isSuccess": false,
						"errString": "The email is incorrect."
					});
					return;
				}

				// Enable the account.
				account.isEnabled = true;

				this.logServerEvent("enable_account", ip, username, email); // Don't log hash
				callback({"isSuccess": true});
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
				this.logServerError(err);
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
				if(!validateStrings(username, email)) {
					socket.disconnect(true);
					return;
				}
				if(!validateHashString(hash)) {
					socket.disconnect(true);
					return;
				}

				let account = this.accountManager.getAccount(username);
				if(!account) {
					callback({
						"isSuccess": false,
						"errString": "An account with this username does not exist."
					});
					return;
				}

				if(account.hash !== hash) {
					callback({
						"isSuccess": false,
						"errString": "The password is incorrect."
					});
					return;
				}

				if(account.email !== email) {
					callback({
						"isSuccess": false,
						"errString": "The email is incorrect."
					});
					return;
				}

				// Disable the account and log out all characters on this account that are currently logged in.
				account.isEnabled = false;

				for(let character of account.characters) {
					let client = this.clientManager.getClient(username, character.name);
					client?.socket.disconnect(true);
				}

				this.logServerEvent("disable_account", ip, username, email); // Don't log hash
				callback({"isSuccess": true});
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
				this.logServerError(err);
			}
		});

		socket.on("on_get_character_classes", (username, hash, callback) => {
			try {
				if(RateLimit.isRateLimited("get_character_classes", ip)) {
					socket.disconnect(true);
					return;
				}

				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}
				if(!validateStrings(username)) {
					socket.disconnect(true);
					return;
				}
				if(!validateHashString(hash)) {
					socket.disconnect(true);
					return;
				}

				let account = this.accountManager.getAccount(username);
				if(!account) {
					callback({
						"isSuccess": false,
						"errString": "An account with this username does not exist."
					});
					return;
				}

				if(account.hash !== hash) {
					callback({
						"isSuccess": false,
						"errString": "The password is incorrect."
					});
					return;
				}

				// Return to the client a list of available character classes.
				let characterClassData = [];
				for(let characterClass of Reflection.getSubclasses("Player")) {
					characterClassData.push({
						name: characterClass
					});
				}

				callback({
					"isSuccess": true, 
					"characterClassData": characterClassData
				});
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
				this.logServerError(err);
			}
		});
	}

	attachClientListeners(socket, client) {
		let ip = socket.handshake.address;

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

				client.onMouseClick(button, location, info);
				callback();
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
				this.logServerError(err);
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

				client.onMouseDrag(button, location1, info1, location2, info2);
				callback();
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
				this.logServerError(err);
			}
		});

		socket.on("on_keys", (keys, callback) => {
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

				client.onKeys(keys);
				callback();
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
				this.logServerError(err);
			}
		});

		socket.on("on_gamepad_buttons", (buttons, callback) => {
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

				client.onGamepadButtons(buttons);
				callback();
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
				this.logServerError(err);
			}
		});

		socket.on("on_gamepad_axes", (axes, callback) => {
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

				client.onGamepadAxes(axes);
				callback();
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
				this.logServerError(err);
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
				this.logServerError(err);
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
				this.logServerError(err);
			}
		});
	}

	logServerEvent(eventName, ...infoArgs) {
		this.logger.logInfo("ServerEvent", eventName, ...infoArgs);
	}

	logServerError(err) {
		let errString = util.format("%s", err);
		this.logger.logError("ServerError", "error", errString);
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
		return info.length === 1;
	}
	else {
		return false;
	}
}

function validateStrings(...args) {
	return isStringArray(args, 5) && args.every((v) => v.length <= 40);
}

function validateHashString(value) {
	return isString(value) && value.length === 128;
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