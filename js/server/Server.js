const fs = require("fs");

const Universe = require("../world/Universe.js");
const ServerClock = require("./ServerClock.js");
const ServerCounter = require("./ServerCounter.js");

class Server {
    serverClock = new ServerClock();
    serverCounter = new ServerCounter();

    id;
    name;

    universes = [];
    universeMap = new Map();
    universePosMap = new Map();

    loadServerFromFolder(serverFolder) {
        let serverData = fs.readFileSync(serverFolder + "_server.txt", "ascii");
        let lines = serverData ? serverData.split(CRLF) : [];

        // Each line represents a world within this server.
        while(lines.length > 0) {
            let line = lines.shift();
            let parts = line.split(PIPE);

            // First part is the id
            let idPart = parts[0].split(COMMA);
            let id = Number(idPart.shift());

            // Second part is the universe
            let name = parts[1];

            let universe = new Universe();
            universe.server = this;
            universe.id = id;
            universe.name = name;

            universe.loadUniverseFromFolder(serverFolder + name + "/");
            this.addUniverse(universe);
        }
    }
    
    addUniverse(universe) {
        this.universes.push(universe);
        this.universeMap.set(universe.name, universe);
        this.universePosMap.set(universe.id, universe);
    }

    save(stateFile) {
        // Save the server state to the file.
        // We save the current tick but none of the scheduled tasks.
        this.serverClock.isPaused = true;

        let s = this.serialize();
        fs.writeFileSync(stateFile, s, "ascii");

        this.serverClock.isPaused = false;
    }

    load(stateFile) {
        // Change the server state to the state recorded in the file.
        this.serverClock.isPaused = true;

        // Wipe the scheduled tasks.
        this.scheduledTaskMap = new Map();

        let s = fs.readFileSync(stateFile, "ascii");
        this.deserialize(s);

        this.serverClock.isPaused = false;
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