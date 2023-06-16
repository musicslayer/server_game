const { createCanvas } = require("canvas")

const Keyboard = require("../input/Keyboard.js");
const Mouse = require("../input/Mouse.js");
const Controller = require("../input/Controller.js");

class Client {
    maxNumTilesX = 16;
    maxNumTilesY = 12;
    sidePanelTiles = 10;
    isGrid = true;

    keyboard = new Keyboard();
    mouse = new Mouse();
    controller = new Controller();

    player;

    constructor(player) {
        this.player = player;
    }

    getNumTilesX() {
        return Math.min(this.maxNumTilesX, this.player.screen.numTilesX);
    }

    getNumTilesY() {
        return Math.min(this.maxNumTilesY, this.player.screen.numTilesY);
    }

    onClick(button, x, y, imageScaleFactor) {
        // TODO display info about item?
        // Left clicking on the screen is a teleport and right clicking on an inventory slot uses an item.
        let inputs = this.mouse.processClick(button);
        
        if(inputs.includes("left")) {
            let nScreen = this.isScreen(x, y, imageScaleFactor);

            if(nScreen !== undefined) {
                this.player.teleport(this.player.screen, nScreen[0], nScreen[1]);
            }
        }
        else if(inputs.includes("right")) {
            let slot = this.isInventory(x, y, imageScaleFactor);

            if(slot !== undefined) {
                this.player.consumeFromInventory(slot);
            }
        }
    }

    onDrag(button, x1, y1, x2, y2, imageScaleFactor) {
        // A left click drag can switch inventory slots or drop an entire slot, depending on where the drag motion ends.
        let inputs = this.mouse.processClick(button);

        if(inputs.includes("left")) {
            let slot1 = this.isInventory(x1, y1, imageScaleFactor);
            let slot2 = this.isInventory(x2, y2, imageScaleFactor);
            let nScreen2 = this.isScreen(x2, y2, imageScaleFactor);

            if(slot1 !== undefined && slot2 !== undefined && slot1 !== slot2) {
                // Swap two inventory slots (even if one or both of them are empty)
                this.player.swapInventorySlots(slot1, slot2);
            }
            else if(slot1 !== undefined && nScreen2 !== undefined) {
                // Drop entire stack on the player's current location.
                this.player.dropFromInventory(slot1, -1);
            }
        }
    }

    onKeyPress(keys) {
        let inputs = this.keyboard.processKeyPress(keys);

        // Inventory (only one will be executed)
        if(inputs.includes("inventory_previous")) {
            this.player.shiftInventorySlotBackward();
        }
        else if(inputs.includes("inventory_next")) {
            this.player.shiftInventorySlotForward();
        }
        else if(inputs.includes("inventory_use")) {
            this.player.consumeFromInventoryCurrentSlot();
        }

        // Player Action
        if(inputs.includes("action")) {
            this.player.action();
        }

        // **** Player Teleport Home
        if(inputs.includes("teleport_home")) {
            this.player.teleportHome();
        }

        // **** Player Boosts
        if(inputs.includes("boost_experience")) {
            this.player.addExperience(10);
        }
        if(inputs.includes("boost_health")) {
            this.player.addHealth(10);
        }
        if(inputs.includes("boost_mana")) {
            this.player.addMana(10);
        }

        // Move Position (only one will be executed)
        if(inputs.includes("move_up")) {
            this.player.moveUp();
        }
        else if(inputs.includes("move_down")) {
            this.player.moveDown();
        }
        else if(inputs.includes("move_left")) {
            this.player.moveLeft();
        }
        else if(inputs.includes("move_right")) {
            this.player.moveRight();
        }

        // **** Move Screens (only one will be executed)
        if(inputs.includes("screen_up")) {
            this.player.screenUp();
        }
        else if(inputs.includes("screen_down")) {
            this.player.screenDown();
        }
        else if(inputs.includes("screen_left")) {
            this.player.screenLeft();
        }
        else if(inputs.includes("screen_right")) {
            this.player.screenRight();
        }

        // **** Move Maps (only one will be executed)
        if(inputs.includes("map_up")) {
            this.player.mapUp();
        }
        else if(inputs.includes("map_down")) {
            this.player.mapDown();
        }
    }

