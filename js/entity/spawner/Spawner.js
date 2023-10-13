const Entity = require("../Entity.js");
const SpawnerAI = require("../../ai/SpawnerAI.js");

// Subclasses can spawn other entities at a fixed time interval.
class Spawner extends Entity {
    ai = new SpawnerAI();

    spawnTime = 3; // Seconds between checking if a new entity can be spawned.
    entityCount = 0;
    maxEntityCount = 0; // Subclasses must redefine this to be a positive number.

    isVisible() {
        // By default, spawners are never visible.
        return false;
    }

    doSpawn() {
        super.doSpawn();

        // Spawner activities are controlled by an AI class.
        this.ai.generateNextActivity(this);
    }

    onEntityDespawn() {
        this.entityCount--;
    }

    onEntitySpawn() {
        this.entityCount++;
    }

    createEntityInstance() {
        let entity = Entity.createInstance(this.getSpawnEntityName(), 1);
        entity.setScreen(this.screen);
        entity.x = this.x;
        entity.y = this.y;
        
        return entity;
    }
}

module.exports = Spawner;