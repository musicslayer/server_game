const { createCanvas, Image } = require("canvas")

const ImageCatalog = require("../image/ImageCatalog.js");
const Entity = require("./Entity.js");

class Monster extends Entity {
    health = 70;
    maxHealth = 100;
    experienceReward = 20;

    doTakeDamage(entity, damage) {
        this.health -= damage;
        if(this.health <= 0) {
            this.doDespawn();
            this.getRootEntity(entity).doAddExperience(this.experienceReward);
        }
    }

    doInteract(entity) {
        console.log("Outta my way!");
    }

    getImages() {
        let images = [];

        images.push({
            x: this.x,
            y: this.y,
            image: ImageCatalog.IMAGE_CATALOG.getImageTableByName("creature").getImageByName("monster")
        });

        // Add on a health bar.
        let healthFraction = this.health / this.maxHealth;

        let canvas = createCanvas(128, 128);
        let ctx = canvas.getContext("2d");

        ctx.fillStyle = "#222222";
        ctx.fillRect(20, 0, 88, 20);

        ctx.fillStyle = "#ff0000";
        ctx.fillRect(20, 0, 88 * healthFraction, 20);

        const buffer = canvas.toBuffer("image/png");

        let healthBarImage = new Image();
        healthBarImage.src = buffer;
        
        images.push({
            x: this.x,
            y: this.y,
            image: healthBarImage
        });

        return images;
    }
}

module.exports = Monster;