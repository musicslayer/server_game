const fs = require("fs");

const EntityCounter = require("./EntityCounter.js");
const EntitySpawner = require("./EntitySpawner.js");
const GameMap = require("./GameMap.js");
const VoidMap = require("./VoidMap.js");
const DeathMap = require("./DeathMap.js");
const Util = require("../util/Util.js");

const COMMA = ",";
const CRLF = "\r\n";
const PIPE = "|";

class World {
    entityCounter = new EntityCounter();
    entitySpawner = new EntitySpawner();

    galaxy;
    id;
    name;

    gameMaps = [];
    gameMapMap = new Map();
    gameMapPosMap = new Map();

    loadWorldFromFolder(worldFolder) {
        // Store the folder definining the special "void" map for this world.
        let worldData = fs.readFileSync(worldFolder + "_world.txt", "ascii");
        let lines = worldData ? worldData.split(CRLF) : [];

        // Each line represents a map within this world.
        while(lines.length > 0) {
            let line = lines.shift();
            let parts = line.split(PIPE);

            // First part is the id
            let idPart = parts[0].split(COMMA);
            let id = Number(idPart.shift());

            // Second part is the map
            let name = parts[1];

            let map = new GameMap();
            map.world = this;
            map.id = id;
            map.name = name;

            map.loadMapFromFolder(worldFolder + name + "/");

            this.addMap(map);
        }

        // Add special "death" map
        let deathMap = new DeathMap();
        deathMap.world = this;
        deathMap.id = "death";
        deathMap.name = "death";

        deathMap.loadMapFromFolder(worldFolder + "_death/");
        this.addMap(deathMap);

        // Add special "void" map
        let voidMap = new VoidMap();
        voidMap.world = this;
        voidMap.id = "void";
        voidMap.name = "void";

        voidMap.loadMapFromFolder(worldFolder + "_void/");
        this.addMap(voidMap);
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

    getWorldInDirection(direction) {
        return this.galaxy.getWorldInDirection(this, direction);
    }

    spawn(id, number, screen, x, y, ...args) {
        return this.entitySpawner.spawn(id, number, screen, x, y, ...args);
    }

    spawnAsLoot(id, number, screen, x, y, ...args) {
        return this.entitySpawner.spawnAsLoot(id, number, screen, x, y, ...args);
    }

    createInstance(id, number, ...args) {
        return this.entitySpawner.createInstance(id, number, ...args);
    }

    cloneInstance(entity, number, screen) {
        return this.entitySpawner.cloneInstance(entity, number, screen);
    }

    register(type, number) {
        switch(type) {
            case "persistent":
                this.entityCounter.registerPersistentEntity(number);
                break;
            case "instance":
                this.entityCounter.registerInstanceEntity(number);
                break;
            case "inventory":
                this.entityCounter.registerInventoryEntity(number);
                break;
            case "gold":
                this.entityCounter.registerGold(number);
                break;
        }
    }

    deregister(type, number) {
        switch(type) {
            case "persistent":
                this.entityCounter.deregisterPersistentEntity(number);
                break;
            case "instance":
                this.entityCounter.deregisterInstanceEntity(number);
                break;
            case "inventory":
                this.entityCounter.deregisterInventoryEntity(number);
                break;
            case "gold":
                this.entityCounter.deregisterGold(number);
                break;
        }
    }

    getServer() {
        return this.galaxy.server;
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

    static deserialize(s) {
        let j = JSON.parse(s);

        let world = new World();
        world.id = j.id;
        world.name = j.name;
        
        for(let map_j of j.maps) {
            let map_s = JSON.stringify(map_j);

            let map = GameMap.deserialize(map_s);
            map.world = world;

            world.addMap(map);
        }

        return world;
    }
}

module.exports = World;