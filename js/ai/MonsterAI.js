const Util = require("../util/Util.js");

class MonsterAI {
    // This function will decide what this monster does next (i.e. move, attack, etc...)
    generateNextActivity(monster) {
        // Look for the player with the highest agro and move towards them.
        let aggroPlayer = monster.getAggroPlayer();

        let directions;
        if(!aggroPlayer) {
            // Just move randomly in any direction.
            directions = ["up", "down", "left", "right"];
        }
        else {
            directions = [];

            if(aggroPlayer.y < monster.y) {
                directions.push("up");
            }
            else if (aggroPlayer.y > monster.y) {
                directions.push("down");
            }

            if(aggroPlayer.x < monster.x) {
                directions.push("left");
            }
            else if(aggroPlayer.x > monster.x) {
                directions.push("right");
            }
        }

        let randomValidDirection = this.getRandomValidDirection(monster, directions);
        if(randomValidDirection) {
            // Take a step towards the aggro player.
            monster.move(randomValidDirection);
        }
        else {
            // Pick a direction towards the player, if possible. Do this deterministically to avoid jittering.
            let direction = directions[0];
            if(direction) {
                if(!directions.includes(monster.direction)) {
                    // Face towards towards the aggro player.
                    monster.changeDirection(direction);
                }
                else if(this.isFacingAPlayer(monster, aggroPlayer)) {
                    // If any player is in front of us (aggro or not) attack them.
                    // This means that if another player is blocking the monster from the aggro player, they will be attacked.
                    monster.doAttack();
                    monster.wait();
                }
                else {
                    // We are facing the player but cannot attack them or anyone else, so just do nothing.
                    monster.wait();
                }
            }
            else {
                // There is no appropriate action to take.
                monster.wait();
            }
        }
    }

    getRandomValidDirection(monster, directions) {
        // Returns a direction that the monster can move in, or else returns undefined.
        let validDirections = [];

        for(let direction of directions) {
            if(monster.isNextStepAllowed(direction)) {
                validDirections.push(direction);
            }
        }
    
        let R = Util.getRandomInt(validDirections.length);
        return validDirections[R];
    }

    isFacingAPlayer(monster) {
        // The player has to be directly in front of the monster.
        let [shiftX, shiftY] = Util.getDirectionalShift(monster.direction);
        let x = monster.x + shiftX;
        let y = monster.y + shiftY;

        for(let player of monster.screen.playerEntities) {
            if(player.isAt(x, y)) {
                return true;
            }
        }

        return false;
    }
}

module.exports = MonsterAI;