const Spawner = require("./Spawner.js");

class FireTrapSpawner extends Spawner {
    spawnTime = 0.1;
    maxEntityCount = 1;

    getName() {
        return "Fire Trap Spawner";
    }

    getImageName() {
        return "spawner_firetrapspawner";
    }

    getInfo() {
        return "A place where fire traps spawn from.";
    }

    getSpawnEntityName() {
        return "FireTrap";
    }
}

module.exports = FireTrapSpawner;