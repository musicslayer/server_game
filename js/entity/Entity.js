const EntityCloner = require("./EntityCloner.js");
const ImageCatalog = require("../image/ImageCatalog.js");
const Server = require("../server/Server.js");

class Entity {
    // e.g. The entity that spawned a projectile is the owner.
    owner;

    // Each subclass should have a unique ID.
    id;

    world;
    map;
    screen;

    x;
    y;

    inventory;

    animationShiftX = 0;
    animationShiftY = 0;

    isMoving = false;

    isTangible = false;
    blocksMovement = false;
    blocksAction = false;

    canMove = true;
    canAction = true;
    canInventory = true;
    canExperienceBoost = true;
    canHealthBoost = true;
    canManaBoost = true;
    canMakeInvincible = true;

    canOtherAction = true; // Used for "dev" actions like teleporting.

    // By default, entities can move and take actions in a single server tick.
    actionTime = 0; // Seconds to perform 1 action.
    movementTime = 0; // Seconds to move 1 tile.

    // This is chosen to make inventory management smooth.
    inventoryTime = 0.1;

    experienceBoostTime = 0.1;
    healthBoostTime = 0.1;
    manaBoostTime = 0.1;
    invincibleTime = 0.1;

    otherTime = 0.1;

    // To avoid awkward edge cases, just make every entity start facing to the right.
    direction = "right";

    // All of the main actions an entity can take are added onto the server queue.
    addExperience(experience) {
        if(this.canExperienceBoost) {
            this.canExperienceBoost = false;

            Server.scheduleTaskForSeconds(this.experienceBoostTime, () => {
                this.canExperienceBoost = true;
            });

            Server.addTask(() => {
                this.doAddExperience(experience);
            });
        }
    }

    addHealth(health) {
        if(this.canHealthBoost) {
            this.canHealthBoost = false;

            Server.scheduleTaskForSeconds(this.healthBoostTime, () => {
                this.canHealthBoost = true;
            });

            Server.addTask(() => {
                this.doAddHealth(health);
            });
        }
    }

    addMana(mana) {
        if(this.canManaBoost) {
            this.canManaBoost = false;

            Server.scheduleTaskForSeconds(this.manaBoostTime, () => {
                this.canManaBoost = true;
            });

            Server.addTask(() => {
                this.doAddMana(mana);
            });
        }
    }

    makeInvincible(invincibleSeconds) {
        if(this.canMakeInvincible) {
            this.canMakeInvincible = false;

            Server.scheduleTaskForSeconds(this.invincibleTime, () => {
                this.canMakeInvincible = true;
            });

            Server.addTask(() => {
                this.doMakeInvincible(invincibleSeconds);
            });
        }
    }

    consume(entity) {
        Server.addTask(() => {
            this.doConsume(entity);
        });
    }

    despawn() {
        Server.addTask(() => {
            this.doDespawn();
        });
    }

    interact() {
        Server.addTask(() => {
            this.doInteract();
        });
    }

    spawn(world, map, screen, x, y) {
        Server.addTask(() => {
            this.doSpawn(world, map, screen, x, y);
        });
    }

    takeDamage(entity, damage) {
        Server.addTask(() => {
            this.doTakeDamage(entity, damage);
        });
    }

    

    




    

    action() {
        if(this.canAction) {
            this.canAction = false;

            Server.scheduleTaskForSeconds(this.actionTime, () => {
                this.canAction = true;
            });

            Server.addTask(() => {
                this.doAction();
            });
        }
    }

    teleport(world, map, screen, x, y) {
        if(this.canOtherAction) {
            this.canOtherAction = false;

            Server.scheduleTaskForSeconds(this.otherTime, () => {
                this.canOtherAction = true;
            });

            Server.addTask(() => {
                this.doTeleport(world, map, screen, x, y);
            });
        }
    }

    moveLeft() {
        if(!this.isMoving) {
            this.direction = "left";
        }

        if(this.canMove && this.isNextStepAllowed()) {
            this.isMoving = true;
            this.canMove = false;
            
            for(let a = 0; a < Server.ANIMATION_FRAMES; a++) {
                let fraction = a / Server.ANIMATION_FRAMES;
                Server.scheduleTaskForSeconds(this.movementTime * fraction, () => {
                    this.animationShiftX = -fraction;
                });
            }
            Server.scheduleTaskForSeconds(this.movementTime, () => {
                this.animationShiftX = 0;
                this.isMoving = false;
                this.canMove = true;
                this.doMoveLeft();
            });
        }
    }

