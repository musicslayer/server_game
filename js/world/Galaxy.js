const fs = require("fs");

const World = require("./World.js");
const Util = require("../util/Util.js");

const COMMA = ",";
const CRLF = "\r\n";
const PIPE = "|";

class Galaxy {
    server;

    worlds = [];
    worldMap = new Map();
    worldPosMap = new Map();

    loadGalaxyFromFolder(galaxyFolder) {
        let galaxyData = fs.readFileSync(galaxyFolder + "_galaxy.txt", "ascii");
        let lines = galaxyData ? galaxyData.split(CRLF) : [];

        // Each line represents a world within this galaxy.
        while(lines.length > 0) {
            let line = lines.shift();
            let parts = line.split(PIPE);

            // First part is the id
            let idPart = parts[0].split(COMMA);
            let id = Number(idPart.shift());

            // Second part is the world
            let name = parts[1];

            let world = new World();
            world.galaxy = this;
            world.id = id;
            world.name = name;

            world.loadWorldFromFolder(galaxyFolder + name + "/");

            this.addWorld(world);
        }
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
}

module.exports = Galaxy;