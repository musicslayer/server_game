const fs = require("fs");

const http = require("./web/http.js");
const socket_io = require("./web/socket_io.js");

const ClientFactory = require("./client/ClientFactory.js");
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

    dataMap = new Map();
    setMap(clientKey, clientMap) {
        let data = {};
        for(let key of clientMap.keys()) {
            data[key] = clientMap.get(key);
        }
        this.dataMap.set(clientKey, data)
    }
    getMap(clientKey) {
        let map = new Map();
        let data = this.dataMap.get(clientKey);
        for(let key in data) {
            map.set(key, data[key]);
        }
        return map;
    }

    save() {
        let dateString = new Date().toISOString().replaceAll(":", "_").replace(".", "_");

        this.accountFile = "save_states/account/" + dateString + ".txt";
        this.serverFile = "save_states/server/" + dateString + ".txt";

        let accountManagerString = DataBridge.serializeObject(this.accountManager);
        fs.writeFileSync(this.accountFile, accountManagerString, "ascii");

        let serverManagerString = DataBridge.serializeObject(this.serverManager);
        fs.writeFileSync(this.serverFile, serverManagerString, "ascii");

        // Save client delay maps.
        for(let key of ClientFactory.clientKeyMap.keys()) {
            let client = ClientFactory.clientKeyMap.get(key);
            this.setMap(key, client.delayMap);
        }
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
        this.serverManager.startServerTicks();
    }

    refreshClients() {
        for(let key of ClientFactory.clientKeyMap.keys()) {
            let client = ClientFactory.clientKeyMap.get(key);
            client.delayMap = this.getMap(key);

            let newPlayer = this.accountManager.getAccount(key).getCharacter(client.playerName);
            let newServer = this.serverManager.getServerByName(newPlayer.screenInfo.serverName);
            let newWorld = newServer?.universe?.getWorldByName(newPlayer.screenInfo.worldName);
            let newMap = newWorld?.getMapByName(newPlayer.screenInfo.mapName);
            let newScreen = newMap?.getScreenByPosition(newPlayer.screenInfo.screenX, newPlayer.screenInfo.screenY);

            if(!newScreen) {
                // Teleport the entity to the fallback map.
                // Since the client is still logged in, we know its serverName and worldName actually exist.
                let clientServer = this.serverManager.getServerByName(client.serverName);
                let clientWorld = clientServer.universe.getWorldByName(client.worldName);
                let fallbackMap = clientWorld.getMapByPosition("fallback");
                newScreen = fallbackMap.getScreenByPosition(0, 0);

                newPlayer.x = 7;
                newPlayer.y = 11;
            }

            newPlayer.screen = newScreen;
            newScreen.addEntity(newPlayer);

            client.player = newPlayer;
        }
    }
}

module.exports = AppState;