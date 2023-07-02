const fs = require("fs");

const WorldFactory = require("./WorldFactory.js");
const GameMap = require("./GameMap.js");
const VoidMap = require("./VoidMap.js");
const DeathMap = require("./DeathMap.js");
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
            let id = Number(idPart.shift());

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

        /*
        // Add special "death" map
        let deathMap = new DeathMap();
        deathMap.world = this;
        deathMap.id = "death";
        deathMap.name = "Death";

        deathMap.loadMapFromFolder(worldFolder + "_death/");
        this.addMap(deathMap);

        // Add special "void" map
        let voidMap = new VoidMap();
        voidMap.world = this;
        voidMap.id = "void";
        voidMap.name = "Void";

        voidMap.loadMapFromFolder(worldFolder + "_void/");
        this.addMap(voidMap);
        */

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

    serialize() {
        let s = "{";
        s += "\"id\":";
        s += "\"" + this.id + "\"";
        s += ",";
        s += "\"name\":";
        s += "\"" + this.name + "\"";
        s += ",";
        s += "\"maps\":";
        s += "[";
        for(let map of this.gameMaps) {
            s += map.serialize();
            s += ",";
        }
        if(s[s.length - 1] === ",") {s = s.slice(0, s.length - 1)}
        s += "]";
        s += "}";

        return s;
    }

    deserialize(s) {
        let j = JSON.parse(s);

        this.id = j.id;
        this.name = j.name;
        
        for(let map_j of j.maps) {
            let map_s = JSON.stringify(map_j);

            let map;
            if(map_j.classname === "DeathMap") {
                map = new DeathMap();
            }
            else if(map_j.classname === "VoidMap") {
                map = new VoidMap();
            }
            else {
                map = new GameMap();
            }

            map.world = this;

            map.deserialize(map_s);
            this.addMap(map);
        }
    }
}

module.exports = World;