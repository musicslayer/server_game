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

    processClick(button) {
        // Note that "button" will only be a single button, not an array.
        let inputs = [];
        inputs.push(this.inputMap.get(button));

        return inputs;
    }
}

module.exports = Mouse;