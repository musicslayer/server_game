const Player = require("./Player");

class PlayerWarrior extends Player {
    getEntityName() {
        return "player_warrior";
    }
}

module.exports = PlayerWarrior;