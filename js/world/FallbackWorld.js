const path = require("path");

const GameMap = require("./GameMap.js");
const World = require("./World.js");

const NAME_PREFIX = "_fallback_";
const ID_VALUE = "fallback";

class FallbackWorld extends World {
    createEntrance(world) {
        let fallbackMap = this.getMapByID("fallback");
        fallbackMap.world.removeMap(fallbackMap);
        fallbackMap.world = world;
        fallbackMap.world.addMap(fallbackMap);

        return {
            screen: fallbackMap.getScreenByID(0, 0),
            x: 7,
            y: 11
        }
    }

    teleportToEntrance(entity) {
        let entrance = this.createEntrance(entity.screen.map.world);
        entity.doTeleport(entrance.screen, entrance.x, entrance.y);
    }

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
        // Return a dynamically generated "fallback" map if the id is the expected value.
        let map;

        if(id === ID_VALUE) {
            map = this.createFallbackMap(id);
        }

        return map;
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