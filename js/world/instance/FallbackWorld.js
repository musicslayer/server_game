const path = require("path");

const GameMap = require("../GameMap.js");
const DynamicWorld = require("./DynamicWorld.js");

const NAME_PREFIX = "_fallback_";
const ID_VALUE = "fallback";

class FallbackWorld extends DynamicWorld {
    getNamePrefix() {
        return NAME_PREFIX;
    }

    isIDAllowed(id) {
        return id === ID_VALUE;
    }

    createEntrance(world) {
        let fallbackMap = this.getMapByID(ID_VALUE);
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

    createDynamicMap(id) {
        let fallbackMap = GameMap.loadMapFromFolder(this, "FallbackMap", path.join(this.worldFolder, "_fallback"))
        fallbackMap.name = NAME_PREFIX + id;
        fallbackMap.id = id;

        this.addMap(fallbackMap);
        
        return fallbackMap;
    }
}

module.exports = FallbackWorld;