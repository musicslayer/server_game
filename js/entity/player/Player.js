const Entity = require("../Entity.js");
const Purse = require("../Purse.js");
const Inventory = require("../Inventory.js");
const Progress = require("../../progress/Progress.js");
const ServerTask = require("../../server/ServerTask.js");

class Player extends Entity {
    client;
    isPlayer = true;

    health = 70;
    maxHealth = 100;
    healthRegen = 3; // per second

    mana = 20;
    maxMana = 100;
    manaRegen = 1; // per second

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

        // Register regen task.
        let serverTask = new ServerTask(undefined, 1, Number.POSITIVE_INFINITY, "regen", this);

        this.ownServerTask(serverTask);
        this.getServer().scheduleTask(serverTask);
    }
    
    doAddExperience(experience) {
       this.progress.doAddExperience(experience);
    }



    doTeleportHome() {
        // Teleport the player to their home location (in the current world) only if they are alive.
        if(!this.isStatus("dead")) {
            super.doTeleportHome();
        }
    }
    
    doTakeDamage(entity, damage) {
        if(!this.canTakeDamageFrom(entity) || !this.canBeDamaged()) {
            return;
        }

        this.health = Math.max(this.health - damage, 0);
        if(this.health === 0) {
            // If another player did the final damage, spawn a PVP Token and drop some of your gold.
            let rootEntity = this.getRootEntity(entity);
            if(rootEntity.isPlayer) {
                let pvpToken = Entity.createInstance("PVPToken", 1);
                pvpToken.setScreen(this.screen);
                pvpToken.x = this.x;
                pvpToken.y = this.y;

                pvpToken.doSpawnAsLoot();

                let goldAmount = Math.floor(this.purse.goldTotal * 0.2);
                this.dropFromPurse(goldAmount);
            }
            this.doKill();
        }
    }

    doAction() {
        // Spawn a "magic projectile" representing a magical attack.
        // If the player is moving, fire the projectile ahead of the motion.
        let projectile = Entity.createInstance("MagicProjectile", 1);
        projectile.setScreen(this.screen);
        projectile.x = this.getMovementX();
        projectile.y = this.getMovementY();
        projectile.direction = this.direction;
        projectile.range = 8;
        projectile.damage = 40;
        projectile.isMulti = false;

        this.doSpawnEntity(projectile);

        // Performing an action will remove invisibility.
        this.removeStatus("invisible");
    }
}

module.exports = Player;