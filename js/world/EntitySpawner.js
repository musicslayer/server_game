const Player = require("../entity/Player.js");
const Gold = require("../entity/Gold.js");
const PVPToken = require("../entity/PVPToken.js");
const Wall = require("../entity/Wall.js");
const FireTrap = require("../entity/FireTrap.js");
const DeathTrap = require("../entity/DeathTrap.js");
const HealthPotion = require("../entity/HealthPotion.js");
const HomePortal = require("../entity/HomePortal.js");
const ManaPotion = require("../entity/ManaPotion.js");
const InvinciblePotion = require("../entity/InvinciblePotion.js");
const Projectile = require("../entity/Projectile.js");
const Monster = require("../entity/Monster.js");
const Teleporter = require("../entity/Teleporter.js");
const RevivePortal = require("../entity/RevivePortal.js");
const UnknownEntity = require("../entity/UnknownEntity.js");

class EntitySpawner {
    spawn(id, number, screen, x, y, ...args) {
        if(number === 0) {
            return;
        }

        let entity = this.createInstance(id, number, ...args);
        entity.attachScreen(screen, x, y);
        entity.spawn();

        return entity;
    }

    spawnLoot(id, number, screen, x, y, ...args) {
        // Spawn entity that will be despawned after a certain number of seconds.
        if(number === 0) {
            return;
        }

        let entity = this.createInstance(id, number, ...args);
        entity.attachScreen(screen, x, y);
        entity.spawnAsLoot();

        return entity;
    }

    createInstance(id, number, ...args) {
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

    cloneInstance(entity, number) {
        return entity.clone(number);
    }
}

module.exports = EntitySpawner;