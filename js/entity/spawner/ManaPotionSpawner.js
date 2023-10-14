const Entity = require("../Entity.js");
const Spawner = require("./Spawner.js");

class ManaPotionSpawner extends Spawner {
    spawnTime = 60;
    maxEntityCount = 1;

    getName() {
        return "Mana Potion Spawner";
    }

    getImageName() {
        return "spawner_itemspawner";
    }

    getInfo() {
        return "A place where mana potions spawn from.";
    }

    createEntityInstance() {
        let entity = Entity.createInstance("ManaPotion", 1);
        entity.setScreen(this.screen);
        entity.x = this.x;
        entity.y = this.y;
        
        return entity;
    }
}

module.exports = ManaPotionSpawner;