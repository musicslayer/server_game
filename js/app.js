const http = require("./server/http.js");
const socket_io = require("./server/socket_io.js");

const Client = require("./client/Client.js");
const World = require("./world/World.js");
const EntitySpawner = require("./entity/EntitySpawner.js");
const Server = require("./server/Server.js");

// TODO Animated sprites?
// TODO All state changes must be done through the Server class. We need to enforce this somehow.
// TODO display info about item when clicking on it instead of teleport?
// TODO Handle multiple clients at once

async function init() {
    let world = new World();
    world.loadWorldFromFolder("assets/world/");

    let player = EntitySpawner.spawn("player", 1, world.gameMaps[0].screens[0], 0, 0);
    let client = new Client(player);

    // Create servers to serve the web pages and communicate between front and back ends.
    let httpServer = http.createHTTPServer();
    //let httpsServer = https.createHTTPSServer();
    socket_io.createSocketIOServer(httpServer, client);

    Server.initServerTick();

    console.log("Server initialized successfully.");
}
init();