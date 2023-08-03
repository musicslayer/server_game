const path = require("path");

const GameMap = require("../GameMap.js");
const DynamicWorld = require("./DynamicWorld.js");

const NAME_PREFIX = "_death_";
const ID_VALUE = "death";

class DeathWorld extends DynamicWorld {
    getNamePrefix() {
        return NAME_PREFIX;
    }

    isIDAllowed(id) {
        return id === ID_VALUE;
    }

    createEntrance(world) {
        let deathMap = this.getMapByID(ID_VALUE);
        deathMap.world.removeMap(deathMap);
        deathMap.world = world;
        deathMap.world.addMap(deathMap);

        return {
            screen: deathMap.getScreenByID(0, 0),
            x: 7,
            y: 11
        }
    }

    teleportToEntrance(entity) {
        let entrance = this.createEntrance(entity.screen.map.world);
        entity.doTeleport(entrance.screen, entrance.x, entrance.y);
    }

    createDynamicMap(id) {
        let deathMap = GameMap.loadMapFromFolder(this, "DeathMap", path.join(this.worldFolder, "_death"))
        deathMap.name = NAME_PREFIX + id;
        deathMap.id = id;

        this.addMap(deathMap);
        
        return deathMap;
    }
}

module.exports = DeathWorld;