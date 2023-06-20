const Entity = require("./Entity.js");

class Teleporter extends Entity {
    id = "teleporter";

    doInteract(entity) {
        // Teleport a player home.
        if(entity.isPlayer) {
            entity.teleportHome();
        }
    }
}

module.exports = Teleporter;