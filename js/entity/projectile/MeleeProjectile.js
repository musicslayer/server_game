const Projectile = require("./Projectile.js");

class MeleeProjectile extends Projectile {
    getName() {
        return "Melee Projectile";
    }

    getEntityName() {
        return "melee_orb";
    }

    getInfo() {
        return "A melee attack.";
    }
}

module.exports = MeleeProjectile;