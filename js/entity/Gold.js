const { createCanvas, Image } = require("canvas")

const Entity = require("./Entity.js");
const ImageCatalog = require("../image/ImageCatalog.js");

class Gold extends Entity {
    id = "gold";

    goldReward;

    constructor(goldReward) {
        super();
        this.goldReward = goldReward;
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

    getImages() {
        let images = [];

        images.push({
            x: this.x + this.animationShiftX,
            y: this.y + this.animationShiftY,
            image: ImageCatalog.IMAGE_CATALOG.getImageTableByName("item").getImageByName("gold")
        });

        images.push({
            x: this.x + this.animationShiftX,
            y: this.y + this.animationShiftY,
            image: this.getGoldRewardImage()
        });

        return images;
    }

    getGoldRewardImage() {
        let canvas = createCanvas(128, 128);
        let ctx = canvas.getContext("2d");

        ctx.font = "30px Arial";
        ctx.fillText("" + this.goldReward, 0, 20);

        const buffer = canvas.toBuffer("image/png");

        let image = new Image();
        image.src = buffer;

        return image;
    }
}

module.exports = Gold;