const Entity = require("../Entity.js");
const Spawner = require("./Spawner.js");

class ManaRegenPotionSpawner extends Spawner {
    spawnTime = 60;
    maxEntityCount = 1;

    getName() {
        return "Mana Regen Potion Spawner";
    }

    getImageName() {
        return "spawner_itemspawner";
    }

    getInfo() {
        return "A place where mana regen potions spawn from.";
    }

    createEntityInstance() {
        let entity = Entity.createInstance("ManaRegenPotion", 1);
        entity.setScreen(this.screen);
        entity.x = this.x;
        entity.y = this.y;
        
        return entity;
    }
}

module.exports = ManaRegenPotionSpawner;