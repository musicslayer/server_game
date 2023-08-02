const fs = require("fs");
const path = require("path");

const http = require("./web/http.js");
const socket_io = require("./web/socket_io.js");
const Zip = require("./zip/Zip.js");
const Reflection = require("./reflection/Reflection.js");
const DataBridge = require("./data/DataBridge.js");
const AccountManager = require("./account/AccountManager.js");
const ClientManager = require("./client/ClientManager.js");
const ServerManager = require("./server/ServerManager.js");
const ServerTask = require("./server/ServerTask.js");
const UID = require("./uid/UID.js");

const SAVE_STATE_FOLDER = path.resolve("save_states");
const ZIP_SOURCE_FOLDER = path.resolve(path.join("assets", "image"));
const ZIP_FILE_PATH = path.resolve(path.join("assets", "image.zip"));

class AppState {
    accountManager;
    clientManager;
    serverManager;

    lastSaveFolder;
    
    async init() {
        // Validate up front that certain files and folders already exist and we have sufficient access to them.
        this.validateFilesAndFolders();

        // Recreate image zip file.
        await Zip.createZipFileFromFolder(ZIP_FILE_PATH, ZIP_SOURCE_FOLDER);

        // Initialize reflection class map.
        Reflection.init();

        // Create initial managers.
        this.accountManager = AccountManager.createInitialAccountManager();
        this.clientManager = ClientManager.createInitialClientManager();
        this.serverManager = ServerManager.createInitialServerManager();

        // Create servers to serve the web pages and communicate between front and back ends.
        let httpServer = http.createHTTPServer();
        //let httpsServer = https.createHTTPSServer();
        socket_io.createSocketIOServer(httpServer, this);
    }

    validateFilesAndFolders() {
        if(!fs.existsSync(SAVE_STATE_FOLDER)) {
            throw("SAVE_STATE_FOLDER does not exist: " + SAVE_STATE_FOLDER);
        }

        if(!fs.existsSync(ZIP_SOURCE_FOLDER)) {
            throw("ZIP_SOURCE_FOLDER does not exist: " + ZIP_SOURCE_FOLDER);
        }

        // The zip file may or may not exist at this point.

        fs.accessSync(SAVE_STATE_FOLDER, fs.constants.R_OK | fs.constants.W_OK);
        fs.accessSync(ZIP_SOURCE_FOLDER, fs.constants.R_OK);
        fs.accessSync(path.dirname(ZIP_FILE_PATH), fs.constants.R_OK | fs.constants.W_OK);
    }

    save() {
        let dateString = new Date().toISOString().replaceAll(":", "_").replace(".", "_");
        this.lastSaveFolder = path.join(SAVE_STATE_FOLDER, dateString);

        fs.mkdirSync(this.lastSaveFolder);

        let currentUIDFile = path.join(this.lastSaveFolder, "currentUID.txt");
        DataBridge.serializeMap(currentUIDFile, UID.currentUIDMap);

        let entityFile = path.join(this.lastSaveFolder, "entity.txt");
        DataBridge.serializeMap(entityFile, UID.uidMap.get("Entity"));

        let accountFile = path.join(this.lastSaveFolder, "account.txt");
        DataBridge.serialize(accountFile, this.accountManager);

        let serverFile = path.join(this.lastSaveFolder, "server.txt");
        DataBridge.serialize(serverFile, this.serverManager);
    }

    load() {
        // Load from the most recently created files.
        if(!this.lastSaveFolder) {
            return;
        }

        // Before loading data:
        // - Halt all existing servers.
        this.serverManager.endServerTicks();

        // Load data from the files.
        let currentUIDFile = path.join(this.lastSaveFolder, "currentUID.txt");
        UID.currentUIDMap = DataBridge.deserializeMap(currentUIDFile, "String", "Number");

        let entityFile = path.join(this.lastSaveFolder, "entity.txt");
        UID.uidMap.set("Entity", DataBridge.deserializeMap(entityFile, "Number", "Entity"))

        let accountFile = path.join(this.lastSaveFolder, "account.txt");
        this.accountManager = DataBridge.deserialize(accountFile, "AccountManager");

        let serverFile = path.join(this.lastSaveFolder, "server.txt");
        this.serverManager = DataBridge.deserialize(serverFile, "ServerManager");

        // After loading data:
        // - Refresh all clients and players that are currently logged in.
        // - Despawn players with logged out clients, and log out clients with despawned players.
        this.refresh();
        this.close();

        // Start the new servers' ticks.
        this.serverManager.startServerTicks();
    }

    refresh() {
        // Each client needs to point to an updated player, and vice versa.
        for(let key of this.clientManager.clientMap.keys()) {
            let client = this.clientManager.getClient(key);
            let newPlayer = this.accountManager.getAccount(key)?.getCharacter(client.playerName)?.player;

            client.player = newPlayer;

            if(newPlayer) {
                newPlayer.client = client;
            }
            else {
                // The player this client pointed to no longer exists and thus cannot be updated. Just disconnect the client now.
                client.socket.disconnect(true);
            }
        }
    }

    close() {
        for(let account of this.accountManager.accounts) {
            for(let key of account.characterMap.keys()) {
                let player = account.getCharacter(key).player;

                if(player.isSpawned && !player.client) {
                    // If a player is spawned but the client is no longer logged in, then despawn the player.
                    let serverTask = new ServerTask((player) => {
                        player.doDespawn();
                    }, player);
    
                    player.getServer().scheduleTask(undefined, 0, 1, serverTask);
                }
                else if(!player.isSpawned && player.client) {
                    // If a player is not spawned but the client is logged in, then log out the client.
                    player.client.socket.disconnect(true);
                }
            }
        }
    }
}

module.exports = AppState;