    moveUp() {
        if(!this.isMoving) {
            this.direction = "up";
        }

        if(this.canMove && this.isNextStepAllowed()) {
            this.isMoving = true;
            this.canMove = false;

            for(let a = 0; a < Server.ANIMATION_FRAMES; a++) {
                let fraction = a / Server.ANIMATION_FRAMES;
                Server.scheduleTaskForSeconds(this.movementTime * fraction, () => {
                    this.animationShiftY = -fraction;
                });
            }
            Server.scheduleTaskForSeconds(this.movementTime, () => {
                this.animationShiftY = 0;
                this.isMoving = false;
                this.canMove = true;
                this.doMoveUp();
            });
        }
    }

    moveRight() {
        if(!this.isMoving) {
            this.direction = "right";
        }

        if(this.canMove && this.isNextStepAllowed()) {
            this.isMoving = true;
            this.canMove = false;

            for(let a = 0; a < Server.ANIMATION_FRAMES; a++) {
                let fraction = a / Server.ANIMATION_FRAMES;
                Server.scheduleTaskForSeconds(this.movementTime * fraction, () => {
                    this.animationShiftX = fraction;
                });
            }
            Server.scheduleTaskForSeconds(this.movementTime, () => {
                this.animationShiftX = 0;
                this.isMoving = false;
                this.canMove = true;
                this.doMoveRight();
            });
        }
    }

    moveDown() {
        if(!this.isMoving) {
            this.direction = "down";
        }

        if(this.canMove && this.isNextStepAllowed()) {
            this.isMoving = true;
            this.canMove = false;

            for(let a = 0; a < Server.ANIMATION_FRAMES; a++) {
                let fraction = a / Server.ANIMATION_FRAMES;
                Server.scheduleTaskForSeconds(this.movementTime * fraction, () => {
                    this.animationShiftY = fraction;
                });
            }
            Server.scheduleTaskForSeconds(this.movementTime, () => {
                this.animationShiftY = 0;
                this.isMoving = false;
                this.canMove = true;
                this.doMoveDown();
            });
        }
    }



    screenLeft() {
        if(this.canOtherAction) {
            this.canOtherAction = false;

            Server.scheduleTaskForSeconds(this.otherTime, () => {
                this.canOtherAction = true;
            });

            Server.addTask(() => {
                this.doScreenLeft();
            });
        }
    }

    screenUp() {
        if(this.canOtherAction) {
            this.canOtherAction = false;

            Server.scheduleTaskForSeconds(this.otherTime, () => {
                this.canOtherAction = true;
            });

            Server.addTask(() => {
                this.doScreenUp();
            });
        }
    }

    screenRight() {
        if(this.canOtherAction) {
            this.canOtherAction = false;

            Server.scheduleTaskForSeconds(this.otherTime, () => {
                this.canOtherAction = true;
            });

            Server.addTask(() => {
                this.doScreenRight();
            });
        }
    }

    screenDown() {
        if(this.canOtherAction) {
            this.canOtherAction = false;

            Server.scheduleTaskForSeconds(this.otherTime, () => {
                this.canOtherAction = true;
            });

            Server.addTask(() => {
                this.doScreenDown();
            });
        }
    }


    mapUp() {
        if(this.canOtherAction) {
            this.canOtherAction = false;

            Server.scheduleTaskForSeconds(this.otherTime, () => {
                this.canOtherAction = true;
            });

            Server.addTask(() => {
                this.doMapUp();
            });
        }
    }

    mapDown() {
        if(this.canOtherAction) {
            this.canOtherAction = false;

            Server.scheduleTaskForSeconds(this.otherTime, () => {
                this.canOtherAction = true;
            });

            Server.addTask(() => {
                this.doMapDown();
            });
        }
    }




    doAddExperience(experience) {
        // By default, do nothing.
    }

    doAddHealth(health) {
        // By default, do nothing.
    }

    doAddMana(mana) {
        // By default, do nothing.
    }

    doMakeInvincible(invincibleSeconds) {
        // By default, do nothing.
    }

    doCheckCollision() {
        // Call this after any movement to see if this entity is overlapping another on the same screen.
        let entities = this.screen.entities.slice();
        for(let entity of entities) {
            if(this !== entity && this.x === entity.x && this.y === entity.y) {
                this.doInteract(entity);
                entity.doInteract(this);
            }
        }
    }

