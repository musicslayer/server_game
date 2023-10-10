const Projectile = require("./Projectile.js");

class MeleeProjectile extends Projectile {
    getName() {
        return "Melee Projectile";
    }

    getInfo() {
        return "A melee attack.";
    }
}

module.exports = MeleeProjectile;