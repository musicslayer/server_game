const Entity = require("../Entity.js");

class InvisiblePotion extends Entity {
    maxStackNumber = 1;
    maxStackSize = 20;
    
    invisibleSeconds = 10;

    getName() {
        return "Invisible Potion";
    }

    getEntityName() {
        return "item_invisiblepotion";
    }

    getInfo() {
        return "A potion that makes you invisible for a limited time.";
    }

    doInteract(entity) {
        // The item will be collected.
        if(entity.inventory) {
            entity.doAddToInventory(this);
        }
    }

    canConsume(entity) {
        return !entity.isStatus("invisible");
    }

    doConsume(entity) {
        entity.doMakeStatus("invisible", this.invisibleSeconds);
    }
}

module.exports = InvisiblePotion;