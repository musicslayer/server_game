const Entity = require("../Entity.js");
const Spawner = require("./Spawner.js");

class InvinciblePotionSpawner extends Spawner {
    spawnTime = 60;
    maxEntityCount = 1;

    getName() {
        return "Invincible Potion Spawner";
    }

    getImageName() {
        return "spawner_itemspawner";
    }

    getInfo() {
        return "A place where invincible potions spawn from.";
    }

    createEntityInstance() {
        let entity = Entity.createInstance("InvinciblePotion", 1);
        entity.setScreen(this.screen);
        entity.x = this.x;
        entity.y = this.y;
        
        return entity;
    }
}

module.exports = InvinciblePotionSpawner;