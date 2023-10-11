const Player = require("./Player");

class PlayerMage extends Player {
    getEntityName() {
        return "player_mage";
    }
}

module.exports = PlayerMage;