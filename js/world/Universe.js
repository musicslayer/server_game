const fs = require("fs");

const WorldFactory = require("./WorldFactory.js");
const World = require("./World.js");
const Util = require("../util/Util.js");

const COMMA = ",";
const CRLF = "\r\n";
const PIPE = "|";

class Universe {
    server;
    id;
    name;

    worlds = [];
    worldMap = new Map();
    worldPosMap = new Map();

    static loadUniverseFromFolder(className, universeFolder) {
        let universe = WorldFactory.createInstance(className);

        let universeData = fs.readFileSync(universeFolder + "_universe.txt", "ascii");
        let lines = universeData ? universeData.split(CRLF) : [];

        // Each line represents a world within this universe.
        while(lines.length > 0) {
            let line = lines.shift();
            let parts = line.split(PIPE);

            // First part is the world id
            let idPart = parts.shift().split(COMMA);
            let id = Number(idPart.shift());

            // Second part is the world class name
            let className = parts.shift();

            // Third part is the world name
            let name = parts.shift();

            let world = World.loadWorldFromFolder(className, universeFolder + name + "/");
            world.universe = universe;
            world.id = id;
            world.name = name;

            universe.addWorld(world);
        }

        return universe;
    }

    addWorld(world) {
        this.worlds.push(world);
        this.worldMap.set(world.name, world);
        this.worldPosMap.set(world.id, world);
    }

    getWorldByName(name) {
        return this.worldMap.get(name);
    }

    getWorldInDirection(world, direction) {
        // If the new world does not exist, return the original world so nothing changes.
        let [, shiftY] = Util.getDirectionalShift(direction);
        return this.getWorldByPosition(world.id - shiftY) ?? world; // Use opposite of shift for world position.
    }

    getWorldByPosition(p) {
        return this.worldPosMap.get(p);
    }

    serialize() {
        let s = "{";
        s += "\"worlds\":";
        s += "[";
        for(let world of this.worlds) {
            s += world.serialize();
            s += ",";
        }
        if(s[s.length - 1] === ",") {s = s.slice(0, s.length - 1)}
        s += "]";
        s += "}";

        return s;
    }

    deserialize(s) {
        let j = JSON.parse(s);

        for(let world_j of j.worlds) {
            let world_s = JSON.stringify(world_j);

            let world = new World();
            world.universe = this;

            world.deserialize(world_s);
            this.addWorld(world);
        }
    }
}

module.exports = Universe;