const Entity = require("../Entity.js");

class InvinciblePotion extends Entity {
    maxStackNumber = 1;
    maxStackSize = 20;
    
    invincibleSeconds = 10;

    getName() {
        return "Invincible Potion";
    }

    getEntityName() {
        return "item_invinciblepotion";
    }

    getInfo() {
        return "A potion that makes you invincible for a limited time.";
    }

    doInteract(entity) {
        // The item will be collected.
        if(entity.inventory) {
            entity.doAddToInventory(this);
        }
    }

    canConsume(entity) {
        return !entity.isStatus("invincible");
    }

    doConsume(entity) {
        entity.doMakeInvincible(this.invincibleSeconds);
    }
}

module.exports = InvinciblePotion;