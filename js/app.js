const http = require("./server/http.js");
const socket_io = require("./server/socket_io.js");

const Client = require("./client/Client.js");
//const ImageCatalog = require("./image/ImageCatalog.js");
const World = require("./world/World.js");
const EntitySpawner = require("./entity/EntitySpawner.js");
const Server = require("./server/Server.js");

// TODO Animated sprites?
// TODO All state changes must be done through the Server class. We need to enforce this somehow.
// TODO Move worker_task file to be somewhere better.

// TODO Switch server and client image update to threads.
// TODO Transmit less data so client can draw image itself and save server time.

// TODO When a player clicks, they should just send the server the purse/slot/tile

// TODO pvp_token vs token_pvp

async function init() {
    //await ImageCatalog.loadImageCatalogFromFolder("assets/image/");

    let world = new World();
    world.loadWorldFromFolder("assets/world/");

    let player = EntitySpawner.spawn("player", 1, world.gameMaps[0].screens[0], 0, 0);
    const client = new Client(player);

    // Create servers to serve the web pages and communicate between front and back ends.
    const httpServer = http.createHTTPServer();
    //const httpsServer = https.createHTTPSServer();
    const io = socket_io.createSocketIOServer(httpServer, client);

    Server.init(player);

    console.log("Server initialized successfully.");
}
init();