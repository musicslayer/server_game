const Projectile = require("./Projectile.js");

class MeleeProjectile extends Projectile {
    id = "melee_projectile";

    constructor(direction, range, damage, isMulti) {
        super(direction, range, damage, isMulti);
    }

    getName() {
        return "Melee Projectile";
    }

    getInfo() {
        return "A melee attack.";
    }
}

module.exports = MeleeProjectile;