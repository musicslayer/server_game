const Entity = require("../Entity.js");

class HealthPotion extends Entity {
    maxStackSize = 20;
    
    healthReward = 40;

    getName() {
        return "Health Potion";
    }

    getEntityName() {
        return "item_healthpotion";
    }

    getInfo() {
        return "A potion that restores your health.";
    }

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
        entity.doAddHealth(this.healthReward);
    }
}

module.exports = HealthPotion;