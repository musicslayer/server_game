const Entity = require("./Entity.js");

class RevivePortal extends Entity {
    id = "revive_portal";

    getName() {
        return "Revive Portal";
    }

    getInfo() {
        return "The only escape from the death plane.";
    }

    doInteract(entity) {
        // Teleport a player home and revive them.
        if(entity.isPlayer) {
            entity.doRevive();
        }
    }
}

module.exports = RevivePortal;