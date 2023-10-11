const Entity = require("../Entity.js");

class HomePortal extends Entity {
    getName() {
        return "Home Portal";
    }

    getEntityName() {
        return "portal_teleporter";
    }

    getInfo() {
        return "A portal home.";
    }

    doInteract(entity) {
        // Teleport a player home.
        if(entity.isPlayer) {
            entity.doTeleportHome();
        }
    }
}

module.exports = HomePortal;