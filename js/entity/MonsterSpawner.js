const Entity = require("./Entity.js");
const EntityFactory = require("./EntityFactory.js");

class MonsterSpawner extends Entity {
    id = "monster_spawner";

    spawnTime = 3; // Seconds to spawn a new monster after one dies.
    maxMonsterCount = 4;

    getName() {
        // This entity is hidden.
        return undefined;
    }

    getInfo() {
        // This entity is hidden.
        return undefined;
    }

    doSpawn() {
        super.doSpawn();

        // Initial spawn of monsters.
        for(let i = 0; i < this.maxMonsterCount; i++) {
            this.doSpawnMonster();
        }
    }

    onMonsterDeath() {
        // When a monster dies, start a timer to spawn another one.
        this.getServer().addTask(this.spawnTime, () => {
            this.doSpawnMonster();
        })
    }

    doSpawnMonster() {
        let monster = EntityFactory.createInstance("monster", 1);
        monster.screen = this.screen;
        monster.x = this.x;
        monster.y = this.y;

        this.doCreateEntity(monster);
    }
}

module.exports = MonsterSpawner;