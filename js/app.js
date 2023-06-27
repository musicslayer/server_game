const http = require("./server/http.js");
const socket_io = require("./server/socket_io.js");

const AccountManager = require("./account/AccountManager.js");
const ServerManager = require("./server/ServerManager.js");
const Util = require("./util/Util.js");

// TODO All state changes must be done through the Server class. We need to enforce this somehow.
// TODO Only The client and monster ai classes can schedule things on the server (and then there would be less getServer methods)

// TODO Have a servers folder (assign galaxies/worlds to them)?
// TODO Should server and accounts be saved separately?
// TODO I should be able to save accounts/servers both all of them and some of them.

// TODO Players need to store experience and quest progression, etc...
// TODO Should entity have a deserialize method?

// TODO The purse and inventory need to be serialized?

async function init() {
    // Recreate image zip file.
    await Util.createZipFileFromFolder("assets/image.zip", "assets/image/");

    // Create initial player accounts and servers.
    //let accountManager = AccountManager.createInitialAccountManager();
    let accountManager = new AccountManager();
    let serverManager = ServerManager.createInitialServerManager();
    
    // Create servers to serve the web pages and communicate between front and back ends.
    let httpServer = http.createHTTPServer();
    //let httpsServer = https.createHTTPSServer();
    socket_io.createSocketIOServer(httpServer, accountManager, serverManager);

    console.log("Server initialized successfully.");

    /*
    setTimeout(() => {
        console.log("Original");
        console.log(server);

        // Save/load the server.
        //stateFile = "save_states/state_0.txt";

        let dateString = new Date().toISOString().replaceAll(":", "_").replace(".", "_");
        let stateFile = "save_states/" + dateString + ".txt";

        server.save(stateFile);
        server.load(stateFile);



        
        console.log("Deserialized");
        console.log(server);

        console.log("Server State Cycle Complete.");
    }, 200);
    */

    /*
    setTimeout(() => {
        console.log("Original");
        console.log(accountManager);

        // Save/load the server.
        //stateFile = "save_states/state_0.txt";

        let dateString = new Date().toISOString().replaceAll(":", "_").replace(".", "_");
        let accountFile = "account_states/" + dateString + ".txt";

        accountManager.save(accountFile);
        accountManager.load(accountFile, server);



        
        console.log("Deserialized");
        console.log(accountManager);

        console.log("Server State Cycle Complete.");
    }, 200);
    */
}
init();