const Constants = require("../../constants/Constants.js");
const Entity = require("../Entity.js");

class StartPortal extends Entity {
    getName() {
        return "Start Portal";
    }

    getImageName() {
        return "portal_teleporter";
    }

    getInfo() {
        return "A portal to the start of the game.";
    }

    doInteract(entity) {
        // Set the player's home location to the game's start location and then teleport them there.
        if(entity.isPlayer) {
            entity.homeMapName = Constants.start.START_LOCATION_MAP_NAME;
            entity.homeScreenName = Constants.start.START_LOCATION_SCREEN_NAME;
            entity.homeX = Constants.start.START_LOCATION_X;
            entity.homeY = Constants.start.START_LOCATION_Y;

            entity.doTeleportHome();
        }
    }
}

module.exports = StartPortal;