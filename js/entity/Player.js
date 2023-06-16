const { createCanvas, Image } = require("canvas")

const ImageCatalog = require("../image/ImageCatalog.js");
const Entity = require("./Entity.js");
const EntitySpawner = require("./EntitySpawner.js");
const Purse = require("./Purse.js");
const Inventory = require("./Inventory.js");
const Server = require("../server/Server.js");

class Player extends Entity {
    isPlayer = true;

    health = 70;
    maxHealth = 100;
    healthRegen = 3; // per second

    mana = 20;
    maxMana = 100;
    manaRegen = 1; // per second

    level = 1;
    experience = 0;

    isDead = false;
    isInvincible = false;
    isTangible = true;

    actionTime = .2;
    movementTime = .2;

    inventory = new Inventory();
    purse = new Purse();

    constructor() {
        super();
        this.id = "player";

        // Register regen tasks.
        Server.addRefresh(() => {
            if(!this.isDead) {
                this.doAddHealth(this.healthRegen)
            }
        })

        Server.addRefresh(() => {
            if(!this.isDead) {
                this.doAddMana(this.manaRegen)
            }
        })
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

    doMakeInvincible(invincibleSeconds) {
        this.isInvincible = true;
        Server.scheduleTaskForSeconds(invincibleSeconds, () => {
            this.isInvincible = false;
        });
    }

    doFullRestore() {
        this.health = this.maxHealth;
        this.mana = this.maxMana;
    }

    kill() {
        // The player cannot use their actions, inventory, or purse in this state.
        // Also teleport them to a special death plane.
        this.health = 0;
        this.mana = 0;

        this.isDead = true;
        this.isInvincible = false;

        this.inventory.turnOff();
        this.purse.turnOff();

        // ??? If the player is in a dungeon, could we just teleport them to the entrance instead?
        this.teleportDeath();
    }

    revive() {
        // Restore the player to normal.
        this.health = this.maxHealth;
        this.mana = this.maxMana;

        this.isDead = false;
        this.inventory.turnOn();
        this.purse.turnOn();
    }
    

    doTakeDamage(entity, damage) {
        if(!this.isInvincible && !this.isDead) {
            this.health = Math.max(this.health - damage, 0);
            if(this.health === 0) {
                // Only spawn loot if another player did the final damage.
                if(entity.isPlayer) {
                    this.doSpawnLoot(this.screen, this.x, this.y);
                }
                this.kill();
            }
        }
    }

    doSpawnLoot(screen, x, y) {
        // When a player dies, a pvp token is spawned as loot.
        EntitySpawner.spawn("pvp_token", screen, x, y);
    }

    doAction() {
        let x = this.x;
        let y = this.y;

        // If the player is moving, fire the projectile ahead of the motion.
        if(this.isMoving) {
            if(this.direction === "up") {
                y--;
            }
            else if(this.direction === "down") {
                y++;
            }
            else if(this.direction === "left") {
                x--;
            }
            else if(this.direction === "right") {
                x++;
            }
        }
        
        EntitySpawner.spawn("projectile", this.screen, x, y, this, this.direction, 8, false);
    }

    getImages() {
        // For now, just use the "player/mage" image.
        let images = [];

        images.push({
            x: this.x + this.animationShiftX,
            y: this.y + this.animationShiftY,
            image: ImageCatalog.IMAGE_CATALOG.getImageTableByName("player").getImageByName("mage")
        });

        // Add any status effect images.
        if(this.isInvincible || this.isDead) {
            images.push({
                x: this.x + this.animationShiftX,
                y: this.y + this.animationShiftY,
                image: ImageCatalog.IMAGE_CATALOG.getImageTableByName("status").getImageByName("invincible")
            });
        }

        // Add on health bar.
        images.push({
            x: this.x + this.animationShiftX,
            y: this.y + this.animationShiftY,
            image: this.getHealthBarImage()
        });

        // Add on mana bar.
        images.push({
            x: this.x + this.animationShiftX,
            y: this.y + this.animationShiftY,
            image: this.getManaBarImage()
        });

        // Add on experience bar.
        images.push({
            x: this.x + this.animationShiftX,
            y: this.y + this.animationShiftY,
            image: this.getExperienceBarImage()
        });

        // Add on the level.
        images.push({
            x: this.x + this.animationShiftX,
            y: this.y + this.animationShiftY,
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
}

module.exports = Player;