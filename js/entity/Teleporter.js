const Entity = require("./Entity.js");
const ImageCatalog = require("../image/ImageCatalog.js");

class Teleporter extends Entity {
    id = "teleporter";

    getEntityImages() {
        let images = [];

        images.push({
            x: this.x + this.animationShiftX,
            y: this.y + this.animationShiftY,
            image: ImageCatalog.IMAGE_CATALOG.getImageTableByName("portal").getImageByName("teleporter")
        });

        return images;
    }

    doInteract(entity) {
        // Teleport a player home.
        if(entity.isPlayer) {
            entity.teleportHome();
        }
    }
}

module.exports = Teleporter;