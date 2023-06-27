const Entity = require("./Entity.js");
const Util = require("../util/Util.js");

class Projectile extends Entity {
    isSerializable = false;

    direction;
    range;
    damage;
    isMulti;

    movementTime = 0.05; // Move faster than most other entities.

    constructor(direction, range, damage, isMulti) {
        super();

        this.direction = direction;
        this.range = range;
        this.damage = damage;
        this.isMulti = isMulti;
    }

    doSpawn() {
        super.doSpawn();

        // Do this immediately so that projectiles can hit things overlapping the owner.
        this.doCheckCollision();

        if(!this.isSpawned) {
            return;
        }
        
        if(this.range === 0 || !this.isNextStepAllowed(this.direction)) {
            this.doDespawn();
            return;
        }

        this.move(this.direction, this.range);
    }

    doInteract(entity) {
        // Do some damage to the other entity unless it is the owner.
        if(entity !== this.owner && entity.isTangible) {
            entity.doTakeDamage(this, this.damage);

            if(!this.isMulti) {
                this.doDespawn();
            }
        }
    }

    doMoveStep(direction) {
        let [shiftX, shiftY] = Util.getDirectionalShift(direction);
        this.x += shiftX;
        this.y += shiftY;

        this.doCheckCollision();

        if(!this.isSpawned) {
            return;
        }

        this.range--;
        if(this.range === 0 || !this.isNextStepAllowed(direction)) {
            this.doDespawn();
        }
    }

    isBlockedBy(entity) {
        return entity.isActionBlocker;
    }

    canCrossScreen() {
        return false;
    }
}

module.exports = Projectile;