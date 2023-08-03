const path = require("path");

const GameMap = require("../GameMap.js");
const DynamicWorld = require("./DynamicWorld.js");

class FallbackWorld extends DynamicWorld {
    getNamePrefix() {
        return "_fallback_";
    }

    getIDValue() {
        return "fallback";
    }

    isIDAllowed(id) {
        return id === this.getIDValue();
    }

    createEntrance(world) {
        let fallbackMap = this.getMapByID(this.getIDValue());
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
        fallbackMap.name = this.getNamePrefix() + id;
        fallbackMap.id = id;

        this.addMap(fallbackMap);
        
        return fallbackMap;
    }
}

module.exports = FallbackWorld;