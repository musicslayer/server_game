const Keyboard = require("../input/Keyboard.js");
const Mouse = require("../input/Mouse.js");
const Controller = require("../input/Controller.js");
const Entity = require("../entity/Entity");
const MoveAnimation = require("../animation/MoveAnimation.js");
const ServerTask = require("../server/ServerTask.js");
const Util = require("../util/Util.js");

const REALTIME_INPUT_TIME = 1;

class Client {
    socket;
    appState;
    
    key;

    keyboard = new Keyboard();
    mouse = new Mouse();
    controller = new Controller();

    realtimeDelay = true;
    
    playerName;
    player;

    constructor(playerName, player) {
        this.playerName = playerName;
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
                this.scheduleInventoryTask(undefined, 0, (player, info_0, info_1) => {
                    player.selectedEntity = player.screen.getHighestEntity(info_0, info_1);
                }, this.player, info[0], info[1]);
            }
            else if(location === "inventory") {
                if(this.player.inventory.itemMap.has(info[0])) {
                    this.scheduleInventoryTask(undefined, 0, (player, info_0) => {
                        player.selectedSlot = info_0;
                        player.selectedEntity = player.inventory.itemMap.get(info_0);
                    }, this.player, info[0]);
                }
            }
        }
        else if(inputs.includes("middle")) {
            if(location === "screen") {
                this.scheduleMoveTask(undefined, 0, (player, info_0, info_1) => {
                    player.doTeleport(player.screen, info_0, info_1);
                }, this.player, info[0], info[1]);
            }
        }
        else if(inputs.includes("right")) {
            if(location === "inventory") {
                if(!this.player.screen.isDynamic) {
                    this.scheduleInventoryTask(undefined, 0, (player, info_0) => {
                        player.doConsumeFromInventory(info_0);
                    }, this.player, info[0]);
                }
            }
            else if(location === "purse") {
                if(!this.player.screen.isDynamic) {
                    this.schedulePurseTask(undefined, 0, (player) => {
                        player.doDropFromPurse(100);
                    }, this.player);
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
                this.scheduleInventoryTask(undefined, 0, (player, info1_0, info2_0) => {
                    if(player.selectedSlot === info1_0) {
                        player.selectedEntity = player.inventory.itemMap.get(info1_0);
                        player.selectedSlot = info2_0;
                    }
                    else if(player.selectedSlot === info2_0) {
                        player.selectedEntity = player.inventory.itemMap.get(info2_0);
                        player.selectedSlot = info1_0;
                    }
                    
                    player.doSwapInventorySlots(info1_0, info2_0);
                }, this.player, info1[0], info2[0]);
            }
            else if(location1 === "inventory" && location2 === "screen") {
                // Drop entire stack on the player's current location.
                if(!this.player.screen.isDynamic) {
                    this.scheduleInventoryTask(undefined, 0, (player, info1_0) => {
                        player.doDropFromInventory(info1_0, -1);
                    }, this.player, info1[0]);
                }
            }
        }
    }

    async onKeyPress(keys) {
        let inputs = this.keyboard.processKeyPress(keys);

        // Inventory (only one will be executed)
        if(inputs.includes("inventory_previous")) {
            this.scheduleInventoryTask(undefined, 0, (player) => {
                player.selectedSlot = player.selectedSlot === 0 ? player.inventory.maxSlots - 1 : player.selectedSlot - 1;
                player.selectedEntity = player.inventory.itemMap.get(player.selectedSlot);
            }, this.player);
        }
        else if(inputs.includes("inventory_next")) {
            this.scheduleInventoryTask(undefined, 0, (player) => {
                player.selectedSlot = player.selectedSlot === player.inventory.maxSlots - 1 ? 0 : player.selectedSlot + 1;
                player.selectedEntity = player.inventory.itemMap.get(player.selectedSlot);
            }, this.player);
        }
        else if(inputs.includes("inventory_use")) {
            if(!this.player.screen.isDynamic) {
                this.scheduleInventoryTask(undefined, 0, (player) => {
                    player.doConsumeFromInventory(player.selectedSlot);
                }, this.player);
            }
        }

        // Player Action
        if(inputs.includes("action")) {
            this.scheduleActionTask(undefined, 0, (player) => {
                player.doAction();
            }, this.player);
        }

        // **** Player Teleport Home
        if(inputs.includes("teleport_home")) {
            this.scheduleMoveTask(undefined, 0, (player) => {
                player.doTeleportHome();
            }, this.player);
        }

        // **** Player Kill
        if(inputs.includes("kill")) {
            this.scheduleMoveTask(undefined, 0, (player) => {
                player.doKill();
            }, this.player);
        }

        // **** Player Revive
        if(inputs.includes("revive")) {
            this.scheduleMoveTask(undefined, 0, (player) => {
                player.doRevive();
            }, this.player);
        }

        // **** Player Boosts
        if(inputs.includes("boost_experience")) {
            this.scheduleActionTask(undefined, 0, (player) => {
                player.doAddExperience(10);
            }, this.player);
        }
        if(inputs.includes("boost_health")) {
            this.scheduleActionTask(undefined, 0, (player) => {
                player.doAddHealth(10);
            }, this.player);
        }
        if(inputs.includes("boost_mana")) {
            this.scheduleActionTask(undefined, 0, (player) => {
                player.doAddMana(10);
            }, this.player);
        }
        if(inputs.includes("add_gold")) {
            let gold = Entity.createInstance("Gold", 1000);
            gold.setScreen(this.player.screen);
            gold.x = this.player.getMovementX();
            gold.y = this.player.getMovementY();

            this.scheduleCreateTask(undefined, 0, (player, gold) => {
                player.doSpawnEntity(gold);
            }, this.player, gold);
        }
        if(inputs.includes("make_invincible")) {
            this.scheduleActionTask(undefined, 0, (player) => {
                player.doMakeInvincible(10);
            }, this.player);
        }

        // Move Position (only one will be executed)
        // Change player direction if needed, or take a step if we are already facing that way.
        if(inputs.includes("move_up")) {
            if(this.player.direction === "up" && this.player.isNextStepAllowed("up")) {
                this.scheduleMoveTask(new MoveAnimation(this.player, this.player.moveTime), this.player.moveTime, (player) => {
                    player.doMoveStep();
                }, this.player);
            }
            else {
                this.scheduleDirectionTask(undefined, 0, (player) => {
                    player.doChangeDirection("up");
                }, this.player);
            }
        }
        else if(inputs.includes("move_down")) {
            if(this.player.direction === "down" && this.player.isNextStepAllowed("down")) {
                this.scheduleMoveTask(new MoveAnimation(this.player, this.player.moveTime), this.player.moveTime, (player) => {
                    player.doMoveStep();
                }, this.player);
            }
            else {
                this.scheduleDirectionTask(undefined, 0, (player) => {
                    player.doChangeDirection("down");
                }, this.player);
            }
        }
        else if(inputs.includes("move_left")) {
            if(this.player.direction === "left" && this.player.isNextStepAllowed("left")) {
                this.scheduleMoveTask(new MoveAnimation(this.player, this.player.moveTime), this.player.moveTime, (player) => {
                    player.doMoveStep();
                }, this.player);
            }
            else {
                this.scheduleDirectionTask(undefined, 0, (player) => {
                    player.doChangeDirection("left");
                }, this.player);
            }
        }
        else if(inputs.includes("move_right")) {
            if(this.player.direction === "right" && this.player.isNextStepAllowed("right")) {
                this.scheduleMoveTask(new MoveAnimation(this.player, this.player.moveTime), this.player.moveTime, (player) => {
                    player.doMoveStep();
                }, this.player);
            }
            else {
                this.scheduleDirectionTask(undefined, 0, (player) => {
                    player.doChangeDirection("right");
                }, this.player);
            }
        }

        // **** Move Screens (only one will be executed)
        if(inputs.includes("screen_up")) {
            this.scheduleMoveTask(undefined, 0, (player) => {
                player.doMoveScreen("up");
            }, this.player);
        }
        else if(inputs.includes("screen_down")) {
            this.scheduleMoveTask(undefined, 0, (player) => {
                player.doMoveScreen("down");
            }, this.player);
        }
        else if(inputs.includes("screen_left")) {
            this.scheduleMoveTask(undefined, 0, (player) => {
                player.doMoveScreen("left");
            }, this.player);
        }
        else if(inputs.includes("screen_right")) {
            this.scheduleMoveTask(undefined, 0, (player) => {
                player.doMoveScreen("right");
            }, this.player);
        }

        // **** Move Maps (only one will be executed)
        if(inputs.includes("map_up")) {
            this.scheduleMoveTask(undefined, 0, (player) => {
                player.doMoveMap("up");
            }, this.player);
        }
        else if(inputs.includes("map_down")) {
            this.scheduleMoveTask(undefined, 0, (player) => {
                player.doMoveMap("down");
            }, this.player);
        }

        // **** Move Worlds (only one will be executed)
        if(inputs.includes("world_up")) {
            this.scheduleMoveTask(undefined, 0, (player) => {
                player.doMoveWorld("up");
            }, this.player);
        }
        else if(inputs.includes("world_down")) {
            this.scheduleMoveTask(undefined, 0, (player) => {
                player.doMoveWorld("down");
            }, this.player);
        }

        // **** Save/load state (only one will be executed)
        if(inputs.includes("save_state")) {
            this.scheduleRealtimeTask(() => {
                this.appState.save();
            });
        }
        else if(inputs.includes("load_state")) {
            this.scheduleRealtimeTask(() => {
                this.appState.load();
            });
        }
    }

    onControllerPress(buttons) {
        let inputs = this.controller.processButtonPress(buttons);

        // Inventory (only one will be executed)
        if(inputs.includes("inventory_previous")) {
            this.scheduleInventoryTask(undefined, 0, (player) => {
                player.selectedSlot = player.selectedSlot === 0 ? player.inventory.maxSlots - 1 : player.selectedSlot - 1;
                player.selectedEntity = player.inventory.itemMap.get(player.selectedSlot);
            }, this.player);
        }
        else if(inputs.includes("inventory_next")) {
            this.scheduleInventoryTask(undefined, 0, (player) => {
                player.selectedSlot = player.selectedSlot === player.inventory.maxSlots - 1 ? 0 : player.selectedSlot + 1;
                player.selectedEntity = player.inventory.itemMap.get(player.selectedSlot);
            }, this.player);
        }
        else if(inputs.includes("inventory_use")) {
            if(!this.player.screen.isDynamic) {
                this.scheduleInventoryTask(undefined, 0, (player) => {
                    player.doConsumeFromInventory(player.selectedSlot);
                }, this.player);
            }
        }

        // Player Action
        if(inputs.includes("action")) {
            this.scheduleActionTask(undefined, 0, (player) => {
                player.doAction();
            }, this.player);
        }

        // Move Position (only one will be executed)
        if(inputs.includes("move_up")) {
            if(this.player.direction === "up" && this.player.isNextStepAllowed("up")) {
                this.scheduleMoveTask(new MoveAnimation(this.player, this.player.moveTime), this.player.moveTime, (player) => {
                    player.doMoveStep();
                }, this.player);
            }
            else {
                this.scheduleDirectionTask(undefined, 0, (player) => {
                    player.doChangeDirection("up");
                }, this.player);
            }
        }
        else if(inputs.includes("move_down")) {
            if(this.player.direction === "down" && this.player.isNextStepAllowed("down")) {
                this.scheduleMoveTask(new MoveAnimation(this.player, this.player.moveTime), this.player.moveTime, (player) => {
                    player.doMoveStep();
                }, this.player);
            }
            else {
                this.scheduleDirectionTask(undefined, 0, (player) => {
                    player.doChangeDirection("down");
                }, this.player);
            }
        }
        else if(inputs.includes("move_left")) {
            if(this.player.direction === "left" && this.player.isNextStepAllowed("left")) {
                this.scheduleMoveTask(new MoveAnimation(this.player, this.player.moveTime), this.player.moveTime, (player) => {
                    player.doMoveStep();
                }, this.player);
            }
            else {
                this.scheduleDirectionTask(undefined, 0, (player) => {
                    player.doChangeDirection("left");
                }, this.player);
            }
        }
        else if(inputs.includes("move_right")) {
            if(this.player.direction === "right" && this.player.isNextStepAllowed("right")) {
                this.scheduleMoveTask(new MoveAnimation(this.player, this.player.moveTime), this.player.moveTime, (player) => {
                    player.doMoveStep();
                }, this.player);
            }
            else {
                this.scheduleDirectionTask(undefined, 0, (player) => {
                    player.doChangeDirection("right");
                }, this.player);
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

    scheduleRealtimeTask(task, ...args) {
        // Don't schedule these on the server.
        if(this.realtimeDelay === true || this.realtimeDelay === undefined) {
            this.realtimeDelay = false;

            task(...args);

            setTimeout(() => {
                this.realtimeDelay = true;
            }, REALTIME_INPUT_TIME * 1000)
        }
    }

    scheduleCreateTask(animation, time, task, ...args) {
        this.scheduleTask("create", this.player.createTime, animation, time, task, ...args);
    }

    scheduleMoveTask(animation, time, task, ...args) {
        this.scheduleTask("move", this.player.moveTime, animation, time, task, ...args);
    }

    scheduleDirectionTask(animation, time, task, ...args) {
        // Use the move delay type with the direction time.
        this.scheduleTask("move", this.player.directionTime, animation, time, task, ...args);
    }

    scheduleActionTask(animation, time, task, ...args) {
        this.scheduleTask("action", this.player.actionTime, animation, time, task, ...args);
    }

    scheduleInventoryTask(animation, time, task, ...args) {
        this.scheduleTask("inventory", this.player.inventoryTime, animation, time, task, ...args);
    }

    schedulePurseTask(animation, time, task, ...args) {
        this.scheduleTask("purse", this.player.purseTime, animation, time, task, ...args);
    }

    scheduleTask(delayType, delayTime, animation, time, task, ...args) {
        if(!this.player.delayMap.get(delayType)) {
            this.player.delayMap.set(delayType, true);

            let serverTask = new ServerTask(task, ...args);

            this.player.getServer().scheduleTask(animation, time, 1, serverTask);

            let serverTask2 = new ServerTask((player, delayType) => {
                player.delayMap.set(delayType, false);
            }, this.player, delayType);

            this.player.getServer().scheduleTask(undefined, delayTime, 1, serverTask2);
        }
    }

    getClientData() {
        // Tiles
        let tiles = [];
        for(let tile of this.player.screen.tiles) {
            tiles.push({
                x: tile.x,
                y: tile.y,
                names: tile.names
            });
        }

        // Add in home tile.
        if(this.player.screen.name === this.player.homeScreenName) {
            tiles.push({
                x: this.player.homeX,
                y: this.player.homeY,
                names: ["marker_home"]
            });
        }

        // Entities
        let entities = [];
        for(let entity of this.player.screen.entities) {
            let statuses = [];
            if(entity.isDead) {
                statuses.push("dead");
            }
            if(entity.isInvincible) {
                statuses.push("invincible");
            }

            entities.push({
                className: Util.getClassName(entity),
                stackSize: entity.stackSize,
                x: entity.x,
                y: entity.y,
                animationShiftX: entity.animationShiftX,
                animationShiftY: entity.animationShiftY,
                healthFraction: entity.health / entity.maxHealth,
                manaFraction: entity.mana / entity.maxMana,
                experienceFraction: entity.progress?.experience / 100,
                level: entity.progress?.level,
                statuses: statuses
            });
        }

        // Inventory
        let inventory = {};
        inventory.currentSlot = this.player.selectedSlot;
        inventory.items = [];
        for(let index = 0; index < this.player.inventory.maxSlots; index++) {
            let item = this.player.inventory.itemMap.get(index);
            if(item) {
                inventory.items.push({
                    className: Util.getClassName(item),
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
        info.className = Util.getClassName(this.player.selectedEntity);
        info.name = this.player.selectedEntity?.getName();
        info.text = this.player.selectedEntity?.getInfo();

        return {
            tiles: tiles,
            entities: entities,
            inventory: inventory,
            purse: purse,
            info: info
        };
    }

    getDevData() {
        // Info
        let info = {};

        info.currentTick = this.player.getServer().serverScheduler.currentTick;

        info.server = {};
        info.server.id = this.player.screen.map.world.universe.server.id;
        info.server.name = this.player.screen.map.world.universe.server.name;

        info.world = {};
        info.world.id = this.player.screen.map.world.id;
        info.world.name = this.player.screen.map.world.name;

        info.map = {};
        info.map.id = this.player.screen.map.id;
        info.map.name = this.player.screen.map.name;

        info.screen = {};
        info.screen.x = this.player.screen.x;
        info.screen.y = this.player.screen.y;
        info.screen.name = this.player.screen.name;

        info.player = {};
        info.player.x = this.player.x;
        info.player.y = this.player.y;
        
        return {
            info: info
        }
    }
}

module.exports = Client;