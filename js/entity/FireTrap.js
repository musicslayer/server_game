const Entity = require("./Entity.js");

class FireTrap extends Entity {
    id = "fire_trap";
    damage = 40;

    doInteract(entity) {
        // Do some damage to the other entity, and then this entity will despawn.
        if(entity.isTangible) {
            entity.doTakeDamage(this, this.damage);
            this.doDespawn();
        }
    }
}

module.exports = FireTrap;