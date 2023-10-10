const Entity = require("../Entity.js");

class Teleporter extends Entity {
    getName() {
        return "Teleporter";
    }

    getInfo() {
        return "A portal to another location.";
    }

    doInteract(entity) {
        // Teleport a player home.
        if(entity.isPlayer) {
            entity.doTeleportHome();
        }
    }
}

module.exports = Teleporter;