const http = require("./server/http.js");
const socket_io = require("./server/socket_io.js");

const Client = require("./client/Client.js");
const EntitySpawner = require("./entity/EntitySpawner.js");
const Server = require("./server/Server.js");

// TODO All state changes must be done through the Server class. We need to enforce this somehow.
// TODO Handle multiple clients at once

// TODO Create one (non-static) Server, make server => world => map connection.
// TODO entity limits should be per world.

// TODO On client, create separate channels for dev info...

async function init() {
    let server = new Server();
    Server.SERVER = server;

    server.createWorld(0, "world0", "assets/world0/");
    server.createWorld(1, "world1", "assets/world1/");
    server.initServerTick();
    
    let player = EntitySpawner.spawn("player", 1, server.worlds[0].gameMaps[0].screens[0], 0, 0);
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