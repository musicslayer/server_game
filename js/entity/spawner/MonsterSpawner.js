const Entity = require("../Entity.js");
const Spawner = require("./Spawner.js");

class MonsterSpawner extends Spawner {
    maxEntityCount = 4;

    getName() {
        return "Monster Spawner";
    }

    getImageName() {
        return "spawner_monsterspawner";
    }

    getInfo() {
        return "A place where monsters spawn from.";
    }

    createEntityInstance() {
        let entity = Entity.createInstance("Monster", 1);
        entity.setScreen(this.screen);
        entity.x = this.x;
        entity.y = this.y;
        
        return entity;
    }
}

module.exports = MonsterSpawner;