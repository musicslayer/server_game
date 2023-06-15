class EntityCloner {
    static clone(id) {
        const Wall = require("./Wall.js");
        const FireTrap = require("./FireTrap.js");
        const HealthPotion = require("./HealthPotion.js");
        const ManaPotion = require("./ManaPotion.js");
        const InvinciblePotion = require("./InvinciblePotion.js");
        const Monster = require("./Monster.js");
        const UnknownEntity = require("./UnknownEntity.js");

        switch(id) {
            case "fire_trap":
                return new FireTrap();
            case "health_potion":
                return new HealthPotion();
            case "invincible_potion":
                return new InvinciblePotion();
            case "mana_potion":
                return new ManaPotion();
            case "monster":
                return new Monster();
            //case "projectile":
            // Projectiles must be dynamically created in code.
            //    return new Projectile();
            case "wall":
                return new Wall();
            default:
                return new UnknownEntity();
        }
    }
}

module.exports = EntityCloner;