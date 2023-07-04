const Reflection = require("../reflection/Reflection.js");
const Entity = require("./Entity.js");
const EntityFactory = require("./EntityFactory.js");
const Purse = require("./Purse.js");
const Inventory = require("./Inventory.js");
const Progress = require("../progress/Progress.js");
const ServerTask2 = require("../server/ServerTask2.js");

class Player extends Entity {
    isSerializable = false;
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
        
        // Register regen tasks.
        /*
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
        */

        let serverTask = new ServerTask2((player) => {
            if(!player.isDead) {
                player.doAddHealth(player.healthRegen)
                player.doAddMana(player.manaRegen)
            }
        }, this);

        this.getServerScheduler().scheduleRefreshTask2(undefined, 1, serverTask);
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
                    let pvpToken = EntityFactory.createInstance("PVPToken", 1);
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
        let projectile = EntityFactory.createInstance("MagicProjectile", 1, 8, 40, false);
        projectile.screen = this.screen;
        projectile.x = this.getMovementX();
        projectile.y = this.getMovementY();
        projectile.direction = this.direction;

        this.doSpawnEntity(projectile);
    }

    serialize(writer) {
        // To avoid a circular loop, only serialize the name of the screen, map, etc...
        writer.beginObject()
            .serialize("className", this.getClassName())
            .serialize("stackSize", this.stackSize)
            .serialize("x", this.x)
            .serialize("y", this.y)
            .serialize("inventory", this.inventory)
            .serialize("purse", this.purse)
            .serialize("progress", this.progress)

            .serialize("homeMapName", this.homeMapName)
            .serialize("homeScreenName", this.homeScreenName)
            .serialize("homeX", this.homeX)
            .serialize("homeY", this.homeY)

            .serialize("screenX", this.screen.x)
            .serialize("screenY", this.screen.y)
            .serialize("mapName", this.screen.map.name)
            .serialize("worldName", this.screen.map.world.name)
            .serialize("universeName", this.screen.map.world.universe.name)
            .serialize("serverName", this.screen.map.world.universe.server.name)
        .endObject();
    }

    static deserialize(reader) {
        let player;

        reader.beginObject();
        let className = reader.deserialize("className", "String");
        let stackSize = reader.deserialize("stackSize", "Number");
        let x = reader.deserialize("x", "Number");
        let y = reader.deserialize("y", "Number");
        let inventory = reader.deserialize("inventory", "Inventory");
        let purse = reader.deserialize("purse", "Purse");
        let progress = reader.deserialize("progress", "Progress");

        let homeMapName = reader.deserialize("homeMapName", "String");
        let homeScreenName = reader.deserialize("homeScreenName", "String");
        let homeX = reader.deserialize("homeX", "Number");
        let homeY = reader.deserialize("homeY", "Number");

        let screenX = reader.deserialize("screenX", "Number");
        let screenY = reader.deserialize("screenY", "Number");
        let mapName = reader.deserialize("mapName", "String");
        let worldName = reader.deserialize("worldName", "String");
        let universeName = reader.deserialize("universeName", "String");
        let serverName = reader.deserialize("serverName", "String");
        reader.endObject();

        player = Reflection.createInstance(className);

        player.stackSize = stackSize;
        player.x = x;
        player.y = y;
        player.inventory = inventory;
        player.purse = purse;
        player.progress = progress;

        player.homeMapName = homeMapName;
        player.homeScreenName = homeScreenName;
        player.homeX = homeX;
        player.homeY = homeY;

        player.screenX = screenX;
        player.screenY = screenY;
        player.mapName = mapName;
        player.worldName = worldName;
        player.universeName = universeName;
        player.serverName = serverName;

        return player;
    }
}

module.exports = Player;