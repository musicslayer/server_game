class EntitySpawner {
    static spawnStack(id, number, screen, x, y, ...args) {
        if(id === "item_stack" || number === 0) {
            // LOG SERVER ERROR?
            return;
        }

        let entity = EntitySpawner.clone(id, ...args);
        let entityStack = EntitySpawner.spawn("item_stack", screen, x, y, entity, number);
        return entityStack;
    }

    static spawn(id, screen, x, y, ...args) {
        let entity = EntitySpawner.clone(id, ...args);
        entity.spawn(screen, x, y);
        return entity;
    }

    static clone(id, ...args) {
        // These requires cannot be placed at the top of the file because it creates a circular dependency loop.
        const Player = require("./Player.js");
        const ItemStack = require("./ItemStack.js");
        const Gold = require("./Gold.js");
        const PVPToken = require("./PVPToken.js");
        const Wall = require("./Wall.js");
        const FireTrap = require("./FireTrap.js");
        const DeathTrap = require("./DeathTrap.js");
        const HealthPotion = require("./HealthPotion.js");
        const ManaPotion = require("./ManaPotion.js");
        const InvinciblePotion = require("./InvinciblePotion.js");
        const Projectile = require("./Projectile.js");
        const Monster = require("./Monster.js");
        const Teleporter = require("./Teleporter.js");
        const RevivePortal = require("./RevivePortal.js");
        const UnknownEntity = require("./UnknownEntity.js");

        switch(id) {
            case "player":
                return new Player(...args);
            case "item_stack":
                return new ItemStack(...args);
            case "gold":
                return new Gold(...args);
            case "pvp_token":
                return new PVPToken(...args);
            case "fire_trap":
                return new FireTrap(...args);
            case "death_trap":
                return new DeathTrap(...args);
            case "health_potion":
                return new HealthPotion(...args);
            case "invincible_potion":
                return new InvinciblePotion(...args);
            case "mana_potion":
                return new ManaPotion(...args);
            case "monster":
                return new Monster(...args);
            case "projectile":
                return new Projectile(...args);
            case "wall":
                return new Wall(...args);
            case "teleporter":
                return new Teleporter(...args);
            case "revive_portal":
                return new RevivePortal(...args);
            default:
                return new UnknownEntity(...args);
        }
    }
}

module.exports = EntitySpawner;