const path = require("path");

const GameMap = require("./GameMap.js");
const World = require("./World.js");

const NAME_PREFIX = "_death_";

class DeathWorld extends World {
    getMapByName(name) {
        // Return a dynamically generated "death" map if the name starts with the expected prefix.
        let map;

        if(name.startsWith(NAME_PREFIX)) {
            // ID will always be a string.
            let id = name.slice(NAME_PREFIX.length);
            map = this.createDeathMap(id);
        }

        return map;
    }

    getMapByID(id) {
        // Always return a dynamically generated "death" map.
        return this.createDeathMap(id);
    }

    createDeathMap(id) {
        let deathMap = GameMap.loadMapFromFolder(this, "DeathMap", path.join(this.worldFolder, "_death"))
        deathMap.name = NAME_PREFIX + id;
        deathMap.id = id;

        this.addMap(deathMap);
        
        return deathMap;
    }
}

module.exports = DeathWorld;