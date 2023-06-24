const Entity = require("./Entity.js");
const Util = require("../util/Util.js");

class Projectile extends Entity {
    direction;
    range;
    damage;
    isMulti;

    isCollision;
    movementTime = 0.05;

    constructor(direction, range, damage, isMulti) {
        super();

        this.direction = direction;
        this.range = range;
        this.damage = damage;
        this.isMulti = isMulti;
    }

    doSpawn() {
        super.doSpawn();

        this.getServer().addTask(0, () => {
            this.moveProjectile();
        });
    }

    doInteract(entity) {
        // Do some damage to the other entity unless it is the owner.
        if(entity !== this.owner && entity.isTangible) {
            entity.doTakeDamage(this, this.damage);
            this.isCollision = true;
        }
    }

    moveProjectile() {
        // Do this immediately so that projectiles can hit things overlapping the owner.
        this.doCheckCollision();

        if(this.range === 0 || !this.isNextStepAllowed(this.direction) || (this.isCollision && !this.isMulti)) {
            this.despawn();
            return;
        }

        this.move(this.direction);
    }

    doMove(direction) {
        let [shiftX, shiftY] = Util.getDirectionalShift(direction);
        this.x += shiftX;
        this.y += shiftY;

        this.range--;
        this.moveProjectile();
    }

    isBlockedBy(entity) {
        return entity.isActionBlocker;
    }

    canCrossScreen() {
        return false;
    }
}

module.exports = Projectile;