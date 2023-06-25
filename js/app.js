const http = require("./server/http.js");
const socket_io = require("./server/socket_io.js");

const AccountManager = require("./account/AccountManager.js");
const Galaxy = require("./world/Galaxy.js");
const Server = require("./server/Server.js");
const Util = require("./util/Util.js");

// TODO All state changes must be done through the Server class. We need to enforce this somehow.
// TODO How to save/load server state?

// TODO Store both void and death map, then we can clone void map and not need to store the void map folder.

async function init() {
    // Recreate image zip file.
    await Util.createZipFileFromFolder("assets/image.zip", "assets/image/");

    // Load game server and the game galaxy.
    let server = new Server();
    server.initServerTick();

    let galaxy = new Galaxy();
    galaxy.server = server;
    galaxy.loadGalaxyFromFolder("assets/galaxy/");
    
    let accountManager = AccountManager.createInitialAccountManager(galaxy);

    // Create servers to serve the web pages and communicate between front and back ends.
    let httpServer = http.createHTTPServer();
    //let httpsServer = https.createHTTPSServer();
    socket_io.createSocketIOServer(httpServer, accountManager);

    console.log("Server initialized successfully.");

    setTimeout(() => {
        console.log("Server State Saved.");
    }, 10000);
}
init();