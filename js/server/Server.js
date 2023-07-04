const fs = require("fs");

const Universe = require("../world/Universe.js");
const ServerScheduler = require("./ServerScheduler.js");

const COMMA = ",";
const CRLF = "\r\n";
const PIPE = "|";

class Server {
    serverScheduler = new ServerScheduler();

    id;
    name;

    // A server should only have one universe.
    universe;

    static loadServerFromFolder(serverFolder) {
        let server = new Server();

        let serverData = fs.readFileSync(serverFolder + "_server.txt", "ascii");
        let lines = serverData ? serverData.split(CRLF) : [];

        // Each line represents a world within this server.
        while(lines.length > 0) {
            let line = lines.shift();
            let parts = line.split(PIPE);

            // First part is the universe id
            let idPart = parts.shift().split(COMMA);
            let id = Number(idPart.shift());

            // Second part is the universe class name
            let className = parts.shift();

            // Third part is the universe name
            let name = parts.shift();

            let universe = Universe.loadUniverseFromFolder(className, serverFolder + name + "/");
            universe.server = server;
            universe.id = id;
            universe.name = name;

            server.addUniverse(universe);
        }

        return server;
    }

    addUniverse(universe) {
        this.universe = universe;
    }

    serialize(writer) {
        writer.beginObject()
            .serialize("serverScheduler", this.serverScheduler)
            .serialize("id", this.id)
            .serialize("name", this.name)
            .serialize("universe", this.universe)
        .endObject();
    }

    static deserialize(reader) {
        let server = new Server();

        reader.beginObject();
        let serverScheduler = reader.deserialize("serverScheduler", "ServerScheduler");
        let id = reader.deserialize("id", "Number");
        let name = reader.deserialize("name", "String");
        let universe = reader.deserialize("universe", "Universe");
        reader.endObject();

        server.serverScheduler = serverScheduler;
        server.id = id;
        server.name = name;

        universe.server = server;
        server.universe = universe;

        return server;
    }
}

module.exports = Server;