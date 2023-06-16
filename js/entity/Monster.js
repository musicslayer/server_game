const { createCanvas, Image } = require("canvas")

const ImageCatalog = require("../image/ImageCatalog.js");
const Entity = require("./Entity.js");
const EntitySpawner = require("./EntitySpawner.js");

class Monster extends Entity {
    health = 70;
    maxHealth = 100;
    experienceReward = 20;

    isTangible = true;
    blocksMovement = true;

    constructor() {
        super();
        this.id = "monster";
    }

    doTakeDamage(entity, damage) {
        this.health = Math.max(this.health - damage, 0);

        if(this.health === 0) {
            this.getRootEntity(entity).doAddExperience(this.experienceReward);
            this.doSpawnLoot(this.world, this.map, this.screen, this.x, this.y);
            this.doDespawn();
        }
    }

    doSpawnLoot(world, map, screen, x, y) {
        EntitySpawner.spawn("gold", world, map, screen, x, y, 100);
    }

    getImages() {
        let images = [];

        images.push({
            x: this.x + this.animationShiftX,
            y: this.y + this.animationShiftY,
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
            x: this.x + this.animationShiftX,
            y: this.y + this.animationShiftY,
            image: healthBarImage
        });

        return images;
    }
}

module.exports = Monster;