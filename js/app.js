const http = require("./server/http.js");
const socket_io = require("./server/socket_io.js");

const Client = require("./client/Client.js");
const EntitySpawner = require("./entity/EntitySpawner.js");
const Server = require("./server/Server.js");

// TODO All state changes must be done through the Server class. We need to enforce this somehow.
// TODO Handle multiple clients at once

// TODO entity limits should be per world, and should be on the World class instead of the Server class.
// TODO Track server/world gold
// TODO The server/world should have an entity spawner

// TODO On client, create separate channels for dev info...

// TODO use ?? in more places to clean up code.

async function init() {
    let server = new Server();
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