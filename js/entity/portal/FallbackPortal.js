const Constants = require("../../constants/Constants.js");
const Entity = require("../Entity.js");

class FallbackPortal extends Entity {
    getName() {
        return "Fallback Portal";
    }

    getEntityName() {
        return "portal_teleporter";
    }

    getInfo() {
        return "A portal back into the game.";
    }

    doInteract(entity) {
        // Teleport a player to the fallback location.
        // This location is hardcoded to somewhere that exists and is safe.
        if(entity.isPlayer) {
            let fallbackLocationMap = entity.screen.map.world.getMapByName(Constants.fallback.FALLBACK_LOCATION_MAP_NAME);
            let fallbackLocationScreen = fallbackLocationMap?.getScreenByName(Constants.fallback.FALLBACK_LOCATION_SCREEN_NAME);
            let fallbackLocationX = Constants.fallback.FALLBACK_LOCATION_X;
            let fallbackLocationY = Constants.fallback.FALLBACK_LOCATION_Y;

            // If the fallback target location cannot be found, then do nothing.
            // Players will remain trapped on the fallback map until this is fixed.
            if(fallbackLocationScreen) {
                entity.doTeleport(fallbackLocationScreen, fallbackLocationX, fallbackLocationY);
            }
        }
    }
}

module.exports = FallbackPortal;