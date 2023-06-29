const Entity = require("./Entity.js");
const EntityFactory = require("./EntityFactory.js");
const MonsterSpawnerAI = require("../ai/MonsterSpawnerAI.js");

class MonsterSpawner extends Entity {
    id = "monster_spawner";

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
        let monster = EntityFactory.createInstance("monster", 1);
        monster.screen = this.screen;
        monster.x = this.x;
        monster.y = this.y;
        
        return monster;
    }
}

module.exports = MonsterSpawner;