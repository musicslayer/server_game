const Projectile = require("./Projectile.js");

class MagicProjectile extends Projectile {
    getName() {
        return "Magic Projectile";
    }

    getImageName() {
        return "magic_orb";
    }

    getInfo() {
        return "A blast of magical energy.";
    }
}

module.exports = MagicProjectile;