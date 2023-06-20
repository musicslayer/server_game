const Entity = require("./Entity.js");
//const ImageCatalog = require("../image/ImageCatalog.js");

class Wall extends Entity {
    isTangible = true;
    blocksMovement = true;
    blocksAction = true;

    constructor() {
        super();
        this.id = "wall";
    }

    /*
    getEntityImages() {
        let images = [];

        images.push({
            x: this.x + this.animationShiftX,
            y: this.y + this.animationShiftY,
            image: ImageCatalog.IMAGE_CATALOG.getImageTableByName("wall").getImageByName("wall")
        });

        return images;
    }
    */
}

module.exports = Wall;