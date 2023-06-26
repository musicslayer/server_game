const http = require("./server/http.js");
const socket_io = require("./server/socket_io.js");

const AccountManager = require("./account/AccountManager.js");
const Galaxy = require("./world/Galaxy.js");
const Server = require("./server/Server.js");
const Util = require("./util/Util.js");

// TODO All state changes must be done through the Server class. We need to enforce this somehow.
// TODO How to save/load server state?

// TODO How do we save the server currentTick and current tasks?
// TODO Should we update entity counter (or maybe just get rid of it!)

// TODO Why create new instances when loading from folder.

async function init() {
    // Recreate image zip file.
    await Util.createZipFileFromFolder("assets/image.zip", "assets/image/");

    // Load game server and the game galaxy.
    let server = new Server();

    let galaxy = new Galaxy();
    galaxy.server = server;
    galaxy.loadGalaxyFromFolder("assets/galaxy/");
    
    let accountManager = AccountManager.createInitialAccountManager(galaxy);

    // Create servers to serve the web pages and communicate between front and back ends.
    let httpServer = http.createHTTPServer();
    //let httpsServer = https.createHTTPSServer();
    socket_io.createSocketIOServer(httpServer, accountManager);

    // Start the server tick.
    server.initServerTick();

    console.log("Server initialized successfully.");

    setTimeout(() => {
        // Save galaxy to state file.
        stateFile = "save_states/state_0.txt";

        let s = galaxy.serialize();
        let d = Galaxy.deserialize(s);
        d.server = server;

        console.log("Original");
        console.log(galaxy);
        console.log("Deserialized");
        console.log(d);

        console.log("Server State Saved.");
    }, 200);
}
init();