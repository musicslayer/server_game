const Server = require("../server/Server.js");

class Mouse {
    _leftclick = 0;
    _middleclick = 1;
    _rightclick = 2;

    flagLeftClick;
    flagMiddleClick;
    flagRightClick;

    inputLeftClick;
    inputMiddleClick;
    inputRightClick;

    constructor() {
        this.inputLeftClick = this._leftclick;
        this.inputMiddleClick = this._middleclick;
        this.inputRightClick = this._rightclick;

        Server.addRefresh(() => { this.resetFlags() });
    }

    resetFlags() {
        this.flagLeftClick = false;
        this.flagMiddleClick = false;
        this.flagRightClick = false;
    }

    processClick(button) {
        let input;

        if(button === this.inputLeftClick && !this.flagLeftClick) {
            this.flagLeftClick = true;
            //console.log("LEFT: x: " + x + " y: " + y);
            input = "left";
        }

        else if(button === this.inputMiddleClick && !this.flagMiddleClick) {
            this.flagMiddleClick = true;
            //console.log("MIDDLE: x: " + x + " y: " + y);
            input = "middle";
        }

        else if(button === this.inputRightClick && !this.flagRightClick) {
            this.flagRightClick = true;
            //console.log("RIGHT: x: " + x + " y: " + y);
            input = "right";
        }

        return input;
    }
}

module.exports = Mouse;