const Server = require("./Server.js");
const ServerTask = require("./ServerTask.js");
const UID = require("../uid/UID.js");

class ServerManager {
    servers = [];
    serverMap = new Map();
    serverPosMap = new Map();

    addServer(server) {
        this.servers.push(server);
        this.serverMap.set(server.name, server);
        this.serverPosMap.set(server.id, server);
    }

    getServerByName(name) {
        return this.serverMap.get(name);
    }

    addSpawnServerTasks() {
        // Spawn all non-player entities.
        let entities = UID.getValues("Entity");
        for(let entity of entities) {
            if(entity.isPlayer) {
                continue;
            }

            let serverTask = new ServerTask((entity) => {
                entity.doSpawn();
            }, entity);

            entity.getServer().scheduleTask(undefined, 0, serverTask);
        }
    }

    startServerTicks() {
        for(let server of this.servers) {
            server.serverScheduler.initServerTick();
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
            throw("Unknown version number: " + version);
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
        server.serverRNG.server = server;

        serverManager.addServer(server);
        serverManager.addSpawnServerTasks();
        serverManager.startServerTicks();

        return serverManager;
    }
}

module.exports = ServerManager;