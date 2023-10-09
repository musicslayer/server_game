const GameMap = require("../GameMap.js");

class InstanceMap extends GameMap {
    // An instance map will be removed if all of its screens have no players on it.
    notifyPlayerRemoval() {
        // For performance reasons, only proceed if the entity is a player.
        if(this.getPlayerCount() === 0) {
            this.world.removeMap(this);
        }
    }
}

module.exports = InstanceMap;