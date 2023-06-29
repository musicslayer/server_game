const MoveAnimation = require("../animation/MoveAnimation.js");

class ProjectileAI {
    generateNextActivity(projectile) {
        // Just keep moving in the same direction until the projectile despawns.
        if(projectile.isSpawned) {
            projectile.getServerScheduler().scheduleTask(new MoveAnimation(projectile, projectile.moveTime), projectile.moveTime, () => {
                projectile.doMoveStep();
            });

            projectile.getServerScheduler().scheduleTask(undefined, projectile.moveTime, () => {
                this.generateNextActivity(projectile);
            });
        }
    }
}

module.exports = ProjectileAI;