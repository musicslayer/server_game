class Mouse {
    _leftclick = 0;
    _middleclick = 1;
    _rightclick = 2;

    inputMap = new Map();

    constructor(isDevMode) {
        this.inputMap.set(this._leftclick, "left");
        this.inputMap.set(this._rightclick, "right");

        if(isDevMode) {
            this.inputMap.set(this._middleclick, "middle");
        }
    }

    processButton(button) {
        // Note that "button" will only be a single button, not an array.
        let inputs = [];
        inputs.push(this.inputMap.get(button));

        return inputs;
    }
}

module.exports = Mouse;