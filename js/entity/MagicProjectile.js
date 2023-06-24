const Projectile = require("./Projectile.js");

class MagicProjectile extends Projectile {
    id = "magic_projectile";

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