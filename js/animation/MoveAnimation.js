const Performance = require("../constants/Performance.js");
const Util = require("../util/Util.js");
const ServerTask = require("../server/ServerTask.js");

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
            let [shiftX, shiftY] = Util.getDirectionalShift(this.entity.direction);

            let serverTask = new ServerTask((entity, fraction, shiftX, shiftY) => {
                entity.animationShiftX = (shiftX * fraction);
                entity.animationShiftY = (shiftY * fraction);
            }, this.entity, fraction, shiftX, shiftY);
    
            serverScheduler.scheduleTask(undefined, this.time * fraction, serverTask);
        }

        let serverTask2 = new ServerTask((entity) => {
            entity.isMoveInProgress = false;
            
            entity.animationShiftX = 0;
            entity.animationShiftY = 0;
        }, this.entity);

        serverScheduler.scheduleTask(undefined, this.time, serverTask2);
    }
}

module.exports = MoveAnimation;