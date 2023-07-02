const Projectile = require("./Projectile.js");

class MagicProjectile extends Projectile {
    constructor(direction, range, damage, isMulti) {
        super(direction, range, damage, isMulti);
    }

    getName() {
        return "Magic Projectile";
    }

    getInfo() {
        return "A blast of magical energy.";
    }
}

module.exports = MagicProjectile;