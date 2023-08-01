const fs = require("fs");
const path = require("path");

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

    worldFolder;

    static loadWorldFromFolder(className, worldFolder) {
        let world = Reflection.createInstance(className);
        world.worldFolder = worldFolder;

        let worldFile = path.join(worldFolder, "_world.txt");
        let worldData = fs.readFileSync(worldFile, "ascii");
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

            let map = GameMap.loadMapFromFolder(className, path.join(worldFolder, name));
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
        let map = this.gameMapNameMap.get(name);

        // If the map does not exist in this world, try dynamically generating a "VoidMap".
        if(!map) {
            let voidWorld = this.universe.getWorldByID("void");
            map = voidWorld.getMapByName(name);

            // It's possible that the map is undefined. This occurs if the map name used to exist but was later removed.
            if(map) {
                map.world = this;
            }
        }

        return map;
    }

    getMapByID(id) {
        let map = this.gameMapIDMap.get(id);

        // If the map does not exist in this world, try dynamically generating a "VoidMap".
        if(!map) {
            let voidWorld = this.universe.getWorldByID("void");
            map = voidWorld.getMapByID(id);
            map.world = this;
        }

        return map;
    }

    getMapInDirection(map, direction) {
        let [, shiftY] = Util.getDirectionalShift(direction);
        return this.getMapByID(map.id - shiftY); // Use opposite of shift for map position.
    }

    getWorldInDirection(direction) {
        return this.universe.getWorldInDirection(this, direction);
    }

    serialize(writer) {
        writer.beginObject()
            .serialize("!V!", 1)
            .serialize("className", Util.getClassName(this))
            .serialize("id", this.id)
            .serialize("name", this.name)
            .serializeArray("maps", this.gameMaps)
            .serialize("worldFolder", this.worldFolder)
        .endObject();
    }

    static deserialize(reader) {
        let world;
        reader.beginObject();

        let version = reader.deserialize("!V!", "String");
        if(version === "1") {
            let className = reader.deserialize("className", "String");
            world = Reflection.createInstance(className);
            
            let id_string = reader.deserialize("id", "String");
            world.name = reader.deserialize("name", "String");
            let maps = reader.deserializeArray("maps", "GameMap");
            world.worldFolder = reader.deserialize("worldFolder", "String");

            let id;
            if(id_string === "death" || id_string === "fallback" || id_string === "void") {
                id = id_string;
            }
            else {
                id = Number(id_string);
            }

            world.id = id;

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