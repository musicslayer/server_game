const Entity = require("./Entity.js");
const Util = require("../util/Util.js");

class Monster extends Entity {
    id = "monster";

    health = 70;
    maxHealth = 100;
    experienceReward = 20;

    isTangible = true;
    blocksMovement = true;

    movementTime = 1;

    getName() {
        return "Monster";
    }

    getInfo() {
        return "A creature that you can kill for loot and experience.";
    }

    doTakeDamage(entity, damage) {
        this.health = Math.max(this.health - damage, 0);

        if(this.health === 0) {
            this.getRootEntity(entity).doAddExperience(this.experienceReward);
            this.getWorld().spawnAsLoot("gold", 100, this.screen, this.x, this.y);
            this.doDespawn();

            if(this.owner) {
                this.owner.onMonsterDeath();
            }
        }
    }

    doSpawn() {
        super.doSpawn();

        this.getServer().addTask(0, () => {
            this.moveMonster();
        });
    }

    moveMonster() {
        // Randomly pick a new valid direction, or wait if there isn't anywhere the monster can move.
        let randomDirection = this.getRandomValidDirection();

        if(randomDirection) {
            this.move(randomDirection);
        }
        else {
            this.wait();
        }
    }

    doMove(direction) {
        let [shiftX, shiftY] = Util.getDirectionalShift(direction);
        this.x += shiftX;
        this.y += shiftY;

        this.moveMonster();
    }

    doWait() {
        this.moveMonster();
    }

    canCrossScreen() {
        return false;
    }

    getRandomValidDirection() {
        // Returns a direction that the monster can move in, or else returns undefined.
        let directions = [];
        if(this.isNextStepAllowed("up")) {
            directions.push("up");
        }
        if(this.isNextStepAllowed("down")) {
            directions.push("down");
        }
        if(this.isNextStepAllowed("left")) {
            directions.push("left");
        }
        if(this.isNextStepAllowed("right")) {
            directions.push("right");
        }
    
        let R = Util.getRandomInt(directions.length);
        return directions[R];
    }
}

module.exports = Monster;