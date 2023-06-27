const Keyboard = require("../input/Keyboard.js");
const Mouse = require("../input/Mouse.js");
const Controller = require("../input/Controller.js");

class Client {
    keyboard = new Keyboard();
    mouse = new Mouse();
    controller = new Controller();

    selectedEntity;
    selectedSlot = 0;

    canInput = true;
    inputTime = 0.1;

    player;

    constructor(player) {
        this.player = player;
    }

    // location vs. info:
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
                if(this.player.inventory.itemMap.has(info[0])) {
                    this.selectedSlot = info[0];
                    this.selectedEntity = this.player.inventory.itemMap.get(info[0]);
                }
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
                    this.selectedEntity = this.player.inventory.itemMap.get(info1[0]);
                    this.selectedSlot = info2[0];
                }
                else if(this.selectedSlot === info2[0]) {
                    this.selectedEntity = this.player.inventory.itemMap.get(info2[0]);
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
            this.performTask(() => {
                this.selectedSlot = this.selectedSlot === 0 ? this.player.inventory.maxSlots - 1 : this.selectedSlot - 1;
                this.selectedEntity = this.player.inventory.itemMap.get(this.selectedSlot);
            });
        }
        else if(inputs.includes("inventory_next")) {
            this.performTask(() => {
                this.selectedSlot = this.selectedSlot === this.player.inventory.maxSlots - 1 ? 0 : this.selectedSlot + 1;
                this.selectedEntity = this.player.inventory.itemMap.get(this.selectedSlot);
            });
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

        // **** Player Kill
        if(inputs.includes("kill")) {
            this.player.kill();
        }

        // **** Player Revive
        if(inputs.includes("revive")) {
            this.player.revive();
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
        if(inputs.includes("add_gold")) {
            let gold = require("../entity/EntityFactory").createInstance("gold", 1000);
            gold.screen = this.player.screen;
            gold.x = this.player.getMovementX();
            gold.y = this.player.getMovementY();
            this.player.createEntity(gold);
        }

        // Move Position (only one will be executed)
        if(inputs.includes("move_up")) {
            this.player.move("up", 1);
        }
        else if(inputs.includes("move_down")) {
            this.player.move("down", 1);
        }
        else if(inputs.includes("move_left")) {
            this.player.move("left", 1);
        }
        else if(inputs.includes("move_right")) {
            this.player.move("right", 1);
        }

        // **** Move Screens (only one will be executed)
        if(inputs.includes("screen_up")) {
            this.player.moveScreen("up");
        }
        else if(inputs.includes("screen_down")) {
            this.player.moveScreen("down");
        }
        else if(inputs.includes("screen_left")) {
            this.player.moveScreen("left");
        }
        else if(inputs.includes("screen_right")) {
            this.player.moveScreen("right");
        }

        // **** Move Maps (only one will be executed)
        if(inputs.includes("map_up")) {
            this.player.moveMap("up");
        }
        else if(inputs.includes("map_down")) {
            this.player.moveMap("down");
        }

        // **** Move Worlds (only one will be executed)
        if(inputs.includes("world_up")) {
            this.player.moveWorld("up");
        }
        else if(inputs.includes("world_down")) {
            this.player.moveWorld("down");
        }
    }

    onControllerPress(buttons) {
        let inputs = this.controller.processButtonPress(buttons);

        // Inventory (only one will be executed)
        if(inputs.includes("inventory_previous")) {
            this.performTask(() => {
                this.selectedSlot = this.selectedSlot === 0 ? this.player.inventory.maxSlots - 1 : this.selectedSlot - 1;
                this.selectedEntity = this.player.inventory.itemMap.get(this.selectedSlot);
            });
        }
        else if(inputs.includes("inventory_next")) {
            this.performTask(() => {
                this.selectedSlot = this.selectedSlot === this.player.inventory.maxSlots - 1 ? 0 : this.selectedSlot + 1;
                this.selectedEntity = this.player.inventory.itemMap.get(this.selectedSlot);
            });
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
            this.player.move("up", 1);
        }
        else if(inputs.includes("move_down")) {
            this.player.move("down", 1);
        }
        else if(inputs.includes("move_left")) {
            this.player.move("left", 1);
        }
        else if(inputs.includes("move_right")) {
            this.player.move("right", 1);
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

    performTask(task) {
        // Rate limit actions which don't rely on server ticking.
        if(this.canInput) {
            this.canInput = false;

            this.player.getServer().addTask(this.inputTime, () => {
                this.canInput = true;
            });

            this.player.getServer().addTask(0, () => {
                task();
            });
        }
    }

    getClientData() {
        // Tiles
        let tiles = [];
        for(const tile of this.player.screen.tiles) {
            tiles.push({
                x: tile.x,
                y: tile.y,
                imageFolders: tile.imageFolders,
                imageFiles: tile.imageFiles
            });
        }

        // Add in home tile.
        if(this.player.screen.name === this.player.homeScreenName) {
            tiles.push({
                x: this.player.homeX,
                y: this.player.homeY,
                imageFolders: ["marker"],
                imageFiles: ["home"]
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
            let statuses = [];
            if(entity.isDead) {
                statuses.push("dead");
            }
            if(entity.isInvincible) {
                statuses.push("invincible");
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
                statuses: statuses
            });
        }

        // Inventory
        let inventory = {};
        inventory.currentSlot = this.selectedSlot;
        inventory.items = [];
        for(let index = 0; index < this.player.inventory.maxSlots; index++) {
            let item = this.player.inventory.itemMap.get(index);
            if(item) {
                inventory.items.push({
                    id: item.id,
                    stackSize: item.stackSize
                });
            }
            else {
                inventory.items.push(undefined);
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

    getDevData() {
        // Info
        let info = {};
        info.currentTick = this.player.getServer().currentTick;
        
        return {
            info: info
        }
    }
}

module.exports = Client;