const Entity = require("./Entity.js");
const ImageCatalog = require("../image/ImageCatalog.js");

class HealthPotion extends Entity {
    healthReward;

    constructor() {
        super();
        this.id = "health_potion";
        this.healthReward = 40;
    }

    getImages() {
        let images = [];

        images.push({
            x: this.x,
            y: this.y,
            image: ImageCatalog.IMAGE_CATALOG.getImageTableByName("item").getImageByName("potion_health")
        });

        return images;
    }

    doInteract(entity) {
        // The item will be collected.
        if(entity.hasInventory) {
            entity.addToInventory(this);
            this.doDespawn();
        }
    }

    doConsume(entity) {
        // The item will be eliminated from the inventory and restore the player's health.
        // TODO Potions cannot be used if the player has full health/mana/invincibility.
        // TODO Cool down.
        entity.addHealth(this.healthReward);
        entity.removeFromInventory(this);
    }
}

module.exports = HealthPotion;