    onControllerPress(buttons) {
        let inputs = this.controller.processButtonPress(buttons);

        // Inventory (only one will be executed)
        if(inputs.includes("inventory_previous")) {
            this.player.shiftInventorySlotBackward();
        }
        else if(inputs.includes("inventory_next")) {
            this.player.shiftInventorySlotForward();
        }
        else if(inputs.includes("inventory_use")) {
            this.player.consumeFromInventoryCurrentSlot();
        }

        // Player Action
        if(inputs.includes("action")) {
            this.player.action();
        }

        // Move Position (only one will be executed)
        if(inputs.includes("move_up")) {
            this.player.moveUp();
        }
        else if(inputs.includes("move_down")) {
            this.player.moveDown();
        }
        else if(inputs.includes("move_left")) {
            this.player.moveLeft();
        }
        else if(inputs.includes("move_right")) {
            this.player.moveRight();
        }
    }

    onControllerSticks(axes) {
        // axes is [leftStickX, leftStickY, rightStickX, rightStickY]
        let deadzone = 0.2;
        let speedFactor = 10;

        // Move Position (only one will be executed)
        if(Math.abs(axes[0]) > deadzone || Math.abs(axes[1]) > deadzone) {
            this.player.x += axes[0] / speedFactor;
            this.player.y += axes[1] / speedFactor;
        }
        else if(Math.abs(axes[2]) > deadzone || Math.abs(axes[3]) > deadzone) {
            this.player.x += axes[2] / speedFactor;
            this.player.y += axes[3] / speedFactor;
        }
    }

