const Server = require("./Server.js");

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

    addSpawnServerTask() {
        // Spawn all non-player entities.
        for(let server of this.servers) {
            server.serverScheduler.scheduleTask(undefined, 0, () => {
                for(let world of server.universe.worlds) {
                    for(let map of world.gameMaps) {
                        for(let screen of map.screens) {
                            for(let entity of screen.otherEntities.slice()) {
                                entity.doSpawn();
                            }
                        }
                    }
                }
            });
        }
    }

    // TODO Rename to have "servers"? or only allow one server to do this at a time?
    setServerIsPaused(bool) {
        for(let server of this.servers) {
            server.serverScheduler.isPaused = bool;
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
            .serializeArray("servers", this.servers)
        .endObject();
    }

    static deserialize(reader) {
        let serverManager = new ServerManager();

        reader.beginObject();
        let servers = reader.deserializeArray("servers", "Server");
        reader.endObject();

        for(let server of servers) {
            serverManager.addServer(server);
        }

        // TODO When to do this?
        //server.serverScheduler.initServerTick();

        return serverManager;
    }

    static createInitialServerManager() {
        // Load one game server and start its server tick.
        let serverManager = new ServerManager();

        let server = Server.loadServerFromFolder("assets/server/");
        server.id = 0;
        server.name = "origin";

        serverManager.addServer(server);
        serverManager.addSpawnServerTask();
        serverManager.startServerTicks();

        return serverManager;
    }
}

module.exports = ServerManager;