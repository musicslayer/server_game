class Mouse {
    _leftclick = 0;
    _middleclick = 1;
    _rightclick = 2;

    inputMap = new Map();

    constructor() {
        this.inputMap.set(this._leftclick, "left");
        this.inputMap.set(this._middleclick, "middle");
        this.inputMap.set(this._rightclick, "right");
    }

    processClick(buttons) {
        let inputs = [];

        for(let button of buttons) {
            inputs.push(this.inputMap.get(button));
        }

        return inputs;
    }
}

module.exports = Mouse;