const Entity = require("../Entity.js");

class Teleporter extends Entity {
    destinationMapName;
    destinationScreenName;
    destinationX;
    destinationY;

    getName() {
        return "Teleporter";
    }

    getEntityName() {
        return "portal_teleporter";
    }

    getInfo() {
        return "A portal to another place.";
    }

    doInteract(entity) {
        // Teleport a player only.
        if(entity.isPlayer) {
            entity.doTeleportLocation(this.destinationMapName, this.destinationScreenName, this.destinationX, this.destinationY);
        }
    }
}

module.exports = Teleporter;