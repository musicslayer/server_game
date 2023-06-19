const http = require("./server/http.js");
const socket_io = require("./server/socket_io.js");

const Client = require("./client/Client.js");
const ImageCatalog = require("./image/ImageCatalog.js");
const World = require("./world/World.js");
const EntitySpawner = require("./entity/EntitySpawner.js");

// TODO Animated sprites?
// TODO All state changes must be done through the Server class. We need to enforce this somehow.

// TODO Switch server from intervals to promises.
// --- Clicking to teleport is sometimes slow/laggy (Overall lag?)
// --- LOOT Time isn't exact  1min -> 1:20      5min -> 

async function init() {
    await ImageCatalog.loadImageCatalogFromFolder("assets/image/");

    let world = new World();
    world.loadWorldFromFolder("assets/world/");

    let player = EntitySpawner.spawn("player", 1, world.gameMaps[0].screens[0], 0, 0);
    const client = new Client(player);

    // Create servers to serve the web pages and communicate between front and back ends.
    const httpServer = http.createHTTPServer();
    //const httpsServer = https.createHTTPSServer();
    const io = socket_io.createSocketIOServer(httpServer, client);

    console.log("Server initialized successfully.");
}
init();