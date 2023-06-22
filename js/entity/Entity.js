const EntitySpawner = require("./EntitySpawner.js");
const Server = require("../server/Server.js");

class Entity {
    // e.g. The entity that spawned a projectile is the owner.
    owner;

    // Each subclass should have a unique ID.
    id;

    screen;
    x;
    y;

    // Certain entities (i.e. players) can teleport home, so store the desired location here.
    homeWorldName;
    homeMapName;
    homeScreenName;
    homeX = 1;
    homeY = 1;

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

    // By default, entities don't form into stacks of themselves.
    maxStackNumber = 1;
    maxStackSize = 1;
    stackSize = 1;

    getName() {
        return "?";
    }

    getInfo() {
        return "?";
    }

    // All of the main actions an entity can take are added onto the server queue.
    addExperience(experience) {
        if(this.canExperienceBoost) {
            this.canExperienceBoost = false;

            Server.SERVER.scheduleTaskForSeconds(this.experienceBoostTime, () => {
                this.canExperienceBoost = true;
            });

            Server.SERVER.addTask(() => {
                this.doAddExperience(experience);
            });
        }
    }

    addHealth(health) {
        if(this.canHealthBoost) {
            this.canHealthBoost = false;

            Server.SERVER.scheduleTaskForSeconds(this.healthBoostTime, () => {
                this.canHealthBoost = true;
            });

            Server.SERVER.addTask(() => {
                this.doAddHealth(health);
            });
        }
    }

    addMana(mana) {
        if(this.canManaBoost) {
            this.canManaBoost = false;

            Server.SERVER.scheduleTaskForSeconds(this.manaBoostTime, () => {
                this.canManaBoost = true;
            });

            Server.SERVER.addTask(() => {
                this.doAddMana(mana);
            });
        }
    }

    makeInvincible(invincibleSeconds) {
        if(this.canMakeInvincible) {
            this.canMakeInvincible = false;

            Server.SERVER.scheduleTaskForSeconds(this.invincibleTime, () => {
                this.canMakeInvincible = true;
            });

            Server.SERVER.addTask(() => {
                this.doMakeInvincible(invincibleSeconds);
            });
        }
    }

    consume(entity) {
        Server.SERVER.addTask(() => {
            this.doConsume(entity);
        });
    }

    despawn() {
        Server.SERVER.addTask(() => {
            this.doDespawn();
        });
    }

    interact() {
        Server.SERVER.addTask(() => {
            this.doInteract();
        });
    }

    spawn(screen, x, y) {
        Server.SERVER.addTask(() => {
            this.doSpawn(screen, x, y);
        });
    }

    takeDamage(entity, damage) {
        Server.SERVER.addTask(() => {
            this.doTakeDamage(entity, damage);
        });
    }

    

    




    

    action() {
        if(this.canAction) {
            this.canAction = false;

            Server.SERVER.scheduleTaskForSeconds(this.actionTime, () => {
                this.canAction = true;
            });

            Server.SERVER.addTask(() => {
                this.doAction();
            });
        }
    }

    teleport(screen, x, y) {
        if(this.canOtherAction) {
            this.canOtherAction = false;

            Server.SERVER.scheduleTaskForSeconds(this.otherTime, () => {
                this.canOtherAction = true;
            });

            Server.SERVER.addTask(() => {
                this.doTeleport(screen, x, y);
            });
        }
    }

    teleportHome() {
        if(this.canOtherAction) {
            this.canOtherAction = false;

            Server.SERVER.scheduleTaskForSeconds(this.otherTime, () => {
                this.canOtherAction = true;
            });

            Server.SERVER.addTask(() => {
                this.doTeleportHome();
            });
        }
    }

