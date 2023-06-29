const Keyboard = require("../input/Keyboard.js");
const Mouse = require("../input/Mouse.js");
const Controller = require("../input/Controller.js");
const EntityFactory = require("../entity/EntityFactory");
const MoveAnimation = require("../animation/MoveAnimation.js");

class Client {
    keyboard = new Keyboard();
    mouse = new Mouse();
    controller = new Controller();

    selectedEntity;
    selectedSlot = 0;

    delayMap = new Map();
    clientInputTime = 0.1;

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
                this.scheduleClientTask(undefined, 0, () => {
                    this.selectedEntity = this.player.screen.getHighestEntity(info[0], info[1]);
                });
            }
            else if(location === "inventory") {
                if(this.player.inventory.itemMap.has(info[0])) {
                    this.scheduleClientTask(undefined, 0, () => {
                        this.selectedSlot = info[0];
                        this.selectedEntity = this.player.inventory.itemMap.get(info[0]);
                    });
                }
            }
        }
        else if(inputs.includes("middle")) {
            if(location === "screen") {
                this.scheduleMoveTask(undefined, 0, () => {
                    this.player.doTeleport(this.player.screen, info[0], info[1]);
                });
            }
        }
        else if(inputs.includes("right")) {
            if(location === "inventory") {
                if(!this.player.screen.isDynamic) {
                    this.scheduleInventoryTask(undefined, 0, () => {
                        this.player.doConsumeFromInventory(info[0]);
                    });
                }
            }
            else if(location === "purse") {
                if(!this.player.screen.isDynamic) {
                    this.schedulePurseTask(undefined, 0, () => {
                        this.player.doDropFromPurse(100);
                    });
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
                this.scheduleInventoryTask(undefined, 0, () => {
                    if(this.selectedSlot === info1[0]) {
                        this.selectedEntity = this.player.inventory.itemMap.get(info1[0]);
                        this.selectedSlot = info2[0];
                    }
                    else if(this.selectedSlot === info2[0]) {
                        this.selectedEntity = this.player.inventory.itemMap.get(info2[0]);
                        this.selectedSlot = info1[0];
                    }
                    
                    this.player.doSwapInventorySlots(info1[0], info2[0]);
                });
            }
            else if(location1 === "inventory" && location2 === "screen") {
                // Drop entire stack on the player's current location.
                if(!this.player.screen.isDynamic) {
                    this.scheduleInventoryTask(undefined, 0, () => {
                        this.player.doDropFromInventory(info1[0], -1);
                    });
                }
            }
        }
    }

    onKeyPress(keys) {
        let inputs = this.keyboard.processKeyPress(keys);

        // Inventory (only one will be executed)
        if(inputs.includes("inventory_previous")) {
            this.scheduleClientTask(undefined, 0, () => {
                this.selectedSlot = this.selectedSlot === 0 ? this.player.inventory.maxSlots - 1 : this.selectedSlot - 1;
                this.selectedEntity = this.player.inventory.itemMap.get(this.selectedSlot);
            });
        }
        else if(inputs.includes("inventory_next")) {
            this.scheduleClientTask(undefined, 0, () => {
                this.selectedSlot = this.selectedSlot === this.player.inventory.maxSlots - 1 ? 0 : this.selectedSlot + 1;
                this.selectedEntity = this.player.inventory.itemMap.get(this.selectedSlot);
            });
        }
        else if(inputs.includes("inventory_use")) {
            if(!this.player.screen.isDynamic) {
                this.scheduleInventoryTask(undefined, 0, () => {
                    this.player.doConsumeFromInventory(this.selectedSlot);
                });
            }
        }

        // Player Action
        if(inputs.includes("action")) {
            this.scheduleActionTask(undefined, 0, () => {
                this.player.doAction();
            });
        }

        // **** Player Teleport Home
        if(inputs.includes("teleport_home")) {
            this.scheduleMoveTask(undefined, 0, () => {
                this.player.doTeleportHome();
            });
        }

        // **** Player Kill
        if(inputs.includes("kill")) {
            this.scheduleMoveTask(undefined, 0, () => {
                this.player.doKill();
            });
        }

        // **** Player Revive
        if(inputs.includes("revive")) {
            this.scheduleMoveTask(undefined, 0, () => {
                this.player.doRevive();
            });
        }

        // **** Player Boosts
        if(inputs.includes("boost_experience")) {
            this.scheduleActionTask(undefined, 0, () => {
                this.player.doAddExperience(10);
            });
        }
        if(inputs.includes("boost_health")) {
            this.scheduleActionTask(undefined, 0, () => {
                this.player.doAddHealth(10);
            });
        }
        if(inputs.includes("boost_mana")) {
            this.scheduleActionTask(undefined, 0, () => {
                this.player.doAddMana(10);
            });
        }
        if(inputs.includes("add_gold")) {
            this.scheduleCreateTask(undefined, 0, () => {
                let gold = EntityFactory.createInstance("gold", 1000);
                gold.screen = this.player.screen;
                gold.x = this.player.getMovementX();
                gold.y = this.player.getMovementY();
                this.player.doSpawnEntity(gold);
            });
        }
        if(inputs.includes("make_invincible")) {
            this.scheduleActionTask(undefined, 0, () => {
                this.player.doMakeInvincible(10);
            });
        }

        // Move Position (only one will be executed)
        // Change player direction if needed, or take a step if we are already facing that way.
        if(inputs.includes("move_up")) {
            if(this.player.direction === "up" && this.player.isNextStepAllowed("up")) {
                this.scheduleMoveTask(new MoveAnimation(this.player, this.player.moveTime), this.player.moveTime, () => {
                    this.player.doMoveStep();
                });
            }
            else {
                this.scheduleDirectionTask(undefined, 0, () => {
                    this.player.doChangeDirection("up");
                });
            }
        }
        else if(inputs.includes("move_down")) {
            if(this.player.direction === "down" && this.player.isNextStepAllowed("down")) {
                this.scheduleMoveTask(new MoveAnimation(this.player, this.player.moveTime), this.player.moveTime, () => {
                    this.player.doMoveStep();
                });
            }
            else {
                this.scheduleDirectionTask(undefined, 0, () => {
                    this.player.doChangeDirection("down");
                });
            }
        }
        else if(inputs.includes("move_left")) {
            if(this.player.direction === "left" && this.player.isNextStepAllowed("left")) {
                this.scheduleMoveTask(new MoveAnimation(this.player, this.player.moveTime), this.player.moveTime, () => {
                    this.player.doMoveStep();
                });
            }
            else {
                this.scheduleDirectionTask(undefined, 0, () => {
                    this.player.doChangeDirection("left");
                });
            }
        }
        else if(inputs.includes("move_right")) {
            if(this.player.direction === "right" && this.player.isNextStepAllowed("right")) {
                this.scheduleMoveTask(new MoveAnimation(this.player, this.player.moveTime), this.player.moveTime, () => {
                    this.player.doMoveStep();
                });
            }
            else {
                this.scheduleDirectionTask(undefined, 0, () => {
                    this.player.doChangeDirection("right");
                });
            }
        }

        // **** Move Screens (only one will be executed)
        if(inputs.includes("screen_up")) {
            this.scheduleMoveTask(undefined, 0, () => {
                this.player.doMoveScreen("up");
            });
        }
        else if(inputs.includes("screen_down")) {
            this.scheduleMoveTask(undefined, 0, () => {
                this.player.doMoveScreen("down");
            });
        }
        else if(inputs.includes("screen_left")) {
            this.scheduleMoveTask(undefined, 0, () => {
                this.player.doMoveScreen("left");
            });
        }
        else if(inputs.includes("screen_right")) {
            this.scheduleMoveTask(undefined, 0, () => {
                this.player.doMoveScreen("right");
            });
        }

        // **** Move Maps (only one will be executed)
        if(inputs.includes("map_up")) {
            this.scheduleMoveTask(undefined, 0, () => {
                this.player.doMoveMap("up");
            });
        }
        else if(inputs.includes("map_down")) {
            this.scheduleMoveTask(undefined, 0, () => {
                this.player.doMoveMap("down");
            });
        }

        // **** Move Worlds (only one will be executed)
        if(inputs.includes("world_up")) {
            this.scheduleMoveTask(undefined, 0, () => {
                this.player.doMoveWorld("up");
            });
        }
        else if(inputs.includes("world_down")) {
            this.scheduleMoveTask(undefined, 0, () => {
                this.player.doMoveWorld("down");
            });
        }
    }

    onControllerPress(buttons) {
        let inputs = this.controller.processButtonPress(buttons);

        // Inventory (only one will be executed)
        if(inputs.includes("inventory_previous")) {
            this.scheduleClientTask(undefined, 0, () => {
                this.selectedSlot = this.selectedSlot === 0 ? this.player.inventory.maxSlots - 1 : this.selectedSlot - 1;
                this.selectedEntity = this.player.inventory.itemMap.get(this.selectedSlot);
            });
        }
        else if(inputs.includes("inventory_next")) {
            this.scheduleClientTask(undefined, 0, () => {
                this.selectedSlot = this.selectedSlot === this.player.inventory.maxSlots - 1 ? 0 : this.selectedSlot + 1;
                this.selectedEntity = this.player.inventory.itemMap.get(this.selectedSlot);
            });
        }
        else if(inputs.includes("inventory_use")) {
            if(!this.player.screen.isDynamic) {
                this.scheduleInventoryTask(undefined, 0, () => {
                    this.player.doConsumeFromInventory(this.selectedSlot);
                });
            }
        }

        // Player Action
        if(inputs.includes("action")) {
            this.scheduleActionTask(undefined, 0, () => {
                this.player.doAction();
            });
        }

        // Move Position (only one will be executed)
        if(inputs.includes("move_up")) {
            if(this.player.direction === "up" && this.player.isNextStepAllowed("up")) {
                this.scheduleMoveTask(new MoveAnimation(this.player, this.player.moveTime), this.player.moveTime, () => {
                    this.player.doMoveStep();
                });
            }
            else {
                this.scheduleDirectionTask(undefined, 0, () => {
                    this.player.doChangeDirection("up");
                });
            }
        }
        else if(inputs.includes("move_down")) {
            if(this.player.direction === "down" && this.player.isNextStepAllowed("down")) {
                this.scheduleMoveTask(new MoveAnimation(this.player, this.player.moveTime), this.player.moveTime, () => {
                    this.player.doMoveStep();
                });
            }
            else {
                this.scheduleDirectionTask(undefined, 0, () => {
                    this.player.doChangeDirection("down");
                });
            }
        }
        else if(inputs.includes("move_left")) {
            if(this.player.direction === "left" && this.player.isNextStepAllowed("left")) {
                this.scheduleMoveTask(new MoveAnimation(this.player, this.player.moveTime), this.player.moveTime, () => {
                    this.player.doMoveStep();
                });
            }
            else {
                this.scheduleDirectionTask(undefined, 0, () => {
                    this.player.doChangeDirection("left");
                });
            }
        }
        else if(inputs.includes("move_right")) {
            if(this.player.direction === "right" && this.player.isNextStepAllowed("right")) {
                this.scheduleMoveTask(new MoveAnimation(this.player, this.player.moveTime), this.player.moveTime, () => {
                    this.player.doMoveStep();
                });
            }
            else {
                this.scheduleDirectionTask(undefined, 0, () => {
                    this.player.doChangeDirection("right");
                });
            }
        }
    }

    // This method is for demonstration purposes only and breaks the game logic.
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

    scheduleClientTask(animation, time, task) {
        this.scheduleTask("client", this.clientInputTime, animation, time, task);
    }

    scheduleCreateTask(animation, time, task) {
        this.scheduleTask("create", this.player.createTime, animation, time, task);
    }

    scheduleMoveTask(animation, time, task) {
        this.scheduleTask("move", this.player.moveTime, animation, time, task);
    }

    scheduleDirectionTask(animation, time, task) {
        // Use the move delay type with the direction time.
        this.scheduleTask("move", this.player.directionTime, animation, time, task);
    }

    scheduleActionTask(animation, time, task) {
        this.scheduleTask("action", this.player.actionTime, animation, time, task);
    }

    scheduleInventoryTask(animation, time, task) {
        this.scheduleTask("inventory", this.player.inventoryTime, animation, time, task);
    }

    schedulePurseTask(animation, time, task) {
        this.scheduleTask("purse", this.player.purseTime, animation, time, task);
    }

    scheduleTask(delayType, delayTime, animation, time, task) {
        if(this.delayMap.get(delayType) === true || this.delayMap.get(delayType) === undefined) {
            this.delayMap.set(delayType, false);

            this.player.getServerScheduler().scheduleTask(animation, time, task);

            this.player.getServerScheduler().scheduleTask(animation, delayTime, () => {
                this.delayMap.set(delayType, true);
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
        info.currentTick = this.player.getServerScheduler().currentTick;
        
        return {
            info: info
        }
    }
}

module.exports = Client;