const Entity = require("./Entity.js");
const ImageCatalog = require("../image/ImageCatalog.js");

class HealthPotion extends Entity {
    healthReward;
    isInventory;

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
        entity.addToInventory(this);
        this.isInventory = true;
        this.doDespawn();
    }

    doConsume(entity) {
        // The item will be eliminated from the inventory and restore the player's health.
        entity.addHealth(this.healthReward);
        entity.removeFromInventory(this);
    }

    doOnLeftClick() {
        // TODO - Allow someone to move something two another inventory slot.
    }

    doOnRightClick() {

    }
}

module.exports = HealthPotion;