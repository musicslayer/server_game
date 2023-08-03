const fs = require("fs");
const path = require("path");

const ServerEntropy = require("./ServerEntropy.js");
const ServerRNG = require("./ServerRNG.js");
const ServerScheduler = require("./ServerScheduler.js");
const ServerTask = require("./ServerTask.js");
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
        return this.serverRNG.getRandomInteger(entropyArray, max);
    }

    addTask(animation, time, serverTask) {
        serverTask.server = this;

        animation?.scheduleTasks(this);
        this.serverScheduler.addTask(time, serverTask);

        // Use the arguments to generate entropy to make things more random.
        this.serverEntropy.processBoolean(animation !== undefined);
        this.serverEntropy.processNumber(this.serverScheduler.getTick(time));
        this.serverEntropy.processString(serverTask.fcnString);
    }

    scheduleTask(animation, time, count, serverTask) {
        serverTask.count = count;
        let wrapperServerTask = ServerTask.createWrapperTask((_this, animation, time, serverTask) => {
            if(!serverTask.isCancelled) {
                serverTask.execute();

                serverTask.count--;
                if(serverTask.count > 0) {
                    _this.server.addTask(animation, time, _this);
                }
            }
        }, animation, time, serverTask);

        this.addTask(animation, time, wrapperServerTask);
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

            // For all of the scheduled tasks, we need to reattach the server.
            let scheduledTaskMap = server.serverScheduler.scheduledTaskMap;
            for(let key of scheduledTaskMap.keys()) {
                let serverTaskList = scheduledTaskMap.get(key);
                for(let serverTask of serverTaskList.serverTasks) {
                    serverTask.server = server;
                }
                scheduledTaskMap.get(key, serverTaskList);
            }
        }
        else {
            throw("Unknown version number: " + version);
        }

        reader.endObject();
        return server;
    }
}

module.exports = Server;