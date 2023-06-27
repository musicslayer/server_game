const Entity = require("./Entity.js");
const EntityFactory = require("./EntityFactory.js");
const Purse = require("./Purse.js");
const Inventory = require("./Inventory.js");
const Util = require("../util/Util.js");

class Player extends Entity {
    isSerializable = false;

    isPlayer = true;
    isTangible = true;

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

    actionTime = .2;
    movementTime = .2;

    constructor() {
        super();

        this.inventory = new Inventory(this);
        this.purse = new Purse(this);
    }

    getName() {
        return "Player";
    }

    getInfo() {
        return "A character controlled by a real-life person.";
    }

    doSpawn() {
        super.doSpawn();
        
        // Register regen tasks.
        this.getServer().addRefreshTask(1, () => {
            if(!this.isDead) {
                this.doAddHealth(this.healthRegen)
            }
        })

        this.getServer().addRefreshTask(1, () => {
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
        this.getServer().addTask(invincibleSeconds, () => {
            this.isInvincible = false;
        });
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
        let projectile = EntityFactory.createInstance("magic_projectile", 1, this.direction, 8, 40, false);
        projectile.screen = this.screen;
        projectile.x = this.getMovementX();
        projectile.y = this.getMovementY();

        this.doCreateEntity(projectile);
    }
}

module.exports = Player;