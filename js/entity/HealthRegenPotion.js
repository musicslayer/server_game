const Entity = require("./Entity.js");
const ServerTask = require("../server/ServerTask.js");

class HealthRegenPotion extends Entity {
    maxStackSize = 20;
    
    // Restore 4 health per second up to 10 times.
    healthReward = 4;
    healthTime = 1;
    healthCount = 10;

    getName() {
        return "Health Regen Potion";
    }

    getInfo() {
        return "A potion that restores your health over time.";
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
        // Register regen task.
        let serverTask = new ServerTask((entity, healthReward) => {
            entity.doAddHealth(healthReward);
        }, entity, this.healthReward);

        entity.ownServerTask(serverTask);
        this.getServer().scheduleTask(undefined, this.healthTime, this.healthCount, serverTask);
    }
}

module.exports = HealthRegenPotion;