const AI = require("./AI.js");
const ServerTask = require("../server/ServerTask.js");

class SpawnerAI extends AI {
    generateNextActivity(spawner) {
        // If we are not at the max number of entities, spawn a new one.
        if(!spawner.isSpawned) {
            return;
        }

        if(spawner.entityCount < spawner.maxEntityCount) {
            let serverTask = new ServerTask(undefined, 0, 1, "spawn_entity", spawner);
            spawner.getServer().scheduleTask(serverTask);
        }

        let serverTask2 = new ServerTask(undefined, spawner.spawnTime, 1, "ai_generate_next_activity", spawner);
        spawner.getServer().scheduleTask(serverTask2);
    }
}

module.exports = SpawnerAI;