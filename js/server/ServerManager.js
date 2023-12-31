const Server = require("./Server.js");

class ServerManager {
    servers = [];
    serverMap = new Map();

    addServer(server) {
        this.servers.push(server);
        this.serverMap.set(server.name, server);
    }

    getServerByName(name) {
        return this.serverMap.get(name);
    }

    startServerTicks() {
        for(let server of this.servers) {
            server.serverScheduler.initServerTick(server);
        }
    }

    endServerTicks() {
        for(let server of this.servers) {
            server.serverScheduler.endServerTick();
        }
    }

    serialize(writer) {
        writer.beginObject()
            .serialize("!V!", 1)
            .serializeArray("servers", this.servers)
        .endObject();
    }

    static deserialize(reader) {
        let serverManager;
        reader.beginObject();

        let version = reader.deserialize("!V!", "String");
        if(version === "1") {
            serverManager = new ServerManager();
            
            let servers = reader.deserializeArray("servers", "Server");
            for(let server of servers) {
                serverManager.addServer(server);
            }
        }
        else {
            throw(new Error("Unknown version number: " + version));
        }

        reader.endObject();
        return serverManager;
    }

    static createInitialServerManager() {
        // Load one game server and start its server tick.
        let serverManager = new ServerManager();

        let server = Server.loadServerFromFolder("assets/server/");
        server.id = 0;
        server.name = "origin";

        // Set server rng seed based on the server name.
        server.serverRNG.setInitialSeed(server.name);

        serverManager.addServer(server);
        serverManager.startServerTicks();

        return serverManager;
    }
}

module.exports = ServerManager;