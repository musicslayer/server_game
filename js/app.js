const http = require("./server/http.js");
const socket_io = require("./server/socket_io.js");

const Client = require("./client/Client.js");
const Player = require("./entity/Player.js");
const EntitySpawner = require("./entity/EntitySpawner.js");
const ImageCatalog = require("./image/ImageCatalog.js");
const World = require("./world/World.js");

async function init() {
    await ImageCatalog.loadImageCatalogFromFolder("assets/image/");
    let world = await World.loadWorldFromFolder("assets/world/");

    EntitySpawner.spawnWorld(world);

    let player = new Player();
    player.spawn(world, world.gameMaps[0], world.gameMaps[0].screens[0], 0, 0);

    const client = new Client(world, player);

    // Create servers to serve the web pages and communicate between front and back ends.
    const httpServer = http.createHTTPServer();
    //const httpsServer = https.createHTTPSServer();
    const io = socket_io.createSocketIOServer(httpServer, client);

    console.log("Server initialized successfully.");
}
init();