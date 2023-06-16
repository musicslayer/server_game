const Entity = require("./Entity.js");
const ImageCatalog = require("../image/ImageCatalog.js");

class PVPToken extends Entity {
    id = "pvp_token";
    maxStackNumber = 1;
    maxStackSize = 10000;

    getImages() {
        let images = [];

        images.push({
            x: this.x + this.animationShiftX,
            y: this.y + this.animationShiftY,
            image: ImageCatalog.IMAGE_CATALOG.getImageTableByName("item").getImageByName("token_pvp")
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
        // These can only be traded, not consumed.
        return false;
    }

    doConsume(entity) {
        entity.addHealth(this.healthReward);
    }
}

module.exports = PVPToken;