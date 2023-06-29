const Performance = require("../server/Performance.js");
const Util = require("../util/Util.js");

class MoveAnimation {
    entity;
    time;

    constructor(entity, time) {
        this.entity = entity;
        this.time = time;
    }

    scheduleAnimation(serverScheduler) {
        this.entity.isMoveInProgress = true;
        
        let frames = Performance.MOVEMENT_FRAMES;
            
        for(let a = 0; a < frames; a++) {
            let fraction = a / frames;
            serverScheduler.scheduleTask(undefined, this.time * fraction, () => {
                let [shiftX, shiftY] = Util.getDirectionalShift(this.entity.direction);
                this.entity.animationShiftX = (shiftX * fraction);
                this.entity.animationShiftY = (shiftY * fraction);
            });
        }

        serverScheduler.scheduleTask(undefined, this.time, () => {
            this.entity.isMoveInProgress = false;
            
            this.entity.animationShiftX = 0;
            this.entity.animationShiftY = 0;
        });
    }
}

module.exports = MoveAnimation;