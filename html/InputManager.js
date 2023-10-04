const MAX_CLICK_DELTA_SPACE = 10;
const MAX_CLICK_DELTA_TIME = 100;
const DEADZONE = 0.2;
const NUM_TILES_X = 16;
const NUM_TILES_Y = 12;
const IMAGE_SCALE_FACTOR = 64;

class InputManager {
    canvas;

    deltaSpace;
    startX;
    startY;
    startT;

    downButton;
    inputsEnabled = true;
    isKeyPressed = {};

    constructor(canvas) {
        this.canvas = canvas;
    }

    onBlur(event) {
        this.inputsEnabled = false;
        this.isKeyPressed = {};
    }

    onFocus(event) {
        this.inputsEnabled = true;
    }

    onMouseDown(event) {
        if(this.downButton === undefined) {
            this.downButton = event.button;
            let rect = this.canvas.getBoundingClientRect();
            this.startX = event.clientX - rect.left - 10;
            this.startY = event.clientY - rect.top - 10;
            this.startT = Date.now();
            this.deltaSpace = 0;
        }
    }
    
    onMouseMove(event) {
        if(this.downButton !== undefined) {
            this.deltaSpace++;
        }
    }

    onMouseUp(event) {
        if(this.downButton !== event.button) {
            return [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined];
        }
        
        this.downButton = undefined;
        
        let endT = Date.now();
        let deltaTime = endT - this.startT;
    
        let rect = this.canvas.getBoundingClientRect();
        let endX = event.clientX - rect.left - 10;
        let endY = event.clientY - rect.top - 10;
        
        
        
        let var_isScreen1 = this.isScreen(this.startX, this.startY);
        let var_isInventory1 = this.isInventory(this.startX, this.startY);
        let var_isPurse1 = this.isPurse(this.startX, this.startY);
        
        let location1;
        let info1 = [];
        
        if(var_isScreen1 !== undefined) {
            location1 = "screen";
            info1.push(var_isScreen1[0]);
            info1.push(var_isScreen1[1]);
        }
        else if(var_isInventory1 !== undefined) {
            location1 = "inventory";
            info1.push(var_isInventory1);
        }
        else if(var_isPurse1 !== undefined) {
            location1 = "purse";
        }
        
        
        
        let var_isScreen2 = this.isScreen(endX, endY);
        let var_isInventory2 = this.isInventory(endX, endY);
        let var_isPurse2 = this.isPurse(endX, endY);
        
        let location2;
        let info2 = [];
        
        if(var_isScreen2 !== undefined) {
            location2 = "screen";
            info2.push(var_isScreen2[0]);
            info2.push(var_isScreen2[1]);
        }
        else if(var_isInventory2 !== undefined) {
            location2 = "inventory";
            info2.push(var_isInventory2);
        }
        else if(var_isPurse2 !== undefined) {
            location2 = "purse";
        }

        let mouseAction = undefined;
        if(location1 && this.deltaSpace < MAX_CLICK_DELTA_SPACE && deltaTime < MAX_CLICK_DELTA_TIME) {
            mouseAction = "click";
        }
        else if(location1 && location2 && (this.deltaSpace >= MAX_CLICK_DELTA_SPACE || deltaTime >= MAX_CLICK_DELTA_TIME)) {
            mouseAction = "drag";
        }

        return [mouseAction, event.button, this.deltaSpace, deltaTime, location1, info1, location2, info2];
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
            let isPressed = typeof button === "object" ? b.pressed : b === 1.0;
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
            if(Math.abs(axis) > DEADZONE) {
                axes = gamepad.axes;
                break;
            }
        }

        return axes;
    }

    isScreen(x, y) {
        let nScreen;

        if(x >= 0 && x < NUM_TILES_X * IMAGE_SCALE_FACTOR && y >= 0 && y < NUM_TILES_Y * IMAGE_SCALE_FACTOR) {
            // Return normalized (tile) x,y
            nScreen = [Math.floor(x / IMAGE_SCALE_FACTOR), Math.floor(y / IMAGE_SCALE_FACTOR)];
        }

        return nScreen;
    }

    isInventory(x, y) {
        let originInventoryX = 17;
        let originInventoryY = 7;
        let inventoryWidth = 9;
        let inventoryHeight = 5;

        let slot;

        if(x >= originInventoryX * IMAGE_SCALE_FACTOR && x < (originInventoryX + inventoryWidth) * IMAGE_SCALE_FACTOR && y >= originInventoryY  * IMAGE_SCALE_FACTOR && y < (originInventoryY + inventoryHeight) * IMAGE_SCALE_FACTOR) {
            // Return inventory slot
            let nx = Math.floor((x / IMAGE_SCALE_FACTOR) - originInventoryX);
            let ny = Math.floor((y / IMAGE_SCALE_FACTOR) - originInventoryY);
            slot = ny * 9 + nx;
        }

        return slot;
    }

    isPurse(x, y) {
        let originPurseX = 17;
        let originPurseY = 0;
        let purseWidth = 1;
        let purseHeight = 1;

        let b = x >= originPurseX * IMAGE_SCALE_FACTOR && x < (originPurseX + purseWidth) * IMAGE_SCALE_FACTOR && y >= originPurseY  * IMAGE_SCALE_FACTOR && y < (originPurseY + purseHeight) * IMAGE_SCALE_FACTOR;
        return b ? b : undefined;
    }
}

export { InputManager };