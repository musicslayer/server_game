const Keyboard = require("../input/Keyboard.js");
const Mouse = require("../input/Mouse.js");
const Controller = require("../input/Controller.js");

class Client {
    keyboard = new Keyboard();
    mouse = new Mouse();
    controller = new Controller();

    player;

    constructor(player) {
        this.player = player;
    }

    onClick(button, x, y, imageScaleFactor) {
        // TODO display info about item?

        // Left clicking on the screen is a teleport
        // Right clicking on an inventory slot uses an item.
        // Right clicking on the purse drops up to 100 gold.
        let inputs = this.mouse.processClick(button);
        
        if(inputs.includes("left")) {
            let nScreen = this.isScreen(x, y, imageScaleFactor);

            if(nScreen !== undefined) {
                this.player.teleport(this.player.screen, nScreen[0], nScreen[1]);
            }
        }
        else if(inputs.includes("right")) {
            let slot = this.isInventory(x, y, imageScaleFactor);
            let isPurse = this.isPurse(x, y, imageScaleFactor);

            if(slot !== undefined) {
                this.player.consumeFromInventory(slot);
            }
            else if(isPurse) {
                this.player.doDropFromPurse(100);
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

    getClientData() {
        // Return all the data that the client needs.
        let tiles = [];
        let otherEntities = [];
        let playerEntities = [];

        let screen = this.player.screen;

        // Tiles
        for(const tile of screen.tiles) {
            tiles.push({
                x: tile.x,
                y: tile.y,
                imageTableNameArray: tile.imageTableNameArray,
                imageNameArray: tile.imageNameArray
            });
        }

        // Non-players.
        for(const entity of screen.otherEntities) {
            otherEntities.push({
                x: entity.x,
                y: entity.y,
                id: entity.id
            });
        }

        // Players
        for(const entity of screen.playerEntities) {
            playerEntities.push({
                x: entity.x,
                y: entity.y,
                id: entity.id
            });
        }

        let clientData = {
            tiles: tiles,
            otherEntities: otherEntities,
            playerEntities: playerEntities
        };

        return clientData;
    }
}

module.exports = Client;