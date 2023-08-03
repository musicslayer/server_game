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

    static loadWorldFromFolder(universe, className, worldFolder) {
        let world = Reflection.createInstance(className);
        world.universe = universe;
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
            let id = Util.getStringOrNumber(idPart.shift());

            // Second part is the map class name
            let className = parts.shift();

            // Third part is the map name
            let name = parts.shift();

            let map = GameMap.loadMapFromFolder(world, className, path.join(worldFolder, name));
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

    removeMap(map) {
        let index = this.gameMaps.indexOf(map);
        this.gameMaps.splice(index, 1);

        this.gameMapNameMap.delete(map.name);
        this.gameMapIDMap.delete(map.id);
    }

    getMapByName(name) {
        let map = this.gameMapNameMap.get(name);

        // If the map does not exist in this world, try dynamically generating a map.
        // It's possible that the map is still undefined. This occurs if the map name used to exist but was later removed.
        if(!map) {
            // TODO These arrays should be stored somewhere?
            for(let dynamicWorldName of ["death", "fallback", "tutorial", "void"]) {
                let dynamicWorld = this.universe.getWorldByID(dynamicWorldName);
                map = dynamicWorld.getMapByName(name);
                if(!map) {
                    continue;
                }

                map.world.removeMap(map);
                map.world = this;
                map.world.addMap(map);
                
                break;
            }
        }

        return map;
    }

    getMapByID(id) {
        let map = this.gameMapIDMap.get(id);

        // If the map does not exist in this world, dynamically generate a map.
        // Note that at least one dynamic world will be able to create a map.
        if(!map) {
            // TODO These arrays should be stored somewhere?
            for(let dynamicWorldName of ["death", "fallback", "tutorial", "void"]) {
                let dynamicWorld = this.universe.getWorldByID(dynamicWorldName);
                map = dynamicWorld.getMapByID(id);
                if(!map) {
                    continue;
                }

                map.world.removeMap(map);
                map.world = this;
                map.world.addMap(map);

                break;
            }
        }

        return map;
    }

    getMapInDirection(map, direction) {
        let id = map.id;

        // If the id is not a number, then we are in a special map and should not apply the direction.
        if(Util.getClassName(map.id) === "Number") {
            let [, shiftY] = Util.getDirectionalShift(direction);
            id -= shiftY; // Use opposite of shift for map position.
        }

        return this.getMapByID(id); 
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
            
            world.id = Util.getStringOrNumber(reader.deserialize("id", "String"));
            world.name = reader.deserialize("name", "String");
            let maps = reader.deserializeArray("maps", "GameMap");
            world.worldFolder = reader.deserialize("worldFolder", "String");

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