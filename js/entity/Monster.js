const Entity = require("./Entity.js");

class Monster extends Entity {
    id = "monster";

    health = 70;
    maxHealth = 100;
    experienceReward = 20;

    isTangible = true;
    blocksMovement = true;

    getName() {
        return "Monster";
    }

    getInfo() {
        return "A creature that you can kill for loot and experience.";
    }

    doTakeDamage(entity, damage) {
        this.health = Math.max(this.health - damage, 0);

        if(this.health === 0) {
            this.getRootEntity(entity).doAddExperience(this.experienceReward);
            this.doSpawnLoot(this.screen, this.x, this.y);
            this.doDespawn();
        }
    }

    doSpawnLoot(screen, x, y) {
        this.getWorld().spawnLoot("gold", 100, screen, x, y);
    }
}

module.exports = Monster;