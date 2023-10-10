const Entity = require("../Entity.js");

class StartPortal extends Entity {
    getName() {
        return "Start Portal";
    }

    getInfo() {
        return "A portal to the start of the game.";
    }

    doInteract(entity) {
        // Set the player's home location to the game's start location and then teleport them there.
        if(entity.isPlayer) {
            entity.doTeleportStartLocation();
        }
    }
}

module.exports = StartPortal;