class EntityFactory {
    static createInstance(id, number, ...args) {
        // Keep these requires here to avoid circular dependency loops.
        const DeathTrap = require("./DeathTrap.js");
        const FireTrap = require("./FireTrap.js");
        const Gold = require("./Gold.js");
        const HealthPotion = require("./HealthPotion.js");
        const HomePortal = require("./HomePortal.js");
        const InvinciblePotion = require("./InvinciblePotion.js");
        const MagicProjectile = require("./MagicProjectile.js");
        const ManaPotion = require("./ManaPotion.js");
        const MeleeProjectile = require("./MeleeProjectile.js");
        const Monster = require("./Monster.js");
        const MonsterSpawner = require("./MonsterSpawner.js");
        const PlayerMage = require("./PlayerMage.js");
        const PlayerWarrior = require("./PlayerWarrior.js");
        const PVPToken = require("./PVPToken.js");
        const RevivePortal = require("./RevivePortal.js");
        const Teleporter = require("./Teleporter.js");
        const UnknownEntity = require("./UnknownEntity.js");
        const Wall = require("./Wall.js");

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
            case "magic_projectile":
                entity = new MagicProjectile(...args);
                break;
            case "mana_potion":
                entity = new ManaPotion(...args);
                break;
            case "melee_projectile":
                entity = new MeleeProjectile(...args);
                break;
            case "monster":
                entity = new Monster(...args);
                break;
            case "monster_spawner":
                entity = new MonsterSpawner(...args);
                break;
            case "player_mage":
                entity = new PlayerMage(...args);
                break;
            case "player_warrior":
                entity = new PlayerWarrior(...args);
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
        let clone = entity.clone(number);
        clone.screen = entity.screen;
        return clone;
    }
}

module.exports = EntityFactory;