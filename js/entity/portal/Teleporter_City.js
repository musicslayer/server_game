const Entity = require("../Entity.js");

class Teleporter_City extends Entity {
    getName() {
        return "Teleporter";
    }

    getEntityName() {
        return "portal_teleporter";
    }

    getInfo() {
        return "A portal to return to the city.";
    }

    doInteract(entity) {
        // Teleport a player only.
        if(entity.isPlayer) {
            entity.doTeleportLocation("city", "field1", 7, 7);
        }
    }
}

module.exports = Teleporter_City;