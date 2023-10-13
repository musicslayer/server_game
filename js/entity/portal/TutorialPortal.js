const Entity = require("../Entity.js");

class TutorialPortal extends Entity {
    getName() {
        return "Tutorial Portal";
    }

    getEntityName() {
        return "portal_teleporter";
    }

    getInfo() {
        return "A portal to return to the tutorial.";
    }

    doInteract(entity) {
        // Teleport a player to the tutorial.
        if(entity.isPlayer) {
            entity.doTeleportTutorial();
        }
    }
}

module.exports = TutorialPortal;