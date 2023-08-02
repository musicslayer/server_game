const GameMap = require("./GameMap.js");

class InstanceMap extends GameMap {
    removeInstanceScreen(instanceScreen) {
        super.removeInstanceScreen(instanceScreen);

        // If there are no more instance screens left, then this instance map no longer needs to exist.
        if(this.instanceScreens.length === 0) {
            this.world.removeInstanceMap(this);
        }
    }
}

module.exports = InstanceMap;