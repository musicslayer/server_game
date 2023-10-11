const Keyboard = require("../input/Keyboard.js");
const Mouse = require("../input/Mouse.js");
const Gamepad = require("../input/Gamepad.js");
const Entity = require("../entity/Entity.js");
const MoveAnimation = require("../animation/MoveAnimation.js");
const ServerTask = require("../server/ServerTask.js");
const Util = require("../util/Util.js");

class Client {
    socket;

    mouse;
    keyboard;
    gamepad;
    
    username;
    characterName;
    player;

    constructor(isDevMode, username, characterName, player) {
        this.mouse = new Mouse(isDevMode);
        this.keyboard = new Keyboard(isDevMode);
        this.gamepad = new Gamepad(isDevMode);

        this.username = username;
        this.characterName = characterName;
        this.player = player;
    }

    // location vs. info:
    // "screen" => [x, y]
    // "inventory" => [slot]
    // "purse" => [number] (unused)

    onMouseClick(button, location, info) {
        // Left clicking on the screen or inventory selects an entity.
        // [DEV] Middle clicking on the screen is a teleport.
        // Right clicking on an inventory slot uses an item.
        // Right clicking on the purse drops up to 100 gold.
        let inputs = this.mouse.processButton(button);
        
        if(inputs.includes("left")) {
            if(location === "screen") {
                this.scheduleInventoryTask(undefined, 0, "select_entity_screen", this.player, info[0], info[1]);
            }
            else if(location === "inventory") {
                this.scheduleInventoryTask(undefined, 0, "select_entity_inventory", this.player, info[0]);
            }
        }
        else if(inputs.includes("middle")) {
            if(location === "screen") {
                this.scheduleMoveTask(undefined, 0, "teleport", this.player, info[0], info[1]);
            }
        }
        else if(inputs.includes("right")) {
            if(location === "inventory") {
                if(this.player.screen.allowsItemUse()) {
                    this.scheduleInventoryTask(undefined, 0, "consume_from_inventory", this.player, info[0]);
                }
            }
            else if(location === "purse") {
                if(this.player.screen.allowsItemUse()) {
                    this.schedulePurseTask(undefined, 0, "drop_from_purse", this.player, 100);
                }
            }
        }
    }

    onMouseDrag(button, location1, info1, location2, info2) {
        // A left click drag can switch inventory slots or drop an entire slot, depending on where the drag motion ends.
        let inputs = this.mouse.processButton(button);

        if(inputs.includes("left")) {
            if(location1 === "inventory" && location2 === "inventory" && info1[0] !== info2[0]) {
                // Swap two inventory slots (even if one or both of them are empty)
                this.scheduleInventoryTask(undefined, 0, "inventory_swap", this.player, info1[0], info2[0]);
            }
            else if(location1 === "inventory" && location2 === "screen") {
                // Drop entire stack on the player's current location.
                if(this.player.screen.allowsItemUse()) {
                    this.scheduleInventoryTask(undefined, 0, "drop_from_inventory", this.player, info1[0], -1);
                }
            }
        }
    }

