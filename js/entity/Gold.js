const Entity = require("./Entity.js");
const ImageCatalog = require("../image/ImageCatalog.js");

class Gold extends Entity {
    id = "gold";
    maxStackSize = 100000;

    doInteract(entity) {
        // Gold is stored in the purse instead of the inventory.
        if(entity.purse) {
            entity.doAddToPurse(this);
        }

        /*
        if(entity.purse) {
            let success = entity.doAddToPurse(this.stackSize);
            if(success) {
                this.doDespawn();
            }
        }
        */
    }

    getEntityImages() {
        let images = [];

        images.push({
            x: this.x + this.animationShiftX,
            y: this.y + this.animationShiftY,
            image: ImageCatalog.IMAGE_CATALOG.getImageTableByName("item").getImageByName("gold")
        });

        return images;
    }
}

module.exports = Gold;