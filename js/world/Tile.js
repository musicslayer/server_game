//const ImageCatalog = require("../image/ImageCatalog.js");

class Tile {
    x;
    y;

    imageTableNameArray;
    imageNameArray;

    constructor(imageTableNameArray, imageNameArray) {
        this.imageTableNameArray = imageTableNameArray;
        this.imageNameArray = imageNameArray;
    }

    /*
    getImages() {
        let images = [];

        for(let i = 0; i < this.imageTableNameArray.length; i++) {
            images.push({
                x: this.x,
                y: this.y,
                image: ImageCatalog.IMAGE_CATALOG.getImageTableByName(this.imageTableNameArray[i]).getImageByName(this.imageNameArray[i])
            });
        }

        return images;
    }
    */
}

module.exports = Tile;