const Entity = require("./Entity.js");
const ImageCatalog = require("../image/ImageCatalog.js");

class ManaPotion extends Entity {
    id = "mana_potion";
    maxStackNumber = 1;
    maxStackSize = 20;

    manaReward = 40;

    getImages() {
        let images = [];

        images.push({
            x: this.x + this.animationShiftX,
            y: this.y + this.animationShiftY,
            image: ImageCatalog.IMAGE_CATALOG.getImageTableByName("item").getImageByName("potion_mana")
        });

        return images;
    }

    doInteract(entity) {
        // The item will be collected.
        if(entity.inventory) {
            entity.doAddToInventory(this);
        }
    }

    canConsume(entity) {
        return entity.mana < entity.maxMana;
    }

    doConsume(entity) {
        entity.addMana(this.manaReward);
    }
}

module.exports = ManaPotion;