const Entity = require("../Entity.js");
const Spawner = require("./Spawner.js");

class HealthPotionSpawner extends Spawner {
    spawnTime = 60;
    maxEntityCount = 1;

    getName() {
        return "Health Potion Spawner";
    }

    getImageName() {
        return "spawner_itemspawner";
    }

    getInfo() {
        return "A place where health potions spawn from.";
    }

    createEntityInstance() {
        let entity = Entity.createInstance("HealthPotion", 1);
        entity.setScreen(this.screen);
        entity.x = this.x;
        entity.y = this.y;
        
        return entity;
    }
}

module.exports = HealthPotionSpawner;