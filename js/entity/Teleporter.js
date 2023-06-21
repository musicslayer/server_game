const Entity = require("./Entity.js");

class Teleporter extends Entity {
    id = "teleporter";

    getName() {
        return "Teleporter";
    }

    getInfo() {
        return "A portal to another location.";
    }

    doInteract(entity) {
        // Teleport a player home.
        if(entity.isPlayer) {
            entity.teleportHome();
        }
    }
}

module.exports = Teleporter;