    onKeys(keys) {
        let inputs = this.keyboard.processKeys(keys);

        // Inventory (only one will be executed)
        if(inputs.includes("inventory_previous")) {
            this.scheduleInventoryTask(undefined, 0, "inventory_previous", this.player);
        }
        else if(inputs.includes("inventory_next")) {
            this.scheduleInventoryTask(undefined, 0, "inventory_next", this.player);
        }
        else if(inputs.includes("inventory_use")) {
            if(this.player.screen.allowsItemUse()) {
                this.scheduleInventoryTask(undefined, 0, "consume_from_inventory", this.player, this.player.selectedSlot);
            }
        }

        // Player Action
        if(inputs.includes("action")) {
            this.scheduleActionTask(undefined, 0, "action", this.player);
        }

        // Player Teleport Home
        if(inputs.includes("teleport_home")) {
            this.scheduleMoveTask(undefined, 0, "teleport_home", this.player);
        }

        // [DEV] Player Boosts
        if(inputs.includes("boost_experience")) {
            this.scheduleActionTask(undefined, 0, "add_experience", this.player, 10);
        }
        if(inputs.includes("boost_health")) {
            this.scheduleActionTask(undefined, 0, "add_health", this.player, 10);
        }
        if(inputs.includes("boost_mana")) {
            this.scheduleActionTask(undefined, 0, "add_mana", this.player, 10);
        }
        if(inputs.includes("add_gold")) {
            let gold = Entity.createInstance("Gold", 1000);
            gold.setScreen(this.player.screen);
            gold.x = this.player.getMovementX();
            gold.y = this.player.getMovementY();

            this.scheduleCreateTask(undefined, 0, "spawn_entity", this.player, gold);
        }
        if(inputs.includes("invincible_on")) {
            this.scheduleActionTask(undefined, 0, "status_on", this.player, "invincible", 10);
        }
        if(inputs.includes("invisible_on")) {
            this.scheduleActionTask(undefined, 0, "status_on", this.player, "invisible", 10);
        }

        // Move Position (only one will be executed)
        // Change player direction if needed, or take a step if we are already facing that way.
        if(inputs.includes("move_up")) {
            if(this.player.direction === "up" && this.player.isNextStepAllowed("up")) {
                this.scheduleMoveTask(new MoveAnimation(this.player, this.player.moveTime), this.player.moveTime, "move_step", this.player, "up");
            }
            else {
                this.scheduleDirectionTask(undefined, 0, "change_direction", this.player, "up");
            }
        }
        else if(inputs.includes("move_down")) {
            if(this.player.direction === "down" && this.player.isNextStepAllowed("down")) {
                this.scheduleMoveTask(new MoveAnimation(this.player, this.player.moveTime), this.player.moveTime, "move_step", this.player, "down");
            }
            else {
                this.scheduleDirectionTask(undefined, 0, "change_direction", this.player, "down");
            }
        }
        else if(inputs.includes("move_left")) {
            if(this.player.direction === "left" && this.player.isNextStepAllowed("left")) {
                this.scheduleMoveTask(new MoveAnimation(this.player, this.player.moveTime), this.player.moveTime, "move_step", this.player, "left");
            }
            else {
                this.scheduleDirectionTask(undefined, 0, "change_direction", this.player, "left");
            }
        }
        else if(inputs.includes("move_right")) {
            if(this.player.direction === "right" && this.player.isNextStepAllowed("right")) {
                this.scheduleMoveTask(new MoveAnimation(this.player, this.player.moveTime), this.player.moveTime, "move_step", this.player, "right");
            }
            else {
                this.scheduleDirectionTask(undefined, 0, "change_direction", this.player, "right");
            }
        }

        // [DEV] Move Screens (only one will be executed)
        if(inputs.includes("screen_up")) {
            this.scheduleMoveTask(undefined, 0, "move_screen", this.player, "up");
        }
        else if(inputs.includes("screen_down")) {
            this.scheduleMoveTask(undefined, 0, "move_screen", this.player, "down");
        }
        else if(inputs.includes("screen_left")) {
            this.scheduleMoveTask(undefined, 0, "move_screen", this.player, "left");
        }
        else if(inputs.includes("screen_right")) {
            this.scheduleMoveTask(undefined, 0, "move_screen", this.player, "right");
        }

        // [DEV] Move Maps (only one will be executed)
        if(inputs.includes("map_up")) {
            this.scheduleMoveTask(undefined, 0, "move_map", this.player, "up");
        }
        else if(inputs.includes("map_down")) {
            this.scheduleMoveTask(undefined, 0, "move_map", this.player, "down");
        }
    }

