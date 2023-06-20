const Entity = require("./Entity.js");

class RevivePortal extends Entity {
    id = "revive_portal";

    doInteract(entity) {
        // Teleport a player home and revive them.
        if(entity.isPlayer) {
            entity.revive();
            entity.teleportHome();
        }
    }
}

module.exports = RevivePortal;