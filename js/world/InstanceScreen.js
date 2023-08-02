const Screen = require("./Screen.js");

class InstanceScreen extends Screen {
    registeredPlayers = [];

    registerEntity(entity) {
        if(entity.isPlayer) {
            this.registeredPlayers.push(entity);
        }
    }

    deregisterEntity(entity) {
        // When a player leaves and the instance has no more players left, the instance can be removed.
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