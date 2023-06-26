const fs = require("fs");

const Server = require("./Server.js");
const Galaxy = require("../world/Galaxy.js");

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

    save(serverFile) {
        // Save the server state to the file.
        let s = this.serialize();
        fs.writeFileSync(serverFile, s, "ascii");
    }

    load(serverFile, server) {
        // Change the server state to the state recorded in the file.
        let s = fs.readFileSync(serverFile, "ascii");
        this.deserialize(s, server);
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

            server.deserialize(server_s);
            this.addServer(server);
        }
    }





    static createInitialServerManager() {
        // Load game server and galaxy.
        let serverManager = new ServerManager();

        let server = new Server();
        server.id = 0;
        server.name = "origin";

        let galaxy = new Galaxy();
        galaxy.server = server;

        galaxy.loadGalaxyFromFolder("assets/galaxy/");
        server.addGalaxy(galaxy);

        serverManager.addServer(server);

        // Start the server tick.
        server.initServerTick();

        return serverManager;
    }
}

module.exports = ServerManager;