    drawClient(imageScaleFactor) {
        let canvas = createCanvas((this.getNumTilesX() + this.sidePanelTiles) * imageScaleFactor, this.getNumTilesY() * imageScaleFactor);
        let ctx = canvas.getContext("2d");
        //ctx.beginPath();

        //ctx.strokeStyle = "red";

        this.drawScreen(ctx, imageScaleFactor);
        this.drawPurse(ctx, imageScaleFactor);
        this.drawInventory(ctx, imageScaleFactor);

        if(this.isGrid) {
            this.drawScreenGrid(ctx, imageScaleFactor);
        }

        ctx.stroke();

        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    drawScreen(ctx, imageScaleFactor) {
        // Only draw the screen where the player is located at.
        ctx.beginPath();

        let images = this.player.screen.getScreenImages();

        while(images.length > 0) {
            let imageData = images.shift();
            ctx.drawImage(imageData.image, imageData.x * imageScaleFactor, imageData.y * imageScaleFactor, imageScaleFactor, imageScaleFactor);
        }

        ctx.fillRect(this.getNumTilesX() * imageScaleFactor, 0, imageScaleFactor, this.getNumTilesY() * imageScaleFactor);
        ctx.fillRect((this.getNumTilesX() + 1) * imageScaleFactor, 6 * imageScaleFactor, 9 * imageScaleFactor, imageScaleFactor);

        ctx.stroke();
    }

    drawScreenGrid(ctx, imageScaleFactor) {
        ctx.beginPath();

        for(let x = 0; x < this.getNumTilesX() + 1; x++) {
            ctx.moveTo(x * imageScaleFactor, 0);
            ctx.lineTo(x * imageScaleFactor, this.getNumTilesY() * imageScaleFactor);
        }

        for(let y = 0; y < this.getNumTilesY() + 1; y++) {
            ctx.moveTo(0, y * imageScaleFactor);
            ctx.lineTo(this.getNumTilesX() * imageScaleFactor, y * imageScaleFactor);
        }

        ctx.stroke();
    }

    drawPurse(ctx, imageScaleFactor) {
        ctx.beginPath();
        
        let originX = 17;
        let originY = 0;

        let images = this.player.purse.getPurseImages();
        while(images.length > 0) {
            let imageData = images.shift();
            ctx.drawImage(imageData.image, (originX + imageData.x) * imageScaleFactor, (originY + imageData.y) * imageScaleFactor, imageScaleFactor, imageScaleFactor);
        }

        ctx.stroke();
    }

    drawInventory(ctx, imageScaleFactor) {
        this.drawInventoryGrid(ctx, imageScaleFactor);
        this.drawInventoryItems(ctx, imageScaleFactor);
        this.drawInventoryCursor(ctx, imageScaleFactor);
    }

    drawInventoryGrid(ctx, imageScaleFactor) {
        ctx.beginPath();

        for(let x = this.getNumTilesX() + 1; x < this.getNumTilesX() + this.sidePanelTiles + 1; x++) {
            ctx.moveTo(x * imageScaleFactor, 7 * imageScaleFactor);
            ctx.lineTo(x * imageScaleFactor, this.getNumTilesY() * imageScaleFactor);
        }

        for(let y = 7; y < this.getNumTilesY() + 1; y++) {
            ctx.moveTo((this.getNumTilesX() + 1) * imageScaleFactor, y * imageScaleFactor);
            ctx.lineTo((this.getNumTilesX() + this.sidePanelTiles) * imageScaleFactor, y * imageScaleFactor);
        }

        ctx.stroke();
    }

    drawInventoryItems(ctx, imageScaleFactor) {
        ctx.beginPath();
        
        let originX = 17;
        let originY = 7;

        let images = this.player.inventory.getInventoryImages();
        while(images.length > 0) {
            let imageData = images.shift();
            ctx.drawImage(imageData.image, (originX + imageData.x) * imageScaleFactor, (originY + imageData.y) * imageScaleFactor, imageScaleFactor, imageScaleFactor);
        }

        ctx.stroke();
    }

    drawInventoryCursor(ctx, imageScaleFactor) {
        let currentSlot = this.player.inventory.currentSlot;
        if(currentSlot !== undefined) {
            let xy = this.slot2XY(currentSlot, imageScaleFactor);

            ctx.beginPath();
            
            ctx.lineWidth = "3";
            ctx.strokeStyle = "red";

            ctx.rect(xy[0], xy[1], imageScaleFactor, imageScaleFactor);
            ctx.stroke();

            ctx.lineWidth = "1";
            ctx.strokeStyle = "black";
        }
    }

    slot2XY(slot, imageScaleFactor) {
        let originX = 17;
        let originY = 7;

        let nx = slot % 9;
        let ny = Math.floor(slot / 9);

        let x = (originX + nx) * imageScaleFactor;
        let y = (originY + ny) * imageScaleFactor;

        return [x, y];
    }

    isScreen(x, y, imageScaleFactor) {
        let nScreen;

        if(x >= 0 && x < this.getNumTilesX() * imageScaleFactor && y >= 0 && y < this.getNumTilesY() * imageScaleFactor) {
            // Return normalized (tile) x,y
            nScreen = [Math.floor(x / imageScaleFactor), Math.floor(y / imageScaleFactor)];
        }

        return nScreen;
    }

    isInventory(x, y, imageScaleFactor) {
        let originX = 17;
        let originY = 7;

        let slot;

        if(x >= originX * imageScaleFactor && x < (originX + 9) * imageScaleFactor && y >= originY  * imageScaleFactor && y < (originY + 5) * imageScaleFactor) {
            // Return inventory slot
            let nx = Math.floor((x / imageScaleFactor) - originX);
            let ny = Math.floor((y / imageScaleFactor) - originY);
            slot = ny * 9 + nx;
        }

        return slot;
    }
}

module.exports = Client;