const Entity = require("./Entity.js");
const ImageCatalog = require("../image/ImageCatalog.js");

class FireTrap extends Entity {
    damage;

    constructor() {
        super();
        this.damage = 40;
    }

    getImages() {
        let images = [];

        images.push({
            x: this.x,
            y: this.y,
            image: ImageCatalog.IMAGE_CATALOG.getImageTableByName("trap").getImageByName("fire")
        });

        return images;
    }

    doInteract(entity) {
        // Do some damage to the other entity, and then this entity will despawn.
        entity.doTakeDamage(this, this.damage);
        this.doDespawn();
    }
}

module.exports = FireTrap;