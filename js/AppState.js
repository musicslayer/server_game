const fs = require("fs");
const path = require("path");

const Constants = require("./constants/Constants.js");
const HTTPServer = require("./web/HTTPServer.js");
const SocketIOServer = require("./web/SocketIOServer.js");
const Zip = require("./zip/Zip.js");
const RateLimit = require("./security/RateLimit.js");
const Reflection = require("./reflection/Reflection.js");
const Secret = require("./security/Secret.js");
const DataBridge = require("./data/DataBridge.js");
const AccountManager = require("./account/AccountManager.js");
const ClientManager = require("./client/ClientManager.js");
const ServerFunction = require("./server/ServerFunction.js");
const ServerManager = require("./server/ServerManager.js");
const ServerTask = require("./server/ServerTask.js");
const UID = require("./uid/UID.js");

class AppState {
    accountManager;
    clientManager;
    serverManager;

    httpServer;
    socketIOServer;

    lastSaveFolder;
    
    async init() {
        // Validate up front that certain files and folders already exist and we have sufficient access to them.
        this.validateFilesAndFolders();

        // Recreate image zip file.
        await Zip.createZipFileFromFolder(Constants.path.ZIP_FILE, Constants.path.ZIP_SOURCE_FOLDER, 9);

        // Initialize static maps.
        RateLimit.init();
        Reflection.init();
        Secret.init();
        ServerFunction.init();
        UID.init();

        // Create initial managers.
        this.accountManager = AccountManager.createInitialAccountManager();
        this.clientManager = ClientManager.createInitialClientManager();
        this.serverManager = ServerManager.createInitialServerManager();

        let certificateData = {
            cert: Secret.getSecret("ssl_cert"),
            key: Secret.getSecret("ssl_key"),
            ca: Secret.getSecret("ssl_ca")
        };

        // Create servers to serve the web pages and communicate between front and back ends.
        this.httpServer = new HTTPServer(certificateData);
        await this.httpServer.listen();

        this.socketIOServer = new SocketIOServer(this.httpServer, this.accountManager, this.clientManager, this.serverManager);
    }

    terminate() {
        this.httpServer?.terminate();
        this.socketIOServer?.terminate();
    }

    validateFilesAndFolders() {
        // Note that the zip file may or may not exist at this point, but its parent folder should.
        let zipParentFolder = path.dirname(Constants.path.ZIP_FILE);

        if(!fs.existsSync(Constants.path.LOG_FOLDER)) {
            throw(new Error("LOG_FOLDER does not exist: " + Constants.path.LOG_FOLDER));
        }

        if(!fs.existsSync(Constants.path.SAVE_STATE_FOLDER)) {
            throw(new Error("SAVE_STATE_FOLDER does not exist: " + Constants.path.SAVE_STATE_FOLDER));
        }

        if(!fs.existsSync(zipParentFolder)) {
            throw(new Error("ZIP_FILE parent folder does not exist: " + zipParentFolder));
        }

        if(!fs.existsSync(Constants.path.ZIP_SOURCE_FOLDER)) {
            throw(new Error("ZIP_SOURCE_FOLDER does not exist: " + Constants.path.ZIP_SOURCE_FOLDER));
        }

        fs.accessSync(Constants.path.LOG_FOLDER, fs.constants.R_OK | fs.constants.W_OK);
        fs.accessSync(Constants.path.SAVE_STATE_FOLDER, fs.constants.R_OK | fs.constants.W_OK);
        fs.accessSync(Constants.path.ZIP_SOURCE_FOLDER, fs.constants.R_OK);
        fs.accessSync(zipParentFolder, fs.constants.R_OK | fs.constants.W_OK);
    }

    save() {
        let dateString = new Date().toISOString().replaceAll(":", "_").replace(".", "_");
        this.lastSaveFolder = path.join(Constants.path.SAVE_STATE_FOLDER, dateString);

        fs.mkdirSync(this.lastSaveFolder);

        // Save data to the files.
        let uidFileBase = path.join(this.lastSaveFolder, "uid");
        UID.serialize(uidFileBase);

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
        let uidFileBase = path.join(this.lastSaveFolder, "uid");
        UID.deserialize(uidFileBase);

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
            let client = this.clientManager.getClient(key); // TODO This key can no longer get the account...
            let newPlayer = this.accountManager.getAccount(key)?.getCharacter(client.playerName)?.player;

            client.player = newPlayer;

            if(newPlayer) {
                newPlayer.client = client;
            }
            else {
                // The player this client was pointing to before the load did not exist at the time the state was saved.
                // Since the player cannot be updated, just disconnect the client now.
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
                    let serverTask = new ServerTask(undefined, 0, 1, "despawn", player);
                    player.getServer().scheduleTask(serverTask);
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