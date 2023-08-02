const path = require("path");

const GameMap = require("./GameMap.js");
const World = require("./World.js");

const NAME_PREFIX = "_death_";
const ID_VALUE = "death";

class DeathWorld extends World {
    sendToEntrance(entity, world) {
        let deathMap = this.getMapByID("death");
        deathMap.world.removeMap(deathMap);
        deathMap.world = world;
        deathMap.world.addMap(deathMap);

        let deathScreen = deathMap.getScreenByID(0, 0);

        entity.setScreen(deathScreen);
        entity.x = 7;
        entity.y = 11;
    }

    teleportToEntrance(entity) {
        this.sendToEntrance(entity, entity.screen.map.world);
        entity.doTeleport(entity.screen, entity.x, entity.y);
    }

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
        // Return a dynamically generated "death" map if the id is the expected value.
        let map;

        if(id === ID_VALUE) {
            map = this.createDeathMap(id);
        }

        return map;
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