const AI = require("./AI.js");
const MoveAnimation = require("../animation/MoveAnimation.js");
const ServerTask = require("../server/ServerTask.js");
const Util = require("../util/Util.js");
const UID = require("../uid/UID.js");

class MonsterAI extends AI {
    // This is the time to do any non-standard action (waiting, changing direction).
    // This should be quick so the monster does not appear to be stalled.
    defaultTime = .1;
    randomDirectionFlag = false;

    generateNextActivity(monster) {
        // Look for the player with the highest agro and move towards them.
        if(!monster.isSpawned) {
            return;
        }

        let time = this.defaultTime;
        let aggroPlayer = monster.getAggroPlayer();

        let directions;
        if(!aggroPlayer) {
            // Just move randomly in any direction.
            directions = ["up", "down", "left", "right"];
        }
        else {
            directions = [];

            if(aggroPlayer.getMovementY() < monster.y) {
                directions.push("up");
            }
            else if (aggroPlayer.getMovementY() > monster.y) {
                directions.push("down");
            }

            if(aggroPlayer.getMovementX() < monster.x) {
                directions.push("left");
            }
            else if(aggroPlayer.getMovementX() > monster.x) {
                directions.push("right");
            }
        }

        let randomValidDirection = this.getRandomValidDirection(monster, directions);
        if(randomValidDirection) {
            // Turn or move towards the aggro player, if possible.
            if(monster.direction !== randomValidDirection && !this.randomDirectionFlag) {
                this.randomDirectionFlag = true;

                time = monster.directionTime;

                let serverTask = new ServerTask((monster, direction) => {
                    monster.doChangeDirection(direction);
                }, monster, randomValidDirection);
        
                monster.getServer().scheduleTask(undefined, 0, serverTask);
            }
            else {
                this.randomDirectionFlag = false;

                time = monster.moveTime;

                let serverTask = new ServerTask((monster) => {
                    monster.doMoveStep();
                }, monster);
        
                monster.getServer().scheduleTask(new MoveAnimation(monster, time), time, serverTask);
            }
        }
        else if(directions.length > 0) {
            // Turn and face the aggro player and attack them, if possible.
            if(!directions.includes(monster.direction)) {
                // Face towards the aggro player, picking a direction deterministically to avoid jittering.
                time = monster.directionTime;

                let serverTask = new ServerTask((monster, direction) => {
                    monster.doChangeDirection(direction);
                }, monster, directions[0]);
        
                monster.getServer().scheduleTask(undefined, 0, serverTask);
            }
            else if(this.isFacingAPlayer(monster)) {
                // If any player is in front of us (aggro or not) attack them.
                // This means that if another player is blocking the monster from the aggro player, they will be attacked instead.
                time = monster.actionTime;

                let serverTask = new ServerTask((monster) => {
                    monster.doAction();
                }, monster);
        
                monster.getServer().scheduleTask(undefined, 0, serverTask);
            }
        }

        let serverTask2 = new ServerTask((monster) => {
            monster.ai.generateNextActivity(monster);
        }, monster);

        monster.getServer().scheduleTask(undefined, time, serverTask2);
    }

    getRandomValidDirection(monster, directions) {
        // Returns a direction that the monster can move in, or else returns undefined.
        let validDirections = [];

        for(let direction of directions) {
            if(monster.isNextStepAllowed(direction)) {
                validDirections.push(direction);
            }
        }
    
        let R = monster.getServer().getRandomInteger(validDirections.length);
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