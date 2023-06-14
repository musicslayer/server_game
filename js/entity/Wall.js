const Entity = require("./Entity.js");
const ImageCatalog = require("../image/ImageCatalog.js");

class Wall extends Entity {
    isTangible = true;
    blocksMovement = true;

    getImages() {
        let images = [];

        images.push({
            x: this.x,
            y: this.y,
            image: ImageCatalog.IMAGE_CATALOG.getImageTableByName("wall").getImageByName("wall")
        });

        return images;
    }
}

module.exports = Wall;