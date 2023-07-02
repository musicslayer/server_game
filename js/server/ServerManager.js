const fs = require("fs");

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

    spawnServer(server) {
        // Spawn all non-player entities on this server.
        for(let world of server.universe.worlds) {
            for(let map of world.gameMaps) {
                for(let screen of map.screens) {
                    for(let entity of screen.otherEntities.slice()) {
                        entity.doSpawn();
                    }
                }
            }
        }
    }

    save(serverFile) {
        // Save the server state to the file.
        let s = this.serialize();
        fs.writeFileSync(serverFile, s, "ascii");
    }

    load(serverFile) {
        // Change the server state to the state recorded in the file.
        let s = fs.readFileSync(serverFile, "ascii");

        this.servers = [];
        this.serverMap = new Map();
        this.serverPosMap = new Map();

        this.deserialize(s);
    }

    serialize() {
        let s = "{";
        s += "\"servers\":";
        s += "[";
        for(let server of this.servers) {
            s += server.serialize();
            s += ",";
        }
        if(s[s.length - 1] === ",") {s = s.slice(0, s.length - 1)}
        s += "]";
        s += "}";

        return s;
    }

    deserialize(s) {
        let j = JSON.parse(s);

        this.key = j.key;
        
        for(let server_j of j.servers) {
            let server_s = JSON.stringify(server_j);

            let server = new Server();
            //server.id = 0;
            //server.name = "origin";

            server.deserialize(server_s);
            server.serverScheduler.initServerTick();

            this.addServer(server);
        }
    }

    static createInitialServerManager() {
        // Load one game server and start its server tick.
        let serverManager = new ServerManager();

        let server = Server.loadServerFromFolder("assets/server/");
        server.id = 0;
        server.name = "origin";

        server.serverScheduler.scheduleTask(undefined, 0, () => {
            serverManager.spawnServer(server);
        });

        server.serverScheduler.initServerTick();

        serverManager.addServer(server);

        return serverManager;
    }
}

module.exports = ServerManager;