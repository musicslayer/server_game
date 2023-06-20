const Entity = require("./Entity.js");
//const ImageCatalog = require("../image/ImageCatalog.js");

class DeathTrap extends Entity {
    id = "death_trap";

    /*
    getEntityImages() {
        let images = [];

        images.push({
            x: this.x + this.animationShiftX,
            y: this.y + this.animationShiftY,
            image: ImageCatalog.IMAGE_CATALOG.getImageTableByName("trap").getImageByName("death")
        });

        return images;
    }
    */

    doInteract(entity) {
        // Instantly kill the other entity (even if they are invincible).
        if(entity.isTangible) {
            entity.kill();
        }
    }
}

module.exports = DeathTrap;