    isNextStepAllowed() {
        // By default, check screen edges and if any entities in the direction block movement.
        let x = this.x;
        let y = this.y;
        let isScreen;
        let isEdge;

        if(this.direction === "up") {
            isEdge = y == 0;
            isScreen = this.map.isScreenUp(this.screen);
            y--;
        }
        else if(this.direction === "down") {
            isEdge = y == 11;
            isScreen = this.map.isScreenDown(this.screen);
            y++;
        }
        else if(this.direction === "left") {
            isEdge = x == 0;
            isScreen = this.map.isScreenLeft(this.screen);
            x--;
        }
        else if(this.direction === "right") {
            isEdge = x == 15;
            isScreen = this.map.isScreenRight(this.screen);
            x++;
        }

        if(isEdge && !isScreen) {
            return false;
        }

        let entities = this.screen.entities;
        for(let entity of entities) {
            if(this !== entity && x === entity.x && y === entity.y && entity.blocksMovement) {
                return false;
            }
        }

        return true;
    }

    canConsume(entity) {
        // By default, any entity can consume any item.
        return true;
    }

    doConsume(entity) {
        // By default, do nothing.
    }

    doDespawn() {
        this.screen.removeEntity(this);
    }

    doInteract(entity) {
        // By default, do nothing.
    }

    doSpawn(world, map, screen, x, y) {
        this.world = world;
        this.map = map;
        this.screen = screen;
        this.x = x;
        this.y = y;

        screen.addEntity(this);
    }

    doTakeDamage(entity, damage) {
        // By default, do nothing.
    }






    doAction() {
        // By default, do nothing.
    }

    doTeleport(world, map, screen, x, y) {
        // Move to an arbitrary point in the world. Do not check collision.
        // This does not have to be called if the entity stays on the same screen (i.e. only x and y change).
        this.doDespawn();
        this.doSpawn(world, map, screen, x, y);
    }


    // By default, movement happens one tile at a time, and if the edge is crossed then the entity moves to the next screen.
    // Also, if you move onto another entity, the two entities interact with each other.
    doMoveLeft() {
        this.x--;
        if(this.x < 0) {
            if(this.isScreenLeft()) {
                this.x = this.screen.numTilesX - 1;
                this.doScreenLeft();
            }
            else {
                this.x++;
            }
        }

        this.doCheckCollision();
    }

    doMoveUp() {
        this.y--;
        if(this.y < 0) {
            if(this.isScreenUp()) {
                this.y = this.screen.numTilesY - 1;
                this.doScreenUp();
            }
            else {
                this.y++;
            }
        }

        this.doCheckCollision();
    }

    doMoveRight() {
        this.x++;
        if(this.x > this.screen.numTilesX - 1) {
            if(this.isScreenRight()) {
                this.x = 0;
                this.doScreenRight();
            }
            else {
                this.x--;
            }
        }

        this.doCheckCollision();
    }

    doMoveDown() {
        this.y++;
        if(this.y > this.screen.numTilesY - 1) {
            if(this.isScreenDown()) {
                this.y = 0;
                this.doScreenDown();
            }
            else {
                this.y--;
            }
        }

        this.doCheckCollision();
    }



    isScreenLeft() {
        return this.map.isScreenLeft(this.screen);
    }

    isScreenUp() {
        return this.map.isScreenUp(this.screen);
    }

    isScreenRight() {
        return this.map.isScreenRight(this.screen);
    }

    isScreenDown() {
        return this.map.isScreenDown(this.screen);
    }

    doScreenLeft() {
        let newScreen = this.map.getScreenLeft(this.screen);
        this.doTeleport(this.world, this.map, newScreen, this.x, this.y);
    }

    doScreenUp() {
        let newScreen = this.map.getScreenUp(this.screen);
        this.doTeleport(this.world, this.map, newScreen, this.x, this.y);
    }

    doScreenRight() {
        let newScreen = this.map.getScreenRight(this.screen);
        this.doTeleport(this.world, this.map, newScreen, this.x, this.y);
    }

    doScreenDown() {
        let newScreen = this.map.getScreenDown(this.screen);
        this.doTeleport(this.world, this.map, newScreen, this.x, this.y);
    }




    doMapUp() {
        let newMap = this.world.getMapUp(this.map);
        if(newMap) {
            let newScreen = newMap.getScreenByPosition(this.screen.x, this.screen.y);
            this.doTeleport(this.world, newMap, newScreen, this.x, this.y);
        }
    }

