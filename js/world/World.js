const fs = require("fs");

const GameMap = require("./GameMap.js");

class World {
    static WORLD;

    gameMaps = [];
    gameMapMap = new Map();

    static async loadWorldFromFolder(worldFolder) {
        let world = new World();

        let mapFolders = fs.readdirSync(worldFolder);
        for(const mapFolder of mapFolders) {
            let map = GameMap.loadMapFromFolder(worldFolder + mapFolder + "/");
            world.addMap(mapFolder, map);
        }

        World.WORLD = world;
        return world;
    }

    addMap(name, map) {
        this.gameMaps.push(map);
        this.gameMapMap.set(name, map);
    }

    getMapAbove(map) {
        let idx = this.gameMaps.indexOf(map);
        return this.getMapByPosition(idx + 1);
    }

    getMapBelow(map) {
        let idx = this.gameMaps.indexOf(map);
        return this.getMapByPosition(idx - 1);
    }


    getMapByPosition(p) {
        return this.gameMaps[p];
    }
}

module.exports = World;