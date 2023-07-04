const fs = require("fs");

const http = require("./web/http.js");
const socket_io = require("./web/socket_io.js");

const Zip = require("./zip/Zip.js");
const Reflection = require("./reflection/Reflection.js");
const DataBridge = require("./data/DataBridge.js");
const AccountManager = require("./account/AccountManager.js");
const ServerManager = require("./server/ServerManager.js");

class AppState {
    static instance;

    serverManager;
    accountManager;

    accountFile;
    serverFile;

    // Map of all currently logged in users.
    clientMap = new Map();

    constructor() {
        AppState.instance = this;
    }
    
    async init() {
        // Recreate image zip file.
        await Zip.createZipFileFromFolder("assets/image.zip", "assets/image/");

        // Initialize factory classes.
        Reflection.init();

        // Create initial player accounts and servers.
        this.accountManager = AccountManager.createInitialAccountManager();
        this.serverManager = ServerManager.createInitialServerManager();

        // Create servers to serve the web pages and communicate between front and back ends.
        let httpServer = http.createHTTPServer();
        //let httpsServer = https.createHTTPSServer();
        socket_io.createSocketIOServer(httpServer, this);
    }

    save() {
        let dateString = new Date().toISOString().replaceAll(":", "_").replace(".", "_");

        this.accountFile = "save_states/account/" + dateString + ".txt";
        this.serverFile = "save_states/server/" + dateString + ".txt";

        let accountManagerString = DataBridge.serializeObject(this.accountManager);
        fs.writeFileSync(this.accountFile, accountManagerString, "ascii");

        let serverManagerString = DataBridge.serializeObject(this.serverManager);
        fs.writeFileSync(this.serverFile, serverManagerString, "ascii");
    }

    load() {
        this.serverManager.endServerTicks();

        let accountManagerString = fs.readFileSync(this.accountFile, "ascii");
        this.accountManager = DataBridge.deserializeObject(accountManagerString, "AccountManager");

        let serverManagerString = fs.readFileSync(this.serverFile, "ascii");
        this.serverManager = DataBridge.deserializeObject(serverManagerString, "ServerManager");

        // Update logged in players to be on the same screens but in the new servers.
        this.refreshClients();

        // Schedule the task to spawn all the entities and then start the new servers' ticks.
        this.serverManager.addSpawnServerTask();
        this.serverManager.startServerTicks();
    }

    refreshClients() {
        for(let key of this.clientMap.keys()) {
            let client = this.clientMap.get(key);

            // Reset this manually because server tasks to do this may have been cancelled.
            client.delayMap = new Map(); // TODO remove?

            let newPlayer = this.accountManager.getAccount(key).getCharacter(client.playerName);

            let newServer = this.serverManager.getServerByName(newPlayer.serverName);
            let newWorld = newServer?.universe?.getWorldByName(newPlayer.worldName);
            let newMap = newWorld?.getMapByName(newPlayer.mapName);
            let newScreen = newMap?.getScreenByPosition(newPlayer.screenX, newPlayer.screenY);

            // TODO If the player moves onto a screen that didn't exist when the server was saved, we need a fallback strategy.

            newPlayer.screen = newScreen;
            newScreen.addEntity(newPlayer);

            client.player = newPlayer;
        }
    }
}

module.exports = AppState;