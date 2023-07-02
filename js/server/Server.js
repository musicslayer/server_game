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

    save(stateFile) {
        // Save the server state to the file.
        // We save the current tick but none of the scheduled tasks.
        this.serverScheduler.isPaused = true;

        let s = this.serialize();
        fs.writeFileSync(stateFile, s, "ascii");

        this.serverScheduler.isPaused = false;
    }

    load(stateFile) {
        // Change the server state to the state recorded in the file.
        this.serverScheduler.isPaused = true;

        // Wipe the scheduled tasks.
        this.scheduledTaskMap = new Map();

        let s = fs.readFileSync(stateFile, "ascii");
        this.deserialize(s);

        this.serverScheduler.isPaused = false;
    }

    serialize() {
        let s = "{";
        s += "\"currentTick\":";
        s += "\"" + this.currentTick + "\"";
        s += ",";
        s += "\"universe\":";
        s += this.universe.serialize();
        s += "}";

        /*
        s += ",";
        s += "\"worldCounter\":";
        s += this.worldCounter.serialize();
        */

        return s;
    }

    deserialize(s) {
        let j = JSON.parse(s);
        let universe_s = JSON.stringify(j.universe);

        this.currentTick = j.currentTick;

        let universe = new Universe();
        universe.server = this;

        universe.deserialize(universe_s);
        this.addUniverse(universe);

        /*
        let entityCounter_s = JSON.stringify(j.worldCounter);
        this.worldCounter = EntityCounter.deserialize(entityCounter_s);
        */

        // Don't deserialize the scheduled tasks here.
    }
}

module.exports = Server;