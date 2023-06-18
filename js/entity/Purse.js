const { createCanvas, Image } = require("canvas")

const ImageCatalog = require("../image/ImageCatalog.js");

class Purse {
    maxGoldTotel = 100000;
    goldTotal = 0;

    isActive = true;

    turnOn() {
        this.isActive = true;
    }

    turnOff() {
        this.isActive = false;
    }

    addToPurse(gold) {
        let N = Math.min(gold.stackSize, this.maxGoldTotel - this.goldTotal);

        gold.stackSize -= N;
        this.goldTotal += N;
    }

    removeFromPurse(goldAmount) {
        this.goldTotal -= goldAmount;
    }

    getPurseImages() {
        // Returns an array of all the images that should be drawn on this screen.
        let images = [];

        // Add on the gold image.
        images.push({
            x: 0,
            y: 0,
            image: ImageCatalog.IMAGE_CATALOG.getImageTableByName("item").getImageByName("gold")
        });

        // Add on the gold total.
        images.push({
            x: 1,
            y: 0,
            image: this.getGoldTotalImage()
        });

        return images;
    }

    getGoldTotalImage() {
        let canvas = createCanvas(128, 128);
        let ctx = canvas.getContext("2d");

        ctx.font = "30px Arial";
        ctx.fillText("Gold: " + this.goldTotal, 0, 70);

        const buffer = canvas.toBuffer("image/png");

        let image = new Image();
        image.src = buffer;

        return image;
    }
}

module.exports = Purse;