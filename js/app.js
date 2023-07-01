const http = require("./web/http.js");
const socket_io = require("./web/socket_io.js");

const AccountManager = require("./account/AccountManager.js");
const ServerManager = require("./server/ServerManager.js");
const Zip = require("./zip/Zip.js");

// TODO Check all serialize/deserialize methods after all the recent changes.
// TODO Should entity have a deserialize method?
// TODO The purse and inventory need to be serialized?

// TODO Any code that makes files should also make folders.
// TODO Move existing save states into an archive...?

// TODO When deserializing, we keep parsing and stringifying the string...

async function init() {
    // Recreate image zip file.
    Zip.createZipFileFromFolder("assets/image.zip", "assets/image/");

    // Create initial player accounts and servers.
    let accountManager = AccountManager.createInitialAccountManager();
    //let accountManager = new AccountManager();
    let serverManager = ServerManager.createInitialServerManager();

    ///////////
    const Client = require("./client/Client.js");
    Client.accountManager = accountManager;
    Client.serverManager = serverManager;
    ///////////

    // Start an interval to periodically save account and server state.
    setInterval(() => {
        let dateString = new Date().toISOString().replaceAll(":", "_").replace(".", "_");

        let accountFile = "save_states/account/" + dateString + ".txt";
        let serverFile = "save_states/server/" + dateString + ".txt";

        //accountManager.save(accountFile);
        //serverManager.save(serverFile);
    }, 10000);

    // Create servers to serve the web pages and communicate between front and back ends.
    let httpServer = http.createHTTPServer();
    //let httpsServer = https.createHTTPSServer();
    socket_io.createSocketIOServer(httpServer, accountManager, serverManager);

    console.log("Server initialized successfully.");
}
init();