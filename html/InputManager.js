const MAX_CLICK_DELTA_SPACE = 10;
const MAX_CLICK_DELTA_TIME = 100;
const AXIS_DEADZONE = 0.2;

class InputManager {
    gameScreen;

    deltaSpace;
    startX;
    startY;
    startT;

    downButton;
    inputsEnabled = true;
    isKeyPressed = {};

    constructor(gameScreen) {
        this.gameScreen = gameScreen;
    }

    // eslint-disable-next-line no-unused-vars
    onBlur(event) {
        this.inputsEnabled = false;
        this.isKeyPressed = {};
    }

    // eslint-disable-next-line no-unused-vars
    onFocus(event) {
        this.inputsEnabled = true;
    }

    onMouseDown(event) {
        if(this.downButton === undefined) {
            this.downButton = event.button;
            this.startX = event.clientX;
            this.startY = event.clientY;
            this.startT = Date.now();
            this.deltaSpace = 0;
        }
    }
    
    // eslint-disable-next-line no-unused-vars
    onMouseMove(event) {
        if(this.downButton !== undefined) {
            this.deltaSpace++;
        }
    }

    onMouseUp(event) {
        if(this.downButton !== event.button) {
            return [undefined, undefined, undefined, undefined, undefined, undefined];
        }
        
        this.downButton = undefined;
        
        let endT = Date.now();
        let deltaTime = endT - this.startT;
        let endX = event.clientX;
        let endY = event.clientY;

        let [location1, info1] = this.gameScreen.getPositionData(this.startX, this.startY);
        let [location2, info2] = this.gameScreen.getPositionData(endX, endY);

        let mouseAction = undefined;
        if(location1 && this.deltaSpace < MAX_CLICK_DELTA_SPACE && deltaTime < MAX_CLICK_DELTA_TIME) {
            mouseAction = "click";
        }
        else if(location1 && location2 && (this.deltaSpace >= MAX_CLICK_DELTA_SPACE || deltaTime >= MAX_CLICK_DELTA_TIME)) {
            mouseAction = "drag";
        }

        return [mouseAction, event.button, location1, info1, location2, info2];
    }
    
    onKeyDown(event) {
        this.isKeyPressed[event.keyCode] = true;
    }
    
    onKeyUp(event) {
        this.isKeyPressed[event.keyCode] = false;
    }
    
    getKeys() {
        let keys = [];

        for(let key in this.isKeyPressed) {
            if(this.isKeyPressed[key]) {
                keys.push(Number(key));
            }
        }

        return keys;
    }
    
    getGamepadButtons(gamepad) {
        let buttons = [];

        for(let i = 0; i < gamepad.buttons.length; i++) {
            let button = gamepad.buttons[i];
            let isPressed = typeof button === "object" ? button.pressed : button === 1.0;
            if(isPressed) {
                buttons.push(i);
            }
        }

        return buttons;
    }
    
    getGamepadAxes(gamepad) {
        let axes = [];

        for(let axis of gamepad.axes) {
            // If any one axis is outside the deadzone, send the server all of the axes.
            if(Math.abs(axis) > AXIS_DEADZONE) {
                axes = gamepad.axes;
                break;
            }
        }

        return axes;
    }
}

export { InputManager };