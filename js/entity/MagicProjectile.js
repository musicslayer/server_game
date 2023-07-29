const Projectile = require("./Projectile.js");

class MagicProjectile extends Projectile {
    getName() {
        return "Magic Projectile";
    }

    getInfo() {
        return "A blast of magical energy.";
    }
}

module.exports = MagicProjectile;