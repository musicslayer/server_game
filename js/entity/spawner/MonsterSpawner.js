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

    getSpawnEntityName() {
        return "Monster";
    }
}

module.exports = MonsterSpawner;