    doMapDown() {
        let newMap = this.world.getMapDown(this.map);
        if(newMap) {
            let newScreen = newMap.getScreenByPosition(this.screen.x, this.screen.y);
            this.doTeleport(this.world, newMap, newScreen, this.x, this.y);
        }
    }




    shiftInventorySlotBackward() {
        if(this.canInventory) {
            this.canInventory = false;

            Server.scheduleTaskForSeconds(this.inventoryTime, () => {
                this.canInventory = true;
            });

            Server.addTask(() => {
                this.doShiftInventorySlotBackward();
            });
        }
    }

    shiftInventorySlotForward() {
        if(this.canInventory) {
            this.canInventory = false;

            Server.scheduleTaskForSeconds(this.inventoryTime, () => {
                this.canInventory = true;
            });

            Server.addTask(() => {
                this.doShiftInventorySlotForward();
            });
        }
    }

    addToInventory(entity) {
        if(this.canInventory) {
            this.canInventory = false;

            Server.scheduleTaskForSeconds(this.inventoryTime, () => {
                this.canInventory = true;
            });

            Server.addTask(() => {
                this.doAddToInventory(entity);
            });
        }
    }

    consumeFromInventoryCurrentSlot() {
        if(this.canInventory) {
            this.canInventory = false;

            Server.scheduleTaskForSeconds(this.inventoryTime, () => {
                this.canInventory = true;
            });

            Server.addTask(() => {
                this.doConsumeFromInventoryCurrentSlot();
            });
        }
    }

    consumeFromInventory(slot) {
        if(this.canInventory) {
            this.canInventory = false;

            Server.scheduleTaskForSeconds(this.inventoryTime, () => {
                this.canInventory = true;
            });

            Server.addTask(() => {
                this.doConsumeFromInventory(slot);
            });
        }
    }

    dropFromInventoryCurrentSlot(number) {
        if(this.canInventory) {
            this.canInventory = false;

            Server.scheduleTaskForSeconds(this.inventoryTime, () => {
                this.canInventory = true;
            });

            Server.addTask(() => {
                this.doDropFromInventoryCurrentSlot(number);
            });
        }
    }

    dropFromInventory(slot, number) {
        if(this.canInventory) {
            this.canInventory = false;

            Server.scheduleTaskForSeconds(this.inventoryTime, () => {
                this.canInventory = true;
            });

            Server.addTask(() => {
                this.doDropFromInventory(slot, number);
            });
        }
    }



    doShiftInventorySlotBackward() {
        if(this.inventory) {
            this.inventory.shiftInventorySlotBackward();
        }
    }

    doShiftInventorySlotForward() {
        if(this.inventory) {
            this.inventory.shiftInventorySlotForward();
        }
    }

    doAddToInventory(entity) {
        if(this.inventory) {
            return this.inventory.addToInventory(entity);
        }
        return false;
    }

    doConsumeFromInventoryCurrentSlot() {
        if(this.inventory) {
            this.doConsumeFromInventory(this.inventory.currentSlot);
        }
    }

    doConsumeFromInventory(slot) {
        // Consume 1 item in this inventory slot.
        if(this.inventory) {
            let itemData = this.inventory.itemDataArray[slot];
            if(itemData && itemData.item.canConsume(this)) {
                itemData.item.consume(this);
                this.inventory.removeFromInventorySlot(slot, 1);
            }
        }
    }

    doDropFromInventoryCurrentSlot(number) {
        // Drop item without consuming it.
        if(this.inventory) {
            this.inventory.dropFromInventory(slot, number);
        }
    }

    doDropFromInventory(slot, number) {
        // Drop a number of items from a stack without consuming them.
        if(this.inventory) {
            let itemData = this.inventory.itemDataArray[slot];
            if(itemData) {
                let item = EntityCloner.clone(itemData.item.id);
                item.spawn(this.world, this.map, this.screen, this.x, this.y);
                this.inventory.removeFromInventorySlot(slot, number);
            }
        }
    }










    getImages() {
        // By default, use a generic picture.
        let images = [];
        images.push({
            x: this.x + this.animationShiftX,
            y: this.y + this.animationShiftY,
            image: ImageCatalog.IMAGE_CATALOG.getImageTableByName("_base").getImageByName("unknown")
        });
        return images;
    }

    getRootEntity(entity) {
        let rootEntity = entity;

        while(rootEntity.owner) {
            rootEntity = rootEntity.owner;
        }

        return rootEntity;
    }
}

module.exports = Entity;