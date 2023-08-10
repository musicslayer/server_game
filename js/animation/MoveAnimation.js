const Animation = require("./Animation.js");
const Performance = require("../constants/Performance.js");
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

    getAnimationServerTaskData() {
        let dataArray = [];
        let frames = Performance.MOVEMENT_FRAMES;
            
        for(let a = 0; a < frames; a++) {
            let fraction = a / frames;
            let [shiftX, shiftY] = Util.getDirectionalShift(this.entity.direction);

            let serverTask = new ServerTask("animation_shift", this.entity, fraction, shiftX, shiftY);
            dataArray.push({"animation": undefined, "time": this.time * fraction, "serverTask": serverTask});
        }

        let serverTask2 = new ServerTask("animation_reset", this.entity);
        dataArray.push({"animation": undefined, "time": this.time, "serverTask": serverTask2});

        return dataArray;
    }
}

module.exports = MoveAnimation;