const http = require("./server/http.js");
const socket_io = require("./server/socket_io.js");

const AccountManager = require("./account/AccountManager.js");
const Server = require("./server/Server.js");

// TODO All state changes must be done through the Server class. We need to enforce this somehow.

// TODO Players that die should drop their inventory if they are in PVP zone?
// TODO How to save/load server state?

// Players should block movement? Do we need variables like "isTangible"

async function init() {
    // Load game server
    let server = new Server();
    server.createWorld(0, "world0", "assets/world0/");
    server.createWorld(1, "world1", "assets/world1/");
    server.initServerTick();
    
    let accountManager = AccountManager.createInitialAccountManager(server);

    // Create servers to serve the web pages and communicate between front and back ends.
    let httpServer = http.createHTTPServer();
    //let httpsServer = https.createHTTPSServer();
    socket_io.createSocketIOServer(httpServer, accountManager);

    console.log("Server initialized successfully.");
}
init();