const Entity = require("../Entity.js");

class FireTrap extends Entity {
    damage = 40;

    getName() {
        return "Fire Trap";
    }

    getImageName() {
        return "trap_fire";
    }

    getInfo() {
        return "A device that inflicts harm upon stepping on it.";
    }

    doInteract(entity) {
        // Do some damage to the other entity, and then this entity will despawn.
        if(entity.isTangible) {
            entity.doTakeDamage(this, this.damage);
            this.doDespawn();
        }
    }
}

module.exports = FireTrap;