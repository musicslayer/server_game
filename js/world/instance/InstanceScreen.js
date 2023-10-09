const Screen = require("../Screen.js");

class InstanceScreen extends Screen {
    // An instance screen will be removed if there are no more players left on it.
    notifyPlayerRemoval() {
        if(this.getPlayerCount() === 0) {
            this.map.removeScreen(this);
        }

        super.notifyPlayerRemoval();
    }
}

module.exports = InstanceScreen;