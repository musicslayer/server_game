const path = require("path");

const GameMap = require("./GameMap.js");
const World = require("./World.js");

const NAME_PREFIX = "_fallback_";
const ID_VALUE = "death";

class FallbackWorld extends World {
    sendToEntrance(entity, world) {
        let fallbackMap = this.getMapByID("fallback");
        fallbackMap.world.removeMap(fallbackMap);
        fallbackMap.world = world;
        fallbackMap.world.addMap(fallbackMap);

        let fallbackScreen = fallbackMap.getScreenByID(0, 0);

        entity.setScreen(fallbackScreen);
        entity.x = 7;
        entity.y = 11;
    }

    teleportToEntrance(entity) {
        this.sendToEntrance(entity, entity.screen.map.world);
        entity.doTeleport(entity.screen, entity.x, entity.y);
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