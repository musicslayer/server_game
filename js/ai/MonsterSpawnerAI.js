const AI = require("./AI.js");
const ServerTask = require("../server/ServerTask.js");

class MonsterSpawnerAI extends AI {
    generateNextActivity(monsterSpawner) {
        // If we are not at the max number of monsters, spawn a new one.
        if(!monsterSpawner.isSpawned) {
            return;
        }

        if(monsterSpawner.monsterCount < monsterSpawner.maxMonsterCount) {
            let serverTask = new ServerTask("spawn_monster", monsterSpawner);
            monsterSpawner.getServer().scheduleTask(undefined, 0, 1, serverTask);
        }

        let serverTask2 = new ServerTask("ai_generate_next_activity", monsterSpawner);
        monsterSpawner.getServer().scheduleTask(undefined, monsterSpawner.spawnTime, 1, serverTask2);
    }
}

module.exports = MonsterSpawnerAI;