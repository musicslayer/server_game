const fs = require("fs");

const GameMap = require("./GameMap.js");
const VoidMap = require("./VoidMap.js");
const DeathMap = require("./DeathMap.js");

const COMMA = ",";
const CRLF = "\r\n";
const PIPE = "|";

class World {
    server;
    
    id;
    name;

    voidMapFolder;

    gameMaps = [];
    gameMapMap = new Map();
    gameMapPosMap = new Map();

    loadWorldFromFolder(worldFolder) {
        // Add special "void" map
        this.voidMapFolder = worldFolder + "_void/"

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
            let mapName = parts[1];

            let map = new GameMap();
            map.attachWorld(this);
            map.loadMapFromFolder(worldFolder + mapName + "/", this.voidMapFolder);
            
            this.addMap(mapName, map, id);
        }

        // Add special "death" map
        let deathMap = new DeathMap();
        deathMap.loadMapFromFolder(worldFolder + "_death/", this.voidMapFolder);

        deathMap.attachWorld(this);
        this.addMap("death", deathMap, "death");
    }

    attachServer(server) {
        this.server = server;
    }

    addMap(name, map, id) {
        map.id = id;
        map.name = name;

        this.gameMaps.push(map);
        this.gameMapMap.set(name, map);

        this.gameMapPosMap.set(id, map);
    }

    getMap(name) {
        return this.gameMapMap.get(name);
    }

    getMapUp(map) {
        return this.getMapByPosition(map.id + 1);
    }

    getMapDown(map) {
        return this.getMapByPosition(map.id - 1);
    }

    getMapByPosition(p) {
        let map = this.gameMapPosMap.get(p);

        // If this map does not exist, return a dynamically generated "void" map.
        if(!map) {
            map = new VoidMap();
            map.loadMapFromFolder(this.voidMapFolder, this.voidMapFolder);

            map.id = p;
            map.attachWorld(this);
        }

        return map;
    }

    getMapPosition(map) {
        return this.gameMaps.indexOf(map);
    }

    getWorldUp() {
        return this.server.getWorldUp(this);
    }

    getWorldDown() {
        return this.server.getWorldDown(this);
    }
}

module.exports = World;