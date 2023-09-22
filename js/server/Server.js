const fs = require("fs");
const path = require("path");

const ServerEntropy = require("./ServerEntropy.js");
const ServerFunction = require("./ServerFunction.js");
const ServerRNG = require("./ServerRNG.js");
const ServerScheduler = require("./ServerScheduler.js");
const Universe = require("../world/Universe.js");
const Util = require("../util/Util.js");

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

        let serverFile = path.join(serverFolder, "_server.txt");
        let serverData = fs.readFileSync(serverFile, "ascii");
        let lines = serverData ? serverData.split(CRLF) : [];

        // Each line represents a world within this server.
        while(lines.length > 0) {
            let line = lines.shift();
            let parts = line.split(PIPE);

            // First part is the universe id
            let idPart = parts.shift().split(COMMA);
            let id = Util.getStringOrNumber(idPart.shift());

            // Second part is the universe class name
            let className = parts.shift();

            // Third part is the universe name
            let name = parts.shift();

            let universe = Universe.loadUniverseFromFolder(server, className, path.join(serverFolder, name));
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
        // Feed any accumulated entropy into the RNG to produce a random number.
        let entropyArray = this.serverEntropy.entropyArray;
        let R = this.serverRNG.getRandomInteger(entropyArray, max);

        return R;
    }

    scheduleTask(serverTask) {
        serverTask.animation?.scheduleTasks(this);
        this.serverScheduler.addTask(serverTask);

        let tick = this.serverScheduler.getTick(serverTask.time)
        let fcnString = ServerFunction.getFunctionString(serverTask.fcnName);

        // Generate entropy to make things more random.
        this.serverEntropy.processBoolean(serverTask.animation !== undefined);
        this.serverEntropy.processNumber(tick);
        this.serverEntropy.processString(fcnString, tick);
    }

    serialize(writer) {
        writer.beginObject()
            .serialize("!V!", 1)
            .serialize("uid", this.uid)
            .serialize("id", this.id)
            .serialize("name", this.name)
            .serialize("universe", this.universe)
            .serialize("serverEntropy", this.serverEntropy)
            .serialize("serverRNG", this.serverRNG)
            .serialize("serverScheduler", this.serverScheduler)
        .endObject();
    }

    static deserialize(reader) {
        let server;
        reader.beginObject();

        let version = reader.deserialize("!V!", "String");
        if(version === "1") {
            let uid = reader.deserialize("uid", "Number");
            server = new Server(uid);

            server.id = Util.getStringOrNumber(reader.deserialize("id", "String"));
            server.name = reader.deserialize("name", "String");
            server.universe = reader.deserialize("universe", "Universe");
            server.serverEntropy = reader.deserialize("serverEntropy", "ServerEntropy");
            server.serverRNG = reader.deserialize("serverRNG", "ServerRNG");
            server.serverScheduler = reader.deserialize("serverScheduler", "ServerScheduler");
            
            server.universe.server = server;
        }
        else {
            throw(new Error("Unknown version number: " + version));
        }

        reader.endObject();
        return server;
    }
}

module.exports = Server;