const Entity = require("../Entity.js");

class RevivePortal extends Entity {
    getName() {
        return "Revive Portal";
    }

    getEntityName() {
        return "portal_teleporter";
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