    onGamepadButtons(buttons) {
        let inputs = this.gamepad.processButtons(buttons);

        // Inventory (only one will be executed)
        if(inputs.includes("inventory_previous")) {
            this.scheduleInventoryTask(undefined, 0, "inventory_previous", this.player);
        }
        else if(inputs.includes("inventory_next")) {
            this.scheduleInventoryTask(undefined, 0, "inventory_next", this.player);
        }
        else if(inputs.includes("inventory_use")) {
            if(this.player.screen.allowsItemUse()) {
                this.scheduleInventoryTask(undefined, 0, "consume_from_inventory", this.player, this.player.selectedSlot);
            }
        }

        // Player Action
        if(inputs.includes("action")) {
            this.scheduleActionTask(undefined, 0, "action", this.player);
        }

        // Player Teleport Home
        if(inputs.includes("teleport_home")) {
            this.scheduleMoveTask(undefined, 0, "teleport_home", this.player);
        }

        // Move Position (only one will be executed)
        if(inputs.includes("move_up")) {
            if(this.player.direction === "up" && this.player.isNextStepAllowed("up")) {
                this.scheduleMoveTask(new MoveAnimation(this.player, this.player.moveTime), this.player.moveTime, "move_step", this.player, "up");
            }
            else {
                this.scheduleDirectionTask(undefined, 0, "change_direction", this.player, "up");
            }
        }
        else if(inputs.includes("move_down")) {
            if(this.player.direction === "down" && this.player.isNextStepAllowed("down")) {
                this.scheduleMoveTask(new MoveAnimation(this.player, this.player.moveTime), this.player.moveTime, "move_step", this.player, "down");
            }
            else {
                this.scheduleDirectionTask(undefined, 0, "change_direction", this.player, "down");
            }
        }
        else if(inputs.includes("move_left")) {
            if(this.player.direction === "left" && this.player.isNextStepAllowed("left")) {
                this.scheduleMoveTask(new MoveAnimation(this.player, this.player.moveTime), this.player.moveTime, "move_step", this.player, "left");
            }
            else {
                this.scheduleDirectionTask(undefined, 0, "change_direction", this.player, "left");
            }
        }
        else if(inputs.includes("move_right")) {
            if(this.player.direction === "right" && this.player.isNextStepAllowed("right")) {
                this.scheduleMoveTask(new MoveAnimation(this.player, this.player.moveTime), this.player.moveTime, "move_step", this.player, "right");
            }
            else {
                this.scheduleDirectionTask(undefined, 0, "change_direction", this.player, "right");
            }
        }
    }

    // This method is for demonstration purposes only and breaks the game logic.
    onGamepadAxes(axes) {
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

    scheduleCreateTask(animation, time, fcnName, ...args) {
        this.scheduleTask("create", this.player.createTime, animation, time, fcnName, ...args);
    }

    scheduleMoveTask(animation, time, fcnName, ...args) {
        this.scheduleTask("move", this.player.moveTime, animation, time, fcnName, ...args);
    }

    scheduleDirectionTask(animation, time, fcnName, ...args) {
        // Use the move delay type with the direction time.
        this.scheduleTask("move", this.player.directionTime, animation, time, fcnName, ...args);
    }

    scheduleActionTask(animation, time, fcnName, ...args) {
        this.scheduleTask("action", this.player.actionTime, animation, time, fcnName, ...args);
    }

    scheduleInventoryTask(animation, time, fcnName, ...args) {
        this.scheduleTask("inventory", this.player.inventoryTime, animation, time, fcnName, ...args);
    }

    schedulePurseTask(animation, time, fcnName, ...args) {
        this.scheduleTask("purse", this.player.purseTime, animation, time, fcnName, ...args);
    }

    scheduleTask(delayType, delayTime, animation, time, fcnName, ...args) {
        if(!this.player.delayMap.get(delayType)) {
            this.player.delayMap.set(delayType, true);

            let serverTask = new ServerTask(animation, time, 1, fcnName, ...args);
            this.player.getServer().scheduleTask(serverTask);

            let serverTask2 = new ServerTask(undefined, delayTime, 1, "set_delay_off", this.player, delayType);
            this.player.getServer().scheduleTask(serverTask2);
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
        let screenEntities = this.player.screen.entities;

        // Make sure the player is last in the array.
        let index = screenEntities.indexOf(this.player);
        screenEntities.splice(index, 1);
        screenEntities.push(this.player);

        for(let entity of screenEntities) {
            // Do not include invisible entities except for the player.
            if(!entity.isVisible() && entity !== this.player) {
                continue;
            }

            entities.push({
                entityName: entity.getEntityName(),
                stackSize: entity.stackSize,
                x: entity.x,
                y: entity.y,
                animationShiftX: entity.animationShiftX,
                animationShiftY: entity.animationShiftY,
                healthFraction: entity.getHealthFraction(),
                manaFraction: entity.getManaFraction(),
                experienceFraction: entity.getExperienceFraction(),
                level: entity.getLevel(),
                statuses: entity.statuses,
                isVisible: entity.isVisible()
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
                    entityName: item.getEntityName(),
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
        info.entityName = this.player.getSelectedEntity()?.getEntityName();
        info.name = this.player.getSelectedEntity()?.getName();
        info.text = this.player.getSelectedEntity()?.getInfo();

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