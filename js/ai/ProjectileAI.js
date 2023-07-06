const AI = require("./AI.js");
const MoveAnimation = require("../animation/MoveAnimation.js");
const ServerTask = require("../server/ServerTask.js");

class ProjectileAI extends AI {
    generateNextActivity(projectile) {
        // Just keep moving in the same direction until the projectile despawns.
        if(projectile.isSpawned) {
            let serverTask = new ServerTask((projectile) => {
                projectile.doMoveStep();
            }, projectile);
    
            projectile.getServer().scheduleTask(new MoveAnimation(projectile, projectile.moveTime), projectile.moveTime, serverTask);

            let serverTask2 = new ServerTask((projectile) => {
                projectile.ai.generateNextActivity(projectile);
            }, projectile);
    
            projectile.getServer().scheduleTask(undefined, projectile.moveTime, serverTask2);
        }
    }
}

module.exports = ProjectileAI;