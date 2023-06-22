const Server = require("../server/Server.js");

class EntitySpawner {
    static spawnTimed(id, number, screen, x, y, ...args) {
        // Spawn entity that will be despawned after a certain number of seconds.
        if(number === 0) {
            return;
        }

        let entity = EntitySpawner.createInstance(id, number, ...args);

        entity.spawn(screen, x, y);
        Server.SERVER.scheduleTaskForSeconds(Server.SERVER.LOOT_TIME, () => {
            entity.doDespawn();
        })

        return entity;
    }

    static spawn(id, number, screen, x, y, ...args) {
        if(number === 0) {
            return;
        }

        let entity = EntitySpawner.createInstance(id, number, ...args);
        entity.spawn(screen, x, y);
        return entity;
    }

    static createInstance(id, number, ...args) {
        // These requires cannot be placed at the top of the file because it creates a circular dependency loop.
        const Player = require("./Player.js");
        const Gold = require("./Gold.js");
        const PVPToken = require("./PVPToken.js");
        const Wall = require("./Wall.js");
        const FireTrap = require("./FireTrap.js");
        const DeathTrap = require("./DeathTrap.js");
        const HealthPotion = require("./HealthPotion.js");
        const HomePortal = require("./HomePortal.js");
        const ManaPotion = require("./ManaPotion.js");
        const InvinciblePotion = require("./InvinciblePotion.js");
        const Projectile = require("./Projectile.js");
        const Monster = require("./Monster.js");
        const Teleporter = require("./Teleporter.js");
        const RevivePortal = require("./RevivePortal.js");
        const UnknownEntity = require("./UnknownEntity.js");

        let entity;

        switch(id) {
            case "death_trap":
                entity = new DeathTrap(...args);
                break;
            case "fire_trap":
                entity = new FireTrap(...args);
                break;
            case "gold":
                entity = new Gold(...args);
                break;
            case "health_potion":
                entity = new HealthPotion(...args);
                break;
            case "home_portal":
                entity = new HomePortal(...args);
                break;
            case "invincible_potion":
                entity = new InvinciblePotion(...args);
                break;
            case "mana_potion":
                entity = new ManaPotion(...args);
                break;
            case "monster":
                entity = new Monster(...args);
                break;
            case "player":
                entity = new Player(...args);
                break;
            case "projectile":
                entity = new Projectile(...args);
                break;
            case "pvp_token":
                entity = new PVPToken(...args);
                break;
            case "revive_portal":
                entity = new RevivePortal(...args);
                break;
            case "teleporter":
                entity = new Teleporter(...args);
                break;
            case "wall":
                entity = new Wall(...args);
                break;
            default:
                entity = new UnknownEntity(...args);
        }

        entity.stackSize = number;
        return entity;
    }

    static cloneInstance(entity, number) {
        return entity.clone(number);
    }
}

module.exports = EntitySpawner;