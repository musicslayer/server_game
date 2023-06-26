const Entity = require("./Entity.js");
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

        // ??? If the player is in a dungeon, could we just teleport them to the entrance instead?
        this.teleportDeath();
    }

    revive() {
        // Restore the player to normal.
        this.health = this.maxHealth;
        this.mana = this.maxMana;

        this.isDead = false;
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
                    this.getWorld().spawnAsLoot("pvp_token", 1, this.screen, this.x, this.y);

                    let goldAmount = Math.floor(this.purse.goldTotal * 0.2);
                    this.dropFromPurse(goldAmount);
                }
                this.kill();
            }
        }
    }

    doAction() {
        let x = this.x;
        let y = this.y;

        // If the player is moving, fire the projectile ahead of the motion.
        if(this.isMoveInProgress) {
            let [shiftX, shiftY] = Util.getDirectionalShift(this.direction);
            x += shiftX;
            y += shiftY;
        }
        
        let projectile = this.getWorld().spawn("magic_projectile", 1, this.screen, x, y, this.direction, 8, 40, false);
        projectile.owner = this;
    }
}

module.exports = Player;