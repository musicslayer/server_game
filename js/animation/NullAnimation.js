const Animation = require("./Animation.js");

class NullAnimation extends Animation {
    getAnimationServerTasks() {
        return [];
    }
}

module.exports = NullAnimation;