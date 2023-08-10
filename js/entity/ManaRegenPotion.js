const Entity = require("./Entity.js");
const ServerTask = require("../server/ServerTask.js");

class ManaRegenPotion extends Entity {
    maxStackSize = 20;
    
    // Restore 4 mana per second up to 10 times.
    manaReward = 4;
    manaTime = 1;
    manaCount = 10;

    getName() {
        return "Mana Regen Potion";
    }

    getInfo() {
        return "A potion that restores your mana over time.";
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
        // Register regen task.
        let serverTask = new ServerTask(undefined, this.manaTime, this.manaCount, "add_mana", entity, this.manaReward);

        entity.ownServerTask(serverTask);
        this.getServer().scheduleTask(serverTask);
    }
}

module.exports = ManaRegenPotion;