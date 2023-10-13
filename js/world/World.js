const fs = require("fs");
const path = require("path");
const { EOL } = require("os");

const Constants = require("../constants/Constants.js");
const Reflection = require("../reflection/Reflection.js");
const GameMap = require("./GameMap.js");
const Util = require("../util/Util.js");

const COMMA = ",";
const PIPE = "|";

class World {
    universe;
    id;
    name;
    displayName;

    maps = [];
    mapNameMap = new Map();
    mapIDMap = new Map();

    worldFolder;

    playerCount = 0;
    maxPlayerCount = Constants.performance.MAX_WORLD_PLAYER_COUNT;

    static loadWorldFromFolder(universe, className, worldFolder) {
        let world = Reflection.createInstance(className);
        world.universe = universe;
        world.worldFolder = worldFolder;

        let worldFile = path.join(worldFolder, "_world.txt");
        let worldData = fs.readFileSync(worldFile, "ascii");
        let lines = worldData ? worldData.split(EOL) : [];

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

            // Fourth part is the map display name
            let displayName = parts.shift();

            let map = GameMap.loadMapFromFolder(world, className, path.join(worldFolder, name));
            map.id = id;
            map.name = name;
            map.displayName = displayName;

            world.addMap(map);
        }

        return world;
    }

    addMap(map) {
        this.maps.push(map);
        this.mapNameMap.set(map.name, map);
        this.mapIDMap.set(map.id, map);
    }

    removeMap(map) {
        let index = this.maps.indexOf(map);
        this.maps.splice(index, 1);

        this.mapNameMap.delete(map.name);
        this.mapIDMap.delete(map.id);
    }

    getMapByName(name) {
        let map = this.mapNameMap.get(name);

        // If the map does not exist in this world then try to generate a map.
        // It's possible that the map is still undefined. This occurs if the map name used to exist but was later removed.
        if(!map) {
            for(let generatorWorld of this.universe.getGeneratorWorlds()) {
                map = generatorWorld.getMapByName(name);
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
        let map = this.mapIDMap.get(id);

        // If the map does not exist in this world then generate a map.
        // Note that at least one generator world will be able to create a map.
        if(!map) {
            for(let generatorWorld of this.universe.getGeneratorWorlds()) {
                map = generatorWorld.getMapByID(id);
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

    isFull() {
        return this.playerCount === this.maxPlayerCount;
    }

    serialize(writer) {
        writer.beginObject()
            .serialize("!V!", 1)
            .serialize("className", Util.getClassName(this))
            .serialize("id", this.id)
            .serialize("name", this.name)
            .serialize("displayName", this.displayName)
            .serializeArray("maps", this.maps)
            .serialize("worldFolder", this.worldFolder)
            .serialize("playerCount", this.playerCount)
            .serialize("maxPlayerCount", this.maxPlayerCount)
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
            world.displayName = reader.deserialize("displayName", "String");
            let maps = reader.deserializeArray("maps", "GameMap");
            world.worldFolder = reader.deserialize("worldFolder", "String");
            world.playerCount = reader.deserialize("playerCount", "Number");
            world.maxPlayerCount = reader.deserialize("maxPlayerCount", "Number");

            for(let map of maps) {
                map.world = world;
                world.addMap(map);
            }
        }
        else {
            throw(new Error("Unknown version number: " + version));
        }

        reader.endObject();
        return world;
    }
}

module.exports = World;