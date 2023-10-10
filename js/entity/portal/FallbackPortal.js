const Entity = require("../Entity.js");

class FallbackPortal extends Entity {
    getName() {
        return "Fallback Portal";
    }

    getInfo() {
        return "A portal back into the game.";
    }

    doInteract(entity) {
        // Teleport a player to a fixed location that exists in every world.
        if(entity.isPlayer) {
            entity.doTeleportFallbackLocation();
        }
    }
}

module.exports = FallbackPortal;