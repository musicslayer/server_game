class ServerFactory {
    static uid = 0;
    static serverMap = new Map();

    static createInstance() {
        let uid = ServerFactory.uid++;

        const Server = require("./Server.js");
        let server = new Server();

        ServerFactory.serverMap.set(uid, server);

        return server;
    }
}

module.exports = ServerFactory;