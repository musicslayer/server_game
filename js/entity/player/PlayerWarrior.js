const Player = require("./Player");

class PlayerWarrior extends Player {
    getImageName() {
        return "player_warrior";
    }
}

module.exports = PlayerWarrior;