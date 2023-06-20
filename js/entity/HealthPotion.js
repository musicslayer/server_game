const Entity = require("./Entity.js");

class HealthPotion extends Entity {
    id = "health_potion";
    maxStackSize = 20;
    
    healthReward = 40;

    doInteract(entity) {
        // The item will be collected.
        if(entity.inventory) {
            entity.doAddToInventory(this);
        }
    }

    canConsume(entity) {
        return entity.health < entity.maxHealth;
    }

    doConsume(entity) {
        entity.addHealth(this.healthReward);
    }
}

module.exports = HealthPotion;