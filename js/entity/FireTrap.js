const Entity = require("./Entity.js");
const ImageCatalog = require("../image/ImageCatalog.js");

class FireTrap extends Entity {
    id = "fire_trap";
    
    damage = 40;

    getImages() {
        let images = [];

        images.push({
            x: this.x + this.animationShiftX,
            y: this.y + this.animationShiftY,
            image: ImageCatalog.IMAGE_CATALOG.getImageTableByName("trap").getImageByName("fire")
        });

        return images;
    }

    doInteract(entity) {
        // Do some damage to the other entity, and then this entity will despawn.
        if(entity.isTangible) {
            entity.doTakeDamage(this, this.damage);
            this.doDespawn();
        }
    }
}

module.exports = FireTrap;