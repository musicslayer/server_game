const Entity = require("../Entity.js");
const MonsterSpawnerAI = require("../../ai/MonsterSpawnerAI.js");

class MonsterSpawner extends Entity {
    isAI = true;
    ai = new MonsterSpawnerAI();

    spawnTime = 3; // Seconds to spawn a new monster after one dies.
    monsterCount = 0;
    maxMonsterCount = 4;

    doSpawn() {
        super.doSpawn();

        // Monster spawner activities are controlled by an AI class.
        this.ai.generateNextActivity(this);
    }

    onMonsterDespawn() {
        this.monsterCount--;
    }

    onMonsterSpawn() {
        this.monsterCount++;
    }

    createMonsterInstance() {
        let monster = Entity.createInstance("Monster", 1);
        monster.setScreen(this.screen);
        monster.x = this.x;
        monster.y = this.y;
        
        return monster;
    }
}

module.exports = MonsterSpawner;