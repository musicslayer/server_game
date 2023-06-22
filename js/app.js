const http = require("./server/http.js");
const socket_io = require("./server/socket_io.js");

const Client = require("./client/Client.js");
const Server = require("./server/Server.js");

// TODO All state changes must be done through the Server class. We need to enforce this somehow.
// TODO Handle multiple clients at once

// TODO On client, create separate channels for dev info...

// TODO use ?? in more places to clean up code.

// TODO Do we need the "Client" class? Rename as inputHandler

async function init() {
    let server = new Server();
    server.createWorld(0, "world0", "assets/world0/");
    server.createWorld(1, "world1", "assets/world1/");
    server.initServerTick();
    
    let player = server.worlds[0].spawn("player", 1, server.worlds[0].gameMaps[0].screens[0], 0, 0);
    player.homeWorldName = "world0";
    player.homeMapName = "city";
    player.homeScreenName = "field1";
    player.homeX = 0;
    player.homeY = 0;

    let client = new Client(player);

    // Create servers to serve the web pages and communicate between front and back ends.
    let httpServer = http.createHTTPServer();
    //let httpsServer = https.createHTTPSServer();
    socket_io.createSocketIOServer(httpServer, client);

    console.log("Server initialized successfully.");
}
init();