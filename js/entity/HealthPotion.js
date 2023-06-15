const Entity = require("./Entity.js");
const ImageCatalog = require("../image/ImageCatalog.js");

class HealthPotion extends Entity {
    id = "health_potion";
    maxStackNumber = 1;
    maxStackSize = 20;
    
    healthReward = 40;

    getImages() {
        let images = [];

        images.push({
            x: this.x + this.animationShiftX,
            y: this.y + this.animationShiftY,
            image: ImageCatalog.IMAGE_CATALOG.getImageTableByName("item").getImageByName("potion_health")
        });

        return images;
    }

    doInteract(entity) {
        // The item will be collected.
        if(entity.inventory) {
            let success = entity.doAddToInventory(this);
            if(success) {
                this.doDespawn();
            }
        }
    }

    canConsume(entity) {
        return entity.health < entity.maxHealth;
    }

    doConsume(entity) {
        entity.addHealth(this.healthReward);
    }
}

module.exports = HealthPotion;