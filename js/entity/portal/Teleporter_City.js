const Entity = require("../Entity.js");

class Teleporter_City extends Entity {
    getName() {
        return "Teleporter";
    }

    getInfo() {
        return "A portal to return to the city.";
    }

    doInteract(entity) {
        // Teleport a player only.
        if(entity.isPlayer) {
            // TODO Actually teleport to the city.
            entity.doTeleportHome();
        }
    }
}

module.exports = Teleporter_City;