    teleportDeath() {
        if(this.canOtherAction) {
            this.canOtherAction = false;

            Server.SERVER.scheduleTaskForSeconds(this.otherTime, () => {
                this.canOtherAction = true;
            });

            Server.SERVER.addTask(() => {
                this.doTeleportDeath();
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
            
            for(let a = 0; a < Server.SERVER.MOVEMENT_FRAMES; a++) {
                let fraction = a / Server.SERVER.MOVEMENT_FRAMES;
                Server.SERVER.scheduleTaskForSeconds(this.movementTime * fraction, () => {
                    this.animationShiftX = -fraction;
                });
            }
            Server.SERVER.scheduleTaskForSeconds(this.movementTime, () => {
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

            for(let a = 0; a < Server.SERVER.MOVEMENT_FRAMES; a++) {
                let fraction = a / Server.SERVER.MOVEMENT_FRAMES;
                Server.SERVER.scheduleTaskForSeconds(this.movementTime * fraction, () => {
                    this.animationShiftY = -fraction;
                });
            }
            Server.SERVER.scheduleTaskForSeconds(this.movementTime, () => {
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

            for(let a = 0; a < Server.SERVER.MOVEMENT_FRAMES; a++) {
                let fraction = a / Server.SERVER.MOVEMENT_FRAMES;
                Server.SERVER.scheduleTaskForSeconds(this.movementTime * fraction, () => {
                    this.animationShiftX = fraction;
                });
            }
            Server.SERVER.scheduleTaskForSeconds(this.movementTime, () => {
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

            for(let a = 0; a < Server.SERVER.MOVEMENT_FRAMES; a++) {
                let fraction = a / Server.SERVER.MOVEMENT_FRAMES;
                Server.SERVER.scheduleTaskForSeconds(this.movementTime * fraction, () => {
                    this.animationShiftY = fraction;
                });
            }
            Server.SERVER.scheduleTaskForSeconds(this.movementTime, () => {
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

            Server.SERVER.scheduleTaskForSeconds(this.otherTime, () => {
                this.canOtherAction = true;
            });

            Server.SERVER.addTask(() => {
                this.doScreenLeft();
            });
        }
    }

    screenUp() {
        if(this.canOtherAction) {
            this.canOtherAction = false;

            Server.SERVER.scheduleTaskForSeconds(this.otherTime, () => {
                this.canOtherAction = true;
            });

            Server.SERVER.addTask(() => {
                this.doScreenUp();
            });
        }
    }

    screenRight() {
        if(this.canOtherAction) {
            this.canOtherAction = false;

            Server.SERVER.scheduleTaskForSeconds(this.otherTime, () => {
                this.canOtherAction = true;
            });

            Server.SERVER.addTask(() => {
                this.doScreenRight();
            });
        }
    }

    screenDown() {
        if(this.canOtherAction) {
            this.canOtherAction = false;

            Server.SERVER.scheduleTaskForSeconds(this.otherTime, () => {
                this.canOtherAction = true;
            });

            Server.SERVER.addTask(() => {
                this.doScreenDown();
            });
        }
    }


    mapUp() {
        if(this.canOtherAction) {
            this.canOtherAction = false;

            Server.SERVER.scheduleTaskForSeconds(this.otherTime, () => {
                this.canOtherAction = true;
            });

            Server.SERVER.addTask(() => {
                this.doMapUp();
            });
        }
    }

    mapDown() {
        if(this.canOtherAction) {
            this.canOtherAction = false;

            Server.SERVER.scheduleTaskForSeconds(this.otherTime, () => {
                this.canOtherAction = true;
            });

            Server.SERVER.addTask(() => {
                this.doMapDown();
            });
        }
    }



    worldUp() {
        if(this.canOtherAction) {
            this.canOtherAction = false;

            Server.SERVER.scheduleTaskForSeconds(this.otherTime, () => {
                this.canOtherAction = true;
            });

            Server.SERVER.addTask(() => {
                this.doWorldUp();
            });
        }
    }

    worldDown() {
        if(this.canOtherAction) {
            this.canOtherAction = false;

            Server.SERVER.scheduleTaskForSeconds(this.otherTime, () => {
                this.canOtherAction = true;
            });

            Server.SERVER.addTask(() => {
                this.doWorldDown();
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
        let overlappingEntities = this.screen.getOverlappingEntities(this);
        for(let overlappingEntity of overlappingEntities) {
            this.doInteract(overlappingEntity);
            overlappingEntity.doInteract(this);
        }
    }

    isNextStepAllowed() {
        // By default, check screen edges and if any entities in the direction block movement.
        let isFacingEdge = this.screen.isFacingEdge(this, this.direction);
        let isScreen = this.screen.isScreen(this.direction);
        if(isFacingEdge && !isScreen) {
            return false;
        }
        
        let overlappingEntities = this.screen.getOverlappingEntities(this, this.direction);
        for(let overlappingEntity of overlappingEntities) {
            if(overlappingEntity.blocksMovement) {
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

        if(this.inventory) {
            Server.SERVER.deregisterInventoryEntity(this.inventory.itemArray.length);
        }
    }

    doInteract(entity) {
        // By default, do nothing.
    }

    doSpawn(screen, x, y) {
        this.screen = screen;
        this.x = x;
        this.y = y;

        screen.addEntity(this);
    }

    doSpawnLoot(screen, x, y) {
        // By default, do nothing.
        // Typically, loot will be spawned under a dying entity, but this is not strictly required.
        // For example, killing a set of enemies can cause a key to appear in a fixed location.
    }

    doTakeDamage(entity, damage) {
        // By default, do nothing.
    }






    doAction() {
        // By default, do nothing.
    }

    doTeleport(screen, x, y) {
        // Move to an arbitrary point in the world. Do not check collision or call spawn/respawn.
        this.x = x;
        this.y = y;

        if(this.screen !== screen) {
            // Lock/unlock inventory based on if the screen is dynamic.
            // i.e. Don't allow players to drop stuff on dynamic screens since anything left there will be lost forever.
            if(screen.isDynamic) {
                this?.inventory.turnOff();
                this?.purse.turnOff();
            }
            else {
                this?.inventory.turnOn();
                this?.purse.turnOn();
            }

            // If the entity stays on the same screen, this is skipped to avoid triggering "screen.checkDestruction()".
            this.screen.removeEntity(this);
            this.screen = screen;
            screen.addEntity(this);
        }
    }

    doTeleportHome() {
        // By default, do nothing.
    }

    doTeleportDeath() {
        // Teleport the entity to the death plane.
        let deathMap = this.screen.map.world.getMapByPosition("death");
        let deathScreen = deathMap.getScreenByPosition(0, 0);
        this.doTeleport(deathScreen, 7, 11);
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
        return this.screen.isScreenLeft();
    }

    isScreenUp() {
        return this.screen.isScreenUp();
    }

    isScreenRight() {
        return this.screen.isScreenRight();
    }

    isScreenDown() {
        return this.screen.isScreenDown();
    }

    doScreenLeft() {
        let newScreen = this.screen.getScreenLeft();
        this.doTeleport(newScreen, this.x, this.y);
    }

    doScreenUp() {
        let newScreen = this.screen.getScreenUp();
        this.doTeleport(newScreen, this.x, this.y);
    }

    doScreenRight() {
        let newScreen = this.screen.getScreenRight();
        this.doTeleport(newScreen, this.x, this.y);
    }

    doScreenDown() {
        let newScreen = this.screen.getScreenDown();
        this.doTeleport(newScreen, this.x, this.y);
    }




    doMapUp() {
        let newMap = this.screen.getMapUp();
        let newScreen = newMap.getScreenByPosition(this.screen.x, this.screen.y);
        this.doTeleport(newScreen, this.x, this.y);
    }

    doMapDown() {
        let newMap = this.screen.getMapDown();
        let newScreen = newMap.getScreenByPosition(this.screen.x, this.screen.y);
        this.doTeleport(newScreen, this.x, this.y);
    }

    doWorldUp() {
        let newWorld = this.screen.getWorldUp();
        let newMap = newWorld.getMapByPosition(this.screen.map.id);
        let newScreen = newMap.getScreenByPosition(this.screen.x, this.screen.y);
        this.doTeleport(newScreen, this.x, this.y);
    }

    doWorldDown() {
        let newWorld = this.screen.getWorldDown();
        let newMap = newWorld.getMapByPosition(this.screen.map.id);
        let newScreen = newMap.getScreenByPosition(this.screen.x, this.screen.y);
        this.doTeleport(newScreen, this.x, this.y);
    }


    selectInventorySlot(slot) {
        if(this.canInventory) {
            this.canInventory = false;

            Server.SERVER.scheduleTaskForSeconds(this.inventoryTime, () => {
                this.canInventory = true;
            });

            Server.SERVER.addTask(() => {
                this.doSelectInventorySlot(slot);
            });
        }
    }

    shiftInventorySlotBackward() {
        if(this.canInventory) {
            this.canInventory = false;

            Server.SERVER.scheduleTaskForSeconds(this.inventoryTime, () => {
                this.canInventory = true;
            });

            Server.SERVER.addTask(() => {
                this.doShiftInventorySlotBackward();
            });
        }
    }

    shiftInventorySlotForward() {
        if(this.canInventory) {
            this.canInventory = false;

            Server.SERVER.scheduleTaskForSeconds(this.inventoryTime, () => {
                this.canInventory = true;
            });

            Server.SERVER.addTask(() => {
                this.doShiftInventorySlotForward();
            });
        }
    }

    addToPurse(gold) {
        if(this.canPurse) {
            this.canPurse = false;

            Server.SERVER.scheduleTaskForSeconds(this.purseTime, () => {
                this.canPurse = true;
            });

            Server.SERVER.addTask(() => {
                this.doAddToPurse(gold);
            });
        }
    }

    dropFromPurse(gold) {
        if(this.canPurse) {
            this.canPurse = false;

            Server.SERVER.scheduleTaskForSeconds(this.purseTime, () => {
                this.canPurse = true;
            });

            Server.SERVER.addTask(() => {
                this.doDropFromPurse(gold);
            });
        }
    }


    addToInventory(entity) {
        if(this.canInventory) {
            this.canInventory = false;

            Server.SERVER.scheduleTaskForSeconds(this.inventoryTime, () => {
                this.canInventory = true;
            });

            Server.SERVER.addTask(() => {
                this.doAddToInventory(entity);
            });
        }
    }

    consumeFromInventoryCurrentSlot() {
        if(this.canInventory) {
            this.canInventory = false;

            Server.SERVER.scheduleTaskForSeconds(this.inventoryTime, () => {
                this.canInventory = true;
            });

            Server.SERVER.addTask(() => {
                this.doConsumeFromInventoryCurrentSlot();
            });
        }
    }

    consumeFromInventory(slot) {
        if(this.canInventory) {
            this.canInventory = false;

            Server.SERVER.scheduleTaskForSeconds(this.inventoryTime, () => {
                this.canInventory = true;
            });

            Server.SERVER.addTask(() => {
                this.doConsumeFromInventory(slot);
            });
        }
    }

    dropFromInventoryCurrentSlot(number) {
        if(this.canInventory) {
            this.canInventory = false;

            Server.SERVER.scheduleTaskForSeconds(this.inventoryTime, () => {
                this.canInventory = true;
            });

            Server.SERVER.addTask(() => {
                this.doDropFromInventoryCurrentSlot(number);
            });
        }
    }

    dropFromInventory(slot, number) {
        if(this.canInventory) {
            this.canInventory = false;

            Server.SERVER.scheduleTaskForSeconds(this.inventoryTime, () => {
                this.canInventory = true;
            });

            Server.SERVER.addTask(() => {
                this.doDropFromInventory(slot, number);
            });
        }
    }

    swapInventorySlots(slot1, slot2) {
        if(this.canInventory) {
            this.canInventory = false;

            Server.SERVER.scheduleTaskForSeconds(this.inventoryTime, () => {
                this.canInventory = true;
            });

            Server.SERVER.addTask(() => {
                this.doSwapInventorySlots(slot1, slot2);
            });
        }
    }

    doAddToPurse(gold) {
        if(this.purse && this.purse.isActive) {
            this.purse.addToPurse(gold);
            if(gold.stackSize === 0) {
                gold.doDespawn();
            }
        }
    }

    doDropFromPurse(goldAmount) {
        if(this.purse && this.purse.isActive) {
            // A negative value or a value too large means to drop all the gold.
            if(goldAmount < 0 || goldAmount > this.purse.goldTotal) {
                goldAmount = this.purse.goldTotal;
            }

            EntitySpawner.spawnTimed("gold", goldAmount, this.screen, this.x, this.y);
            this.purse.removeFromPurse(goldAmount);
        }
    }

    doSelectInventorySlot(slot) {
        if(this.inventory) {
            this.inventory.selectInventorySlot(slot);
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
        if(this.inventory && this.inventory.isActive) {
            this.inventory.addToInventory(entity);
            if(entity.stackSize === 0) {
                entity.doDespawn();
            }
        }
    }

    doConsumeFromInventoryCurrentSlot() {
        if(this.inventory && this.inventory.isActive) {
            this.doConsumeFromInventory(this.inventory.currentSlot);
        }
    }

    doConsumeFromInventory(slot) {
        // Consume 1 item in this inventory slot.
        if(this.inventory && this.inventory.isActive) {
            let item = this.inventory.itemArray[slot];
            if(item && item.canConsume(this)) {
                item.consume(this);
                this.inventory.removeFromInventorySlot(slot, 1);
            }
        }
    }

    doDropFromInventoryCurrentSlot() {
        // Drop all items in the current slot without consuming them.
        if(this.inventory && this.inventory.isActive) {
            this.doDropFromInventory(this.inventory.currentSlot, -1);
        }
    }

    doDropFromInventory(slot, number) {
        // Drop a number of items from a stack without consuming them, and then select that slot.
        if(this.inventory && this.inventory.isActive) {
            let item = this.inventory.itemArray[slot];
            if(item) {
                // A negative value or a value too large means to drop the entire stack.
                if(number < 0 || number > item.stackSize) {
                    number = item.stackSize;
                }

                EntitySpawner.spawnTimed(item.id, number, this.screen, this.x, this.y);
                this.inventory.removeFromInventorySlot(slot, number);
            }

            this.doSelectInventorySlot(slot);
        }
    }

    doSwapInventorySlots(slot1, slot2) {
        // Switch 2 inventory slots and select the second one.
        if(this.inventory) {
            this.inventory.swapInventorySlots(slot1, slot2);
            this.doSelectInventorySlot(slot2);
        }
    }

    getCurrentlySelectedItem() {
        if(this.inventory) {
            return this.inventory.getCurrentlySelectedItem();
        }
    }

    getItemAtSlot(slot) {
        if(this.inventory) {
            return this.inventory.getItemAtSlot(slot);
        }
    }





    getRootEntity(entity) {
        let rootEntity = entity;

        while(rootEntity.owner) {
            rootEntity = rootEntity.owner;
        }

        return rootEntity;
    }

    clone(number) {
        // By default, just create another instance.
        return EntitySpawner.createInstance(this.id, number);
    }
}

module.exports = Entity;