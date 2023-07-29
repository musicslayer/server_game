const Entity = require("./Entity.js");
const ProjectileAI = require("../ai/ProjectileAI.js");
const Util = require("../util/Util.js");

class Projectile extends Entity {
    isAI = true;
    ai = new ProjectileAI();
    
    range;
    damage;
    isMulti;

    moveTime = 0.05; // Move faster than most other entities.

    doSpawn() {
        super.doSpawn();

        // Do this immediately so that projectiles can hit things overlapping the owner.
        this.doCheckFinished();

        // Projectile activities are controlled by an AI class.
        this.ai.generateNextActivity(this);
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

    doMoveStep() {
        let [shiftX, shiftY] = Util.getDirectionalShift(this.direction);
        this.x += shiftX;
        this.y += shiftY;

        this.range--;

        this.doCheckFinished();
    }

    doCheckFinished() {
        this.doCheckCollision();
        
        if(this.isSpawned && (this.range === 0 || !this.isNextStepAllowed(this.direction))) {
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