const Entity = require("../Entity.js");
const Spawner = require("./Spawner.js");

class GoldSpawner extends Spawner {
    spawnTime = 60;
    maxEntityCount = 1;

    getName() {
        return "Gold Spawner";
    }

    getImageName() {
        return "spawner_goldspawner";
    }

    getInfo() {
        return "A place where gold spawns from.";
    }

    createEntityInstance() {
        let entity = Entity.createInstance("Gold", 1000);
        entity.setScreen(this.screen);
        entity.x = this.x;
        entity.y = this.y;
        
        return entity;
    }
}

module.exports = GoldSpawner;