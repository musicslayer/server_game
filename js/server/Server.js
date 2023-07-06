const fs = require("fs");

const ServerFactory = require("./ServerFactory.js");
const ServerEntropy = require("./ServerEntropy.js");
const ServerRNG = require("./ServerRNG.js");
const ServerScheduler = require("./ServerScheduler.js");
const ServerTask = require("./ServerTask.js");
const NullAnimation = require("../animation/NullAnimation.js");
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
        //let server = new Server();
        let server = ServerFactory.createInstance();

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
        // Feed any accumulated entropy into the RNG to produce a random number.
        let entropyArray = this.serverEntropy.entropyArray;
        return this.serverRNG.getRandomInteger(entropyArray, max);
    }

    scheduleTask(animation, time, serverTask) {
        animation?.scheduleTasks(this);
        this.serverScheduler.addTask(time, serverTask);

        // Use the arguments to generate entropy to make things more random.
        this.serverEntropy.processBoolean(animation !== undefined);
        this.serverEntropy.processNumber(this.serverScheduler.getTick(time));
        this.serverEntropy.processString(serverTask.fcnString);
    }

    scheduleRefreshTask(animation, time, serverTask) {
        // The refresh server task executes the original server task and then reschedules itself to start the entire process again.
        let refreshServerTask = ServerTask.createRefreshTask((_this, server, animation, time, serverTask) => {
            serverTask.execute();
            server.scheduleTask(animation, time, _this);
        }, this, animation ?? new NullAnimation(), time, serverTask);

        this.scheduleTask(animation, time, refreshServerTask);
    }

    serialize(writer) {
        // The ServerScheduler must be handled last because all of the server entities must already be processed first.
        writer.beginObject()
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
        let server = new Server();

        reader.beginObject();
        let uid = reader.deserialize("uid", "Number");

        // Update the server map now before we deserialize anything else that may access it.
        server.uid = uid;
        ServerFactory.serverMap.set(uid, server);

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
        server.uid = uid;
        server.id = id;
        server.name = name;

        universe.server = server;
        server.universe = universe;

        return server;
    }
}

module.exports = Server;