const fs = require("fs");

const GameMap = require("./GameMap.js");

class World {
    gameMaps = [];
    gameMapMap = new Map();

    static async loadWorldFromFolder(worldFolder) {
        let world = new World();

        let mapFolders = fs.readdirSync(worldFolder);
        for(const mapFolder of mapFolders) {
            if(mapFolder === "_dynamic") {
                continue;
            }

            let map = GameMap.loadMapFromFolder(worldFolder + mapFolder + "/");
            
            map.attachWorld(world);
            world.addMap(mapFolder, map);
        }

        return world;
    }

    addMap(name, map) {
        this.gameMaps.push(map);
        this.gameMapMap.set(name, map);
    }

    getMap(name) {
        return this.gameMapMap.get(name);
    }

    getMapUp(map) {
        let idx = this.gameMaps.indexOf(map);
        return this.getMapByPosition(idx + 1);
    }

    getMapDown(map) {
        let idx = this.gameMaps.indexOf(map);
        return this.getMapByPosition(idx - 1);
    }


    getMapByPosition(p) {
        return this.gameMaps[p];
    }
}

module.exports = World;