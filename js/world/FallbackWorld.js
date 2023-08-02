const path = require("path");

const GameMap = require("./GameMap.js");
const World = require("./World.js");

const NAME_PREFIX = "_fallback_";

class FallbackWorld extends World {
    getMapByName(name) {
        // Return a dynamically generated "fallback" map if the name starts with the expected prefix.
        let map;

        if(name.startsWith(NAME_PREFIX)) {
            // ID will always be a string.
            let id = name.slice(NAME_PREFIX.length);
            map = this.createFallbackMap(id);
        }

        return map;
    }

    getMapByID(id) {
        // Always return a dynamically generated "fallback" map.
        return this.createFallbackMap(id);
    }

    createFallbackMap(id) {
        let fallbackMap = GameMap.loadMapFromFolder(this, "FallbackMap", path.join(this.worldFolder, "_fallback"))
        fallbackMap.name = NAME_PREFIX + id;
        fallbackMap.id = id;

        this.addMap(fallbackMap);
        
        return fallbackMap;
    }
}

module.exports = FallbackWorld;