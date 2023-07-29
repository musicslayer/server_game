const fs = require("fs");

const Reflection = require("../reflection/Reflection.js");
const GameMap = require("./GameMap.js");
const Util = require("../util/Util.js");

const COMMA = ",";
const CRLF = "\r\n";
const PIPE = "|";

class World {
    universe;
    id;
    name;

    gameMaps = [];
    gameMapNameMap = new Map();
    gameMapIDMap = new Map();

    static loadWorldFromFolder(className, worldFolder) {
        let world = Reflection.createInstance(className);

        let worldData = fs.readFileSync(worldFolder + "_world.txt", "ascii");
        let lines = worldData ? worldData.split(CRLF) : [];

        // Each line represents a map within this world.
        while(lines.length > 0) {
            let line = lines.shift();
            let parts = line.split(PIPE);

            // First part is the map id
            let idPart = parts.shift().split(COMMA);
            let id_string = idPart.shift();
            let id;
            if(id_string === "death" || id_string === "fallback" || id_string === "void") {
                id = id_string;
            }
            else {
                id = Number(id_string);
            }

            // Second part is the map class name
            let className = parts.shift();

            // Third part is the map name
            let name = parts.shift();

            let map = GameMap.loadMapFromFolder(className, worldFolder + name + "/");
            map.world = world;
            map.id = id;
            map.name = name;

            world.addMap(map);
        }

        return world;
    }

    addMap(map) {
        this.gameMaps.push(map);
        this.gameMapNameMap.set(map.name, map);
        this.gameMapIDMap.set(map.id, map);
    }

    getMapByName(name) {
        return this.gameMapNameMap.get(name);
    }

    getMapInDirection(map, direction) {
        let [, shiftY] = Util.getDirectionalShift(direction);
        return this.getMapByID(map.id - shiftY); // Use opposite of shift for map position.
    }

    getMapByID(p) {
        let map = this.gameMapIDMap.get(p);

        // If this map does not exist, return a dynamically generated "void" map.
        if(!map) {
            let voidMap = this.getMapByID("void");
            map = voidMap.createVoidMapClone(p);
        }

        return map;
    }

    getWorldInDirection(direction) {
        return this.universe.getWorldInDirection(this, direction);
    }

    serialize(writer) {
        writer.beginObject()
            .serialize("!V!", 1)
            .serialize("id", this.id)
            .serialize("name", this.name)
            .serializeArray("maps", this.gameMaps)
        .endObject();
    }

    static deserialize(reader) {
        let world;
        reader.beginObject();

        let version = reader.deserialize("!V!", "String");
        if(version === "1") {
            world = new World();
            world.id = reader.deserialize("id", "Number");
            world.name = reader.deserialize("name", "String");
            let maps = reader.deserializeArray("maps", "GameMap");

            for(let map of maps) {
                map.world = world;
                world.addMap(map);
            }
        }
        else {
            throw("Unknown version number: " + version);
        }

        reader.endObject();
        return world;
    }
}

module.exports = World;