const Keyboard = require("../input/Keyboard.js");
const Mouse = require("../input/Mouse.js");
const Controller = require("../input/Controller.js");

class Client {
    keyboard = new Keyboard();
    mouse = new Mouse();
    controller = new Controller();

    selectedEntity;
    selectedSlot = 0;

    player;

    constructor(player) {
        this.player = player;
    }

    // location vs. info:
    // undefined => []
    // "screen" => [x, y] (normalized)
    // "inventory" => [slot]
    // "purse" => []

    onClick(button, location, info) {
        // Left clicking on the screen or inventory selects an entity.
        // Middle clicking on the screen is a teleport.
        // Right clicking on an inventory slot uses an item.
        // Right clicking on the purse drops up to 100 gold.
        let inputs = this.mouse.processClick(button);
        
        if(inputs.includes("left")) {
            if(location === "screen") {
                this.selectedEntity = this.player.screen.getHighestEntity(info[0], info[1]);
            }
            else if(location === "inventory") {
                this.selectedSlot = info[0];
                this.selectedEntity = this.player.inventory.itemArray[info[0]];
            }
        }
        else if(inputs.includes("middle")) {
            if(location === "screen") {
                this.player.teleport(this.player.screen, info[0], info[1]);
            }
        }
        else if(inputs.includes("right")) {
            if(location === "inventory") {
                if(!this.player.screen.isDynamic) {
                    this.player.consumeFromInventory(info[0]);
                }
            }
            else if(location === "purse") {
                if(!this.player.screen.isDynamic) {
                    this.player.dropFromPurse(100);
                }
            }
        }
    }

    onDrag(button, location1, info1, location2, info2) {
        // A left click drag can switch inventory slots or drop an entire slot, depending on where the drag motion ends.
        let inputs = this.mouse.processClick(button);

        if(inputs.includes("left")) {
            if(location1 === "inventory" && location2 === "inventory" && info1[0] !== info2[0]) {
                // Swap two inventory slots (even if one or both of them are empty)
                if(this.selectedSlot === info1[0]) {
                    this.selectedEntity = this.player.inventory.itemArray[info1[0]];
                    this.selectedSlot = info2[0];
                }
                else if(this.selectedSlot === info2[0]) {
                    this.selectedEntity = this.player.inventory.itemArray[info2[0]];
                    this.selectedSlot = info1[0];
                }

                this.player.swapInventorySlots(info1[0], info2[0]);
            }
            else if(location1 === "inventory" && location2 === "screen") {
                // Drop entire stack on the player's current location.
                if(!this.player.screen.isDynamic) {
                    this.player.dropFromInventory(info1[0], -1);
                }
            }
        }
    }

    onKeyPress(keys) {
        let inputs = this.keyboard.processKeyPress(keys);

        // Inventory (only one will be executed)
        if(inputs.includes("inventory_previous")) {
            this.selectedSlot = this.selectedSlot === 0 ? this.player.inventory.maxSlots - 1 : this.selectedSlot--;
            this.selectedEntity = this.player.inventory.itemArray[this.selectedSlot];
        }
        else if(inputs.includes("inventory_next")) {
            this.selectedSlot = this.selectedSlot === this.player.inventory.maxSlots - 1 ? 0 : this.selectedSlot++;
            this.selectedEntity = this.player.inventory.itemArray[this.selectedSlot];
        }
        else if(inputs.includes("inventory_use")) {
            if(!this.player.screen.isDynamic) {
                this.player.consumeFromInventory(this.selectedSlot);
            }
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

        // **** Move Worlds (only one will be executed)
        if(inputs.includes("world_up")) {
            this.player.worldUp();
        }
        else if(inputs.includes("world_down")) {
            this.player.worldDown();
        }
    }

    onControllerPress(buttons) {
        let inputs = this.controller.processButtonPress(buttons);

        // Inventory (only one will be executed)
        if(inputs.includes("inventory_previous")) {
            this.selectedSlot = this.selectedSlot === 0 ? this.player.inventory.maxSlots - 1 : this.selectedSlot--;
            this.selectedEntity = this.player.inventory.itemArray[this.selectedSlot];
        }
        else if(inputs.includes("inventory_next")) {
            this.selectedSlot = this.selectedSlot === this.player.inventory.maxSlots - 1 ? 0 : this.selectedSlot++;
            this.selectedEntity = this.player.inventory.itemArray[this.selectedSlot];
        }
        else if(inputs.includes("inventory_use")) {
            if(!this.player.screen.isDynamic) {
                this.player.consumeFromInventory(this.selectedSlot);
            }
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
        // Tiles
        let tiles = [];
        for(const tile of this.player.screen.tiles) {
            tiles.push({
                x: tile.x,
                y: tile.y,
                imageFolderArray: tile.imageFolderArray,
                imageFileArray: tile.imageFileArray
            });
        }

        // Add in home tile.
        if(this.player.screen.name === this.player.homeScreenName) {
            tiles.push({
                x: this.player.homeX,
                y: this.player.homeY,
                imageFolderArray: ["marker"],
                imageFileArray: ["home"]
            });
        }

        // Non-players.
        let otherEntities = [];
        for(const entity of this.player.screen.otherEntities) {
            otherEntities.push({
                stackSize: entity.stackSize,
                id: entity.id,
                x: entity.x,
                y: entity.y,
                animationShiftX: entity.animationShiftX,
                animationShiftY: entity.animationShiftY,
                healthFraction: entity.health / entity.maxHealth,
                manaFraction: entity.mana / entity.maxMana,
                experienceFraction: entity.experience / 100,
                level: entity.level
            });
        }

        // Players
        let playerEntities = [];
        for(const entity of this.player.screen.playerEntities) {
            let statusArray = [];
            if(entity.isDead) {
                statusArray.push("dead");
            }
            if(entity.isInvincible) {
                statusArray.push("invincible");
            }

            playerEntities.push({
                id: entity.id,
                stackSize: entity.stackSize,
                x: entity.x,
                y: entity.y,
                animationShiftX: entity.animationShiftX,
                animationShiftY: entity.animationShiftY,
                healthFraction: entity.health / entity.maxHealth,
                manaFraction: entity.mana / entity.maxMana,
                experienceFraction: entity.experience / 100,
                level: entity.level,
                statusArray: statusArray
            });
        }

        // Inventory
        let inventory = {};
        inventory.currentSlot = this.selectedSlot;
        inventory.itemArray = [];
        for(const item of this.player.inventory.itemArray) {
            if(item) {
                inventory.itemArray.push({
                    id: item.id,
                    stackSize: item.stackSize
                });
            }
            else {
                inventory.itemArray.push(undefined);
            }
        }

        // Purse
        let purse = {};
        purse.goldTotal = this.player.purse.goldTotal;

        // Info
        let info = {};
        info.id = this.selectedEntity?.id;
        info.name = this.selectedEntity?.getName();
        info.text = this.selectedEntity?.getInfo();

        return {
            tiles: tiles,
            otherEntities: otherEntities,
            playerEntities: playerEntities,
            inventory: inventory,
            purse: purse,
            info: info
        };
    }
}

module.exports = Client;