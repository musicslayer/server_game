const Entity = require("./Entity.js");

class DeathTrap extends Entity {
    id = "death_trap";

    doInteract(entity) {
        // Instantly kill the other entity (even if they are invincible).
        if(entity.isTangible) {
            entity.kill();
        }
    }
}

module.exports = DeathTrap;