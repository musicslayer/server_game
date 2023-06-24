const Entity = require("./Entity.js");

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
        // Randomly pick a new direction.

        // TODO Only pick a direction that is allowed to try and avoid waiting.
        this.direction = getRandomDirection();

        if(this.isNextStepAllowed()) {
            this.move(this.direction);
        }
        else {
            this.wait();
        }
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

        this.moveMonster();
    }

    doWait() {
        this.moveMonster();
    }

    canCrossScreen() {
        return false;
    }
}

function getRandomDirection() {
    let R = getRandomInt(4);

    let direction;
    if(R === 0) {
        direction = "left";
    }
    else if(R === 1) {
        direction = "right";
    }
    else if(R === 2) {
        direction = "up";
    }
    else if(R === 3) {
        direction = "down";
    }

    return direction;
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

module.exports = Monster;