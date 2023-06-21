const Entity = require("./Entity.js");
const EntitySpawner = require("./EntitySpawner.js");

class Monster extends Entity {
    id = "monster";

    health = 70;
    maxHealth = 100;
    experienceReward = 20;

    isTangible = true;
    blocksMovement = true;

    doTakeDamage(entity, damage) {
        this.health = Math.max(this.health - damage, 0);

        if(this.health === 0) {
            this.getRootEntity(entity).doAddExperience(this.experienceReward);
            this.doSpawnLoot(this.screen, this.x, this.y);
            this.doDespawn();
        }
    }

    doSpawnLoot(screen, x, y) {
        EntitySpawner.spawnTimed("gold", 100, screen, x, y);
    }
}

module.exports = Monster;