const { createCanvas, Image } = require("canvas")

const ImageCatalog = require("../image/ImageCatalog.js");
const Entity = require("./Entity.js");
const Inventory = require("../client/Inventory.js");
const Projectile = require("./Projectile.js");

class Player extends Entity {
    health = 70;
    maxHealth = 100;

    mana = 20;
    maxMana = 100;

    level = 1;
    experience = 0;

    inventory = new Inventory();
    
    action() {
        let projectile = new Projectile(this, this.direction, 8, false);
        projectile.spawn(this.world, this.map, this.screen, this.x, this.y);
    }

    doTakeDamage(entity, damage) {
        this.health -= damage;
        // TODO Check if the entity has died and despawn/show death screen.
        // TODO In PvP, "entity" should gain experience.
    }

    teleportHome() {
        this.teleport(this.world, this.world.gameMaps[0], this.world.gameMaps[0].screens[0], 0, 0);
    }

    experienceBoost() {
        this.addExperience(10);
    }

    doAddExperience(experience) {
        this.experience += experience;

        if(this.experience >= 100) {
            this.experience -= 100;
            this.level++; 
        }
    }

    doAddHealth(health) {
        this.health = Math.min(this.health + health, this.maxHealth);
    }

    doAddMana(mana) {
        this.mana = Math.min(this.mana + mana, this.maxMana);
    }

    doInteract() {
        console.log("Another Player!");
    }

    addToInventory(entity) {
        this.inventory.addToInventory(entity);
    }

    removeFromInventory(entity) {
        this.inventory.removeFromInventory(entity);
    }

    shiftInventorySlotForward() {
        inventory.shiftInventorySlotForward();
    }

    shiftInventorySlotBackward() {
        inventory.shiftInventorySlotBackward();
    }

    getImages() {
        // For now, just use the "player/mage" image.
        let images = [];

        images.push({
            x: this.x,
            y: this.y,
            image: ImageCatalog.IMAGE_CATALOG.getImageTableByName("player").getImageByName("mage")
        });

        // Add on health bar.
        images.push({
            x: this.x,
            y: this.y,
            image: this.getHealthBarImage()
        });

        // Add on mana bar.
        images.push({
            x: this.x,
            y: this.y,
            image: this.getManaBarImage()
        });

        // Add on experience bar.
        images.push({
            x: this.x,
            y: this.y,
            image: this.getExperienceBarImage()
        });

        // Add on the level.
        images.push({
            x: this.x,
            y: this.y,
            image: this.getLevelImage()
        });

        return images;
    }

    getHealthBarImage() {
        let healthFraction = this.health / this.maxHealth;

        let canvas = createCanvas(128, 128);
        let ctx = canvas.getContext("2d");

        ctx.fillStyle = "#222222";
        ctx.fillRect(20, 0, 88, 20);

        ctx.fillStyle = "#ff0000";
        ctx.fillRect(20, 0, 88 * healthFraction, 20);

        const buffer = canvas.toBuffer("image/png");

        let image = new Image();
        image.src = buffer;

        return image;
    }

    getManaBarImage() {
        let manaFraction = this.mana / this.maxMana;

        let canvas = createCanvas(128, 128);
        let ctx = canvas.getContext("2d");

        ctx.fillStyle = "#222222";
        ctx.fillRect(20, 20, 88, 20);

        ctx.fillStyle = "#0000ff";
        ctx.fillRect(20, 20, 88 * manaFraction, 20);

        const buffer = canvas.toBuffer("image/png");

        let image = new Image();
        image.src = buffer;

        return image;
    }

    getExperienceBarImage() {
        let experienceFraction = this.experience / 100;

        let canvas = createCanvas(128, 128);
        let ctx = canvas.getContext("2d");

        ctx.fillStyle = "#222222";
        ctx.fillRect(20, 40, 88, 20);

        ctx.fillStyle = "#00ff00";
        ctx.fillRect(20, 40, 88 * experienceFraction, 20);

        const buffer = canvas.toBuffer("image/png");

        let image = new Image();
        image.src = buffer;

        return image;
    }

    getLevelImage() {
        let canvas = createCanvas(128, 128);
        let ctx = canvas.getContext("2d");

        ctx.font = "30px Arial";
        ctx.fillText("Level: " + this.level, 20, 80);

        const buffer = canvas.toBuffer("image/png");

        let image = new Image();
        image.src = buffer;

        return image;
    }



    //onLeftClick(slot) {
    //    // TODO Allow player to change order of items, display info about item?
    //}

    consumeFromInventory(slot) {
        // Consume 1 item in this inventory slot.
        let itemData = this.inventory.itemDataArray[slot];
        if(itemData) {
            itemData.item.consume(this);
        }
    }
}

module.exports = Player;