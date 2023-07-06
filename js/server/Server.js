const fs = require("fs");

const ServerEntropy = require("./ServerEntropy.js");
const ServerRNG = require("./ServerRNG.js");
const ServerScheduler = require("./ServerScheduler.js");
const Universe = require("../world/Universe.js");

const COMMA = ",";
const CRLF = "\r\n";
const PIPE = "|";

class Server {
    serverEntropy = new ServerEntropy();
    serverRNG = new ServerRNG();
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

    getRandomInteger(max) {
        // Feed the current tick and any accumulated entropy into the RNG to produce a random number.
        let currentTick = this.serverScheduler.currentTick;
        let entropyArray = this.serverEntropy.entropyArray;
        
        //return this.serverRNG.getRandomInteger(currentTick, entropyArray, max);
        let R = this.serverRNG.getRandomInteger(currentTick, entropyArray, max);
        //console.log("R = " + R);

        console.log("c = " + currentTick + " e = " + this.serverRNG.reduce(entropyArray) + " s = " + this.serverRNG.seed + " R = " + R);

        return R;
    }

    serialize(writer) {
        // The ServerScheduler must be handled last because all of the server entities must already be processed first.
        writer.beginObject()
            .serialize("id", this.id)
            .serialize("name", this.name)
            .serialize("universe", this.universe)
            .serialize("serverEntropy", this.serverEntropy)
            .serialize("serverRNG", this.serverRNG)
            .serialize("serverScheduler", this.serverScheduler)
        .endObject();
    }

    static deserialize(reader) {
        let server = new Server();

        reader.beginObject();
        let id = reader.deserialize("id", "Number");
        let name = reader.deserialize("name", "String");
        let universe = reader.deserialize("universe", "Universe");
        let serverEntropy = reader.deserialize("serverEntropy", "ServerEntropy");
        let serverRNG = reader.deserialize("serverRNG", "ServerRNG");
        let serverScheduler = reader.deserialize("serverScheduler", "ServerScheduler");
        reader.endObject();

        server.serverEntropy = serverEntropy;
        server.serverRNG = serverRNG;
        server.serverScheduler = serverScheduler;
        server.id = id;
        server.name = name;

        universe.server = server;
        server.universe = universe;

        return server;
    }
}

module.exports = Server;