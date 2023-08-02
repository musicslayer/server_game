const Screen = require("./Screen.js");

class InstanceScreen extends Screen {
    removeEntity(entity) {
        super.removeEntity(entity);

        // If there are no more players left, then this instance screen no longer needs to exist.
        // TODO If players merely log out, will this also trigger? Also teleporting also triggers it :(
        if(this.playerCount === 0) {
            this.map.removeInstanceScreen(this);
        }
    }
}

module.exports = InstanceScreen;