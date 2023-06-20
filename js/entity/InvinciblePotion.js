const Entity = require("./Entity.js");
//const ImageCatalog = require("../image/ImageCatalog.js");

class InvinciblePotion extends Entity {
    id = "invincible_potion";
    maxStackNumber = 1;
    maxStackSize = 20;
    
    invincibleSeconds = 10;

    /*
    getEntityImages() {
        let images = [];

        images.push({
            x: this.x + this.animationShiftX,
            y: this.y + this.animationShiftY,
            image: ImageCatalog.IMAGE_CATALOG.getImageTableByName("item").getImageByName("potion_invincible")
        });

        return images;
    }
    */

    doInteract(entity) {
        // The item will be collected.
        if(entity.inventory) {
            entity.doAddToInventory(this);
        }
    }

    canConsume(entity) {
        return !entity.isInvincible;
    }

    doConsume(entity) {
        entity.makeInvincible(this.invincibleSeconds);
    }
}

module.exports = InvinciblePotion;