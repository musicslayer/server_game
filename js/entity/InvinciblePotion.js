const Entity = require("./Entity.js");
const ImageCatalog = require("../image/ImageCatalog.js");

class InvinciblePotion extends Entity {
    invincibleSeconds;

    constructor() {
        super();
        this.id = "invincible_potion";
        this.invincibleSeconds = 10;
    }

    getImages() {
        let images = [];

        images.push({
            x: this.x,
            y: this.y,
            image: ImageCatalog.IMAGE_CATALOG.getImageTableByName("item").getImageByName("potion_invincible")
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
        // The item will be eliminated from the inventory and make the player invincible.
        entity.makeInvincible(this.invincibleSeconds);
        entity.removeFromInventory(this);
    }
}

module.exports = InvinciblePotion;