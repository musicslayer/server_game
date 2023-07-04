const fs = require("fs");

const WorldFactory = require("./WorldFactory.js");
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
    gameMapMap = new Map();
    gameMapPosMap = new Map(); // TODO Why is pos and id treated the same?

    static loadWorldFromFolder(className, worldFolder) {
        let world = WorldFactory.createInstance(className);

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
            if(id_string === "death" || id_string === "void") {
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
        this.gameMapMap.set(map.name, map);
        this.gameMapPosMap.set(map.id, map);
    }

    getMapByName(name) {
        return this.gameMapMap.get(name);
    }

    getMapInDirection(map, direction) {
        let [, shiftY] = Util.getDirectionalShift(direction);
        return this.getMapByPosition(map.id - shiftY); // Use opposite of shift for map position.
    }

    getMapByPosition(p) {
        let map = this.gameMapPosMap.get(p);

        // If this map does not exist, return a dynamically generated "void" map.
        if(!map) {
            let voidMap = this.getMapByPosition("void");
            map = voidMap.createVoidMapClone(p);
        }

        return map;
    }

    // TODO Reduce a lot of these repeated methods.
    getWorldInDirection(direction) {
        return this.universe.getWorldInDirection(this, direction);
    }

    serialize(writer) {
        writer.beginObject()
            .serialize("id", this.id)
            .serialize("name", this.name)
            .serializeArray("maps", this.gameMaps)
        .endObject();
    }

    static deserialize(reader) {
        let world = new World();

        reader.beginObject();
        let id = reader.deserialize("id", "Number");
        let name = reader.deserialize("name", "String");
        let maps = reader.deserializeArray("maps", "GameMap");
        reader.endObject();

        world.id = id;
        world.name = name;

        for(let map of maps) {
            map.world = world;
            world.addMap(map);
        }

        return world;
    }
}

module.exports = World;