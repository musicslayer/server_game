const Animation = require("./Animation.js");
const ServerTask = require("../server/ServerTask.js");

class LogAnimation extends Animation {
    getAnimationServerTasks() {
        let dataArray = [];

        let serverTask = new ServerTask(() => {
            console.log("LogAnimation");
        });

        dataArray.push({"animation": undefined, "time": 0, "serverTask": serverTask});

        return dataArray;
    }
}

module.exports = LogAnimation;