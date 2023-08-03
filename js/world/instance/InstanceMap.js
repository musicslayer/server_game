const GameMap = require("../GameMap.js");

class InstanceMap extends GameMap {
    // An instance map will be removed if there are no more instance screens left on it.
    removeScreen(screen) {
        super.removeScreen(screen);
        
        if(this.screens.length === 0) {
            this.world.removeMap(this);
        }
    }
}

module.exports = InstanceMap;