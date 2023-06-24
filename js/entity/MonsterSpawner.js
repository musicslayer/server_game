const Entity = require("./Entity.js");

class Monster extends Entity {
    id = "monster_spawner";

    spawnTime = 3;
    maxMonsterCount = 4;
    monsterCount = 0;

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
        
        // Register spawn tasks.
        this.getServer().addRefreshTask(this.spawnTime, () => {
            while(this.monsterCount < this.maxMonsterCount) {
                let monster = this.getWorld().spawn("monster", 1, this.screen, this.x, this.y)
                monster.owner = this;

                this.monsterCount++;
            }
        })
    }
}

module.exports = Monster;