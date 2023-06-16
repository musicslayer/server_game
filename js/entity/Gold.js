const Entity = require("./Entity.js");
const ImageCatalog = require("../image/ImageCatalog.js");

class Gold extends Entity {
    id = "gold";

    goldReward;

    constructor(goldReward) {
        super();
        this.goldReward = goldReward;
    }

    getImages() {
        let images = [];

        images.push({
            x: this.x + this.animationShiftX,
            y: this.y + this.animationShiftY,
            image: ImageCatalog.IMAGE_CATALOG.getImageTableByName("item").getImageByName("gold")
        });

        return images;
    }

    doInteract(entity) {
        // Gold is stored in the purse instead of the inventory.
        if(entity.purse) {
            let success = entity.doAddToPurse(this.goldReward);
            if(success) {
                this.doDespawn();
            }
        }
    }
}

module.exports = Gold;