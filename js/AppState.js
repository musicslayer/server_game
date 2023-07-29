const http = require("./web/http.js");
const socket_io = require("./web/socket_io.js");

const Zip = require("./zip/Zip.js");
const Reflection = require("./reflection/Reflection.js");
const DataBridge = require("./data/DataBridge.js");
const AccountManager = require("./account/AccountManager.js");
const ClientManager = require("./client/ClientManager.js");
const ServerManager = require("./server/ServerManager.js");
const UID = require("./uid/UID.js");

class AppState {
    static instance;

    accountManager;
    clientManager;
    serverManager;

    accountFile;
    serverFile;

    constructor() {
        AppState.instance = this;
    }
    
    async init() {
        // Recreate image zip file.
        await Zip.createZipFileFromFolder("assets/image.zip", "assets/image/");

        // Initialize factory classes.
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

    save() {
        let dateString = new Date().toISOString().replaceAll(":", "_").replace(".", "_");

        this.accountFile = "save_states/account/" + dateString + ".txt";
        DataBridge.serializeObject(this.accountManager, this.accountFile);

        this.serverFile = "save_states/server/" + dateString + ".txt";
        DataBridge.serializeObject(this.serverManager, this.serverFile);
    }

    load() {
        // Load from the most recently created files.

        // Before loading data:
        // - Halt all existing servers.
        // - Reset all the UID maps.
        this.serverManager.endServerTicks();
        UID.reset();

        // Load data from the files.
        this.accountManager = DataBridge.deserializeObject("AccountManager", this.accountFile);
        this.serverManager = DataBridge.deserializeObject("ServerManager", this.serverFile);

        // After loading data:
        // - Refresh all clients that are currently logged in.
        // - Refresh all players' screens.
        // - Log out all of the clients.
        // - Log out all of the players.
        this.refreshClients();
        this.refreshPlayers();
        this.logOutClients();
        this.logOutPlayers();

        // Start the new servers' ticks.
        this.serverManager.startServerTicks();
    }

    refreshClients() {
        // Each client needs to point to an updated player.
        for(let key of this.clientManager.clientMap.keys()) {
            let client = this.clientManager.getClient(key);
            let newPlayer = this.accountManager.getAccount(key).getCharacter(client.playerName);
            client.player = newPlayer;
        }
    }

    refreshPlayers() {
        // Each player needs to point to an updated screen.
        for(let account of this.accountManager.accounts) {
            for(let key of account.characterMap.keys()) {
                let player = account.getCharacter(key);
                if(!player.screenInfo) {
                    // The player has never logged in so it was never spawned on any screen.
                    continue;
                }

                let newServer = this.serverManager.getServerByName(player.screenInfo.serverName);
                let newWorld = newServer?.universe?.getWorldByName(player.screenInfo.worldName);
                let newMap = newWorld?.getMapByName(player.screenInfo.mapName);
                let newScreen = newMap?.getScreenByPosition(player.screenInfo.screenX, player.screenInfo.screenY);

                if(!newScreen) {
                    // Teleport the entity to the fallback map.
                    // Since the client is still logged in, we know its serverName and worldName actually exist.
                    let clientServer = this.serverManager.getServerByName(client.serverName);
                    let clientWorld = clientServer.universe.getWorldByName(client.worldName);
                    let fallbackMap = clientWorld.getMapByPosition("fallback");

                    newScreen = fallbackMap.getScreenByPosition(0, 0);
                    player.x = 7;
                    player.y = 11;
                }

                player.screen = newScreen;
                newScreen.addEntity(player);
            }
        }
    }

    logOutClients() {
        for(let key of this.clientManager.clientMap.keys()) {
            let client = this.clientManager.getClient(key);
            client.socket.disconnect(true);
        }

        this.clientManager.clientMap = new Map();
    }

    logOutPlayers() {
        for(let account of this.accountManager.accounts) {
            for(let key of account.characterMap.keys()) {
                let player = account.getCharacter(key);

                if(player.isSpawned) {
                    // TODO Should this be scheduled? If there was a client, it would have been scheduled!
                    player.doDespawn();
                }
            }
        }
    }
}

module.exports = AppState;