const { createCanvas, ImageData } = require("canvas")

const Keyboard = require("../input/Keyboard.js");
const Mouse = require("../input/Mouse.js");

class Client {
    numTilesX = 16;
    numTilesY = 12;
    sidePanelTiles = 10;

    world;
    player;
    keyboard;
    mouse;

    isGrid = true;

    constructor(world, player) {
        this.world = world;
        this.player = player;
        this.keyboard = new Keyboard();
        this.mouse = new Mouse();
    }

    onClick(button, x, y, imageScaleFactor) {
        let input = this.mouse.processClick(button);

        let nScreen = this.isScreen(x, y, imageScaleFactor);
        let slot = this.isInventory(x, y, imageScaleFactor);

        if(nScreen !== undefined) {
            // TODO What happens when you click on the screen (display info? use skill?)

            // For now, left clicking on the screen is a teleport.
            if(input === "left") {
                this.player.teleport(this.player.world, this.player.map, this.player.screen, nScreen[0], nScreen[1]);
            }
        }
        else if(slot !== undefined) {
            if(input === "left") {
                //this.player.inventory.onLeftClick(slot);
            }
            else if(input === "right") {
                this.player.consumeFromInventory(slot);
            }
        }
    }

    onKeyPress(key) {
        let input = this.keyboard.processKey(key);

        // Player Action
        if(input === "action") {
            this.player.action();
        }

        // Player Teleport Home
        else if(input === "teleport_home") {
            this.player.teleportHome();
        }

        // Player Experience Boost
        else if(input === "experience_boost") {
            this.player.experienceBoost();
        }

        // Move Position
        else if(input === "move_up") {
            this.player.moveUp();
        }
        else if(input === "move_down") {
            this.player.moveDown();
        }
        else if(input === "move_left") {
            this.player.moveLeft();
        }
        else if(input === "move_right") {
            this.player.moveRight();
        }

        // Move Screens
        else if(input === "screen_up") {
            this.player.screenUp();
        }
        else if(input === "screen_down") {
            this.player.screenDown();
        }
        else if(input === "screen_left") {
            this.player.screenLeft();
        }
        else if(input === "screen_right") {
            this.player.screenRight();
        }

        // Move Maps
        else if(input === "map_up") {
            this.player.mapUp();
        }
        else if(input === "map_down") {
            this.player.mapDown();
        }
    }

    drawClient(imageScaleFactor) {
        let canvas = createCanvas((this.numTilesX + this.sidePanelTiles) * imageScaleFactor, this.numTilesY * imageScaleFactor);
        let ctx = canvas.getContext("2d");
        ctx.beginPath();

        //ctx.strokeStyle = "red";

        this.drawScreen(ctx, imageScaleFactor);
        this.drawInventory(ctx, imageScaleFactor);

        if(this.isGrid) {
            this.drawScreenGrid(ctx, imageScaleFactor);
        }

        ctx.stroke();

        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    drawScreen(ctx, imageScaleFactor) {
        // Only draw the screen where the player is located at.
        let images = this.player.screen.getScreenImages();

        while(images.length > 0) {
            let imageData = images.shift();
            ctx.drawImage(imageData.image, imageData.x * imageScaleFactor, imageData.y * imageScaleFactor, imageScaleFactor, imageScaleFactor);
        }

        ctx.fillRect(this.numTilesX * imageScaleFactor, 0, imageScaleFactor, this.numTilesY * imageScaleFactor);
        ctx.fillRect((this.numTilesX + 1) * imageScaleFactor, 6 * imageScaleFactor, 9 * imageScaleFactor, imageScaleFactor);
    }

    drawScreenGrid(ctx, imageScaleFactor) {
        for(let x = 0; x < this.numTilesX + 1; x++) {
            ctx.moveTo(x * imageScaleFactor, 0);
            ctx.lineTo(x * imageScaleFactor, this.numTilesY * imageScaleFactor);
        }

        for(let y = 0; y < this.numTilesY + 1; y++) {
            ctx.moveTo(0, y * imageScaleFactor);
            ctx.lineTo(this.numTilesX * imageScaleFactor, y * imageScaleFactor);
        }
    }

    drawInventory(ctx, imageScaleFactor) {
        this.drawInventoryGrid(ctx, imageScaleFactor);

        let originX = 17;
        let originY = 7;

        let images = this.player.inventory.getInventoryImages();
        while(images.length > 0) {
            let imageData = images.shift();
            ctx.drawImage(imageData.image, (originX + imageData.x) * imageScaleFactor, (originY + imageData.y) * imageScaleFactor, imageScaleFactor, imageScaleFactor);
        }
    }

    drawInventoryGrid(ctx, imageScaleFactor) {
        for(let x = this.numTilesX + 1; x < this.numTilesX + this.sidePanelTiles + 1; x++) {
            ctx.moveTo(x * imageScaleFactor, 7 * imageScaleFactor);
            ctx.lineTo(x * imageScaleFactor, this.numTilesY * imageScaleFactor);
        }

        for(let y = 7; y < this.numTilesY + 1; y++) {
            ctx.moveTo((this.numTilesX + 1) * imageScaleFactor, y * imageScaleFactor);
            ctx.lineTo((this.numTilesX + this.sidePanelTiles) * imageScaleFactor, y * imageScaleFactor);
        }
    }

    isScreen(x, y, imageScaleFactor) {
        let nScreen;

        if(x >= 0 && x < this.numTilesX * imageScaleFactor && y >= 0 && y < this.numTilesY * imageScaleFactor) {
            // Return normalized x, y
            nScreen = [Math.floor(x / imageScaleFactor), Math.floor(y / imageScaleFactor)];

            console.log("GRID: x: " + nScreen[0] + " y: " + nScreen[1]);
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

            console.log("Inventory: " + slot);
        }

        return slot;
    }
}

module.exports = Client;