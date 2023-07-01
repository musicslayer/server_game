const Entity = require("./Entity.js");
const EntityFactory = require("./EntityFactory.js");
const Purse = require("./Purse.js");
const Inventory = require("./Inventory.js");
const Progress = require("../progress/Progress.js");

class Player extends Entity {
    isSerializable = false;

    health = 70;
    maxHealth = 100;
    healthRegen = 3; // per second

    mana = 20;
    maxMana = 100;
    manaRegen = 1; // per second

    isPlayer = true;
    isTangible = true;

    actionTime = .2;
    moveTime = .2;

    inventory = new Inventory();
    purse = new Purse();
    progress = new Progress();

    getName() {
        return "Player";
    }

    getInfo() {
        return "A character controlled by a real-life person.";
    }

    doSpawn() {
        super.doSpawn();
        
        // Register regen tasks.
        let f = () => {
            this.getServerScheduler().scheduleTask(undefined, 1, () => {
                if(!this.isDead) {
                    this.doAddHealth(this.healthRegen)
                    this.doAddMana(this.manaRegen)
                }
                f();
            });
        };
        f();
    }
    
    doAddExperience(experience) {
       this.progress.doAddExperience(experience);
    }



    doTeleportHome() {
        // Teleport the player to their home location (in the current world) only if they are alive.
        if(!this.isDead) {
            super.doTeleportHome();
        }
    }
    
    doTakeDamage(entity, damage) {
        // If a player attacks another player, only allow damage if we are in a pvp screen.
        // Also, invincible/dead players cannot take damage.
        let rootEntity = this.getRootEntity(entity);

        let canTakePlayerDamage = !rootEntity.isPlayer || this.screen.pvpStatus === "pvp";
        let canTakeNormalDamage = !this.isInvincible && !this.isDead;
        if(canTakePlayerDamage && canTakeNormalDamage) {
            this.health = Math.max(this.health - damage, 0);
            if(this.health === 0) {
                // If another player did the final damage, spawn a PVP Token and drop some of your gold.
                if(rootEntity.isPlayer) {
                    let pvpToken = EntityFactory.createInstance("pvp_token", 1);
                    pvpToken.screen = this.screen;
                    pvpToken.x = this.x;
                    pvpToken.y = this.y;

                    pvpToken.doSpawnAsLoot();

                    let goldAmount = Math.floor(this.purse.goldTotal * 0.2);
                    this.dropFromPurse(goldAmount);
                }
                this.doKill();
            }
        }
    }

    doAction() {
        // Spawn a "magic projectile" representing a magical attack.
        // If the player is moving, fire the projectile ahead of the motion.
        let projectile = EntityFactory.createInstance("magic_projectile", 1, 8, 40, false);
        projectile.screen = this.screen;
        projectile.x = this.getMovementX();
        projectile.y = this.getMovementY();
        projectile.direction = this.direction;

        this.doSpawnEntity(projectile);
    }
}

module.exports = Player;