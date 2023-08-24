const Animation = require("./Animation.js");
const Constants = require("../constants/Constants.js");
const Util = require("../util/Util.js");
const ServerTask = require("../server/ServerTask.js");

class MoveAnimation extends Animation {
    entity;
    time;

    constructor(entity, time) {
        super();
        this.entity = entity;
        this.time = time;
    }

    scheduleTasks(server) {
        let frames = Constants.performance.MOVEMENT_FRAMES;
            
        for(let a = 0; a < frames; a++) {
            let fraction = a / frames;
            let [shiftX, shiftY] = Util.getDirectionalShift(this.entity.direction);

            let serverTask = new ServerTask(undefined, this.time * fraction, 1, "animation_shift", this.entity, fraction, shiftX, shiftY);
            server.scheduleTask(serverTask);
        }

        let serverTask2 = new ServerTask(undefined, this.time, 1, "animation_reset", this.entity);
        server.scheduleTask(serverTask2);
    }
}

module.exports = MoveAnimation;