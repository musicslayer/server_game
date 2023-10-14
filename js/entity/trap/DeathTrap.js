const Entity = require("../Entity.js");

class DeathTrap extends Entity {
    getName() {
        return "Death Trap";
    }

    getImageName() {
        return "trap_death";
    }

    getInfo() {
        return "A device that inflicts certain death upon stepping on it.";
    }

    doInteract(entity) {
        // Instantly kill a player (even if they are invincible).
        if(entity.isPlayer) {
            entity.doKill();
        }
    }
}

module.exports = DeathTrap;