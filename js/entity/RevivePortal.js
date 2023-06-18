const Entity = require("./Entity.js");
const ImageCatalog = require("../image/ImageCatalog.js");

class RevivePortal extends Entity {
    id = "revive_portal";

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
        // Teleport a player home and revive them.
        if(entity.isPlayer) {
            entity.revive();
            entity.teleportHome();
        }
    }
}

module.exports = RevivePortal;