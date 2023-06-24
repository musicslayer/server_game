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

        let randomDirection = this.getRandomValidDirection(monster, directions);
        if(randomDirection) {
            // Take a step towards the aggro player.
            monster.move(randomDirection);
        }
        else {
            // TODO If the monster is facing a player it will attack.
            monster.attack();

            // Don't move anywhere this time.
            monster.wait();
        }
    }

    getRandomValidDirection(monster, directionArray) {
        // Returns a direction that the monster can move in, or else returns undefined.
        let directions = [];

        for(let direction of directionArray) {
            if(monster.isNextStepAllowed(direction)) {
                directions.push(direction);
            }
        }
    
        let R = Util.getRandomInt(directions.length);
        return directions[R];
    }
}

module.exports = MonsterAI;