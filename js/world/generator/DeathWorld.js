const path = require("path");

const GameMap = require("../GameMap.js");
const GeneratorWorld = require("./GeneratorWorld.js");

class DeathWorld extends GeneratorWorld {
    getNamePrefix() {
        return "_death_";
    }

    getIDValue() {
        return "death";
    }

    isIDAllowed(id) {
        return id === this.getIDValue();
    }

    createEntrance(world) {
        let deathMap = this.getMapByID(this.getIDValue());
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

    createMap(id) {
        let deathMap = GameMap.loadMapFromFolder(this, "DeathMap", path.join(this.worldFolder, "_death"))
        deathMap.name = this.getNamePrefix() + id;
        deathMap.id = id;

        this.addMap(deathMap);
        
        return deathMap;
    }
}

module.exports = DeathWorld;