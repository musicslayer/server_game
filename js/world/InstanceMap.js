const GameMap = require("./GameMap.js");

class InstanceMap extends GameMap {
    removeScreen(screen) {
        super.removeScreen(screen);

        // If there are no more instance screens left, then this instance map no longer needs to exist.
        if(this.screens.length === 0) {
            this.world.removeMap(this);
        }
    }
}

module.exports = InstanceMap;