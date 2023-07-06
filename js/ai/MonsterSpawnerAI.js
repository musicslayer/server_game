const AI = require("./AI.js");
const ServerTask = require("../server/ServerTask.js");

class MonsterSpawnerAI extends AI {
    generateNextActivity(monsterSpawner) {
        // If we are not at the max number of monsters, spawn a new one.
        if(monsterSpawner.monsterCount < monsterSpawner.maxMonsterCount) {
            let serverTask = new ServerTask((monsterSpawner) => {
                let monster = monsterSpawner.createMonsterInstance();
                monsterSpawner.doSpawnEntity(monster);
                monsterSpawner.onMonsterSpawn();
            }, monsterSpawner);
    
            monsterSpawner.getServerScheduler().scheduleTask(undefined, 0, serverTask);
        }

        let serverTask2 = new ServerTask((monsterSpawner) => {
            monsterSpawner.ai.generateNextActivity(monsterSpawner);
        }, monsterSpawner);

        monsterSpawner.getServerScheduler().scheduleTask(undefined, monsterSpawner.spawnTime, serverTask2);
    }
}

module.exports = MonsterSpawnerAI;