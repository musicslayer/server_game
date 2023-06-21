const Entity = require("./Entity.js");

class ManaPotion extends Entity {
    id = "mana_potion";
    maxStackNumber = 1;
    maxStackSize = 20;

    manaReward = 40;

    getName() {
        return "Mana Potion";
    }

    getInfo() {
        return "A potion that restores your mana.";
    }

    doInteract(entity) {
        // The item will be collected.
        if(entity.inventory) {
            entity.doAddToInventory(this);
        }
    }

    canConsume(entity) {
        return entity.mana < entity.maxMana;
    }

    doConsume(entity) {
        entity.addMana(this.manaReward);
    }
}

module.exports = ManaPotion;