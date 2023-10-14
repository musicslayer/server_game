const Entity = require("../Entity.js");
const Spawner = require("./Spawner.js");

class InvisiblePotionSpawner extends Spawner {
    spawnTime = 60;
    maxEntityCount = 1;

    getName() {
        return "Invisible Potion Spawner";
    }

    getImageName() {
        return "spawner_itemspawner";
    }

    getInfo() {
        return "A place where invisible potions spawn from.";
    }

    createEntityInstance() {
        let entity = Entity.createInstance("InvisiblePotion", 1);
        entity.setScreen(this.screen);
        entity.x = this.x;
        entity.y = this.y;
        
        return entity;
    }
}

module.exports = InvisiblePotionSpawner;