const Entity = require("./Entity.js");

class Projectile extends Entity {
    id = "projectile";

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

    getName() {
        return "Projectile";
    }

    getInfo() {
        return "A blast of magical energy.";
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

        if(this.range === 0 || !this.isNextStepAllowed() || (this.isCollision && !this.isMulti)) {
            this.despawn();
            return;
        }

        this.move(this.direction);
    }

    doMove(direction) {
        if(direction === "up") {
            this.y--;
        }
        else if(direction === "down") {
            this.y++;
        }
        else if(direction === "left") {
            this.x--;
        }
        else if(direction === "right") {
            this.x++;
        }

        this.range--;
        this.moveProjectile();
    }

    isBlockedBy(entity) {
        return entity.blocksAction;
    }

    canCrossScreen() {
        return false;
    }
}

module.exports = Projectile;