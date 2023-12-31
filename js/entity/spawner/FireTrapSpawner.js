const Entity = require("../Entity.js");
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

    createEntityInstance() {
        let entity = Entity.createInstance("FireTrap", 1);
        entity.setScreen(this.screen);
        entity.x = this.x;
        entity.y = this.y;
        
        return entity;
    }
}

module.exports = FireTrapSpawner;