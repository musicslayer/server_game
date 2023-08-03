const Screen = require("../Screen.js");

class InstanceScreen extends Screen {
    // An instance screen will be removed if there are no more players left on it.
    registeredPlayers = [];

    registerEntity(entity) {
        if(entity.isPlayer) {
            this.registeredPlayers.push(entity);
        }
    }

    deregisterEntity(entity) {
        if(entity.isPlayer) {
            let index = this.registeredPlayers.indexOf(entity);
            this.registeredPlayers.splice(index, 1);

            if(this.registeredPlayers.length === 0) {
                this.map.removeScreen(this);
            }
        }
    }
}

module.exports = InstanceScreen;