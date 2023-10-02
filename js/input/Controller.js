class Controller {
    _a = 0;
    _b = 1;
    _x = 2;
    _y = 3;

    _l1 = 4;
    _r1 = 5;
    _l2 = 6;
    _r2 = 7;

    _view = 8;
    _menu = 9;

    _leftstick = 10;
    _rightstick = 11;

    _up = 12;
    _down = 13;
    _left = 14;
    _right = 15;

    inputMap = new Map();

    constructor(isDevMode) {
        this.inputMap.set(this._y, "inventory_previous");
        this.inputMap.set(this._b, "inventory_next");
        this.inputMap.set(this._a, "inventory_use");

        this.inputMap.set(this._x, "action");
        this.inputMap.set(this._l1, "teleport_home");

        this.inputMap.set(this._up, "move_up");
        this.inputMap.set(this._down, "move_down");
        this.inputMap.set(this._left, "move_left");
        this.inputMap.set(this._right, "move_right");
    }

    processButtonPress(buttons) {
        let inputs = [];

        for(let button of buttons) {
            inputs.push(this.inputMap.get(button));
        }

        return inputs;
    }
}

module.exports = Controller;