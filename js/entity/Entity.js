const Util = require("../util/Util.js");

class Entity {
    id; // Each subclass should have a unique ID.
    owner; // e.g. The entity that spawned a projectile is the owner.

    inventory;
    purse;

    screen;
    x;
    y;
    animationShiftX = 0;
    animationShiftY = 0;

    // Certain entities (i.e. players) can teleport home, so store the desired location here.
    homeMapName;
    homeScreenName;
    homeX = 1;
    homeY = 1;
    


    isPlayer = false;
    isTangible = false; // Tangible objects block movement and can interact with projectiles.
    isActionBlocker = false; // Action blockers block projectiles without interacting with them.



    isMoveInProgress = false;

    canMove = true;
    canAction = true;
    canInventory = true;
    canPurse = true;
    canExperienceBoost = true;
    canHealthBoost = true;
    canManaBoost = true;
    canMakeInvincible = true;
    canOtherAction = true; // Used for "dev" actions like teleporting.

    movementTime = 0; // Seconds to move 1 tile.
    actionTime = 0; // Seconds to perform 1 action.
    inventoryTime = 0.1; // This is chosen to make inventory management smooth.
    purseTime = 0.1;
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

    getServer() {
        return this.screen.map.world.server;
    }

    getWorld() {
        return this.screen.map.world;
    }

    getMap() {
        return this.screen.map;
    }

    // All of the main actions an entity can take are added onto the server queue.
    addExperience(experience) {
        if(this.canExperienceBoost) {
            this.canExperienceBoost = false;

            this.getServer().addTask(this.experienceBoostTime, () => {
                this.canExperienceBoost = true;
            });

            this.getServer().addTask(0, () => {
                this.doAddExperience(experience);
            });
        }
    }

    addHealth(health) {
        if(this.canHealthBoost) {
            this.canHealthBoost = false;

            this.getServer().addTask(this.healthBoostTime, () => {
                this.canHealthBoost = true;
            });

            this.getServer().addTask(0, () => {
                this.doAddHealth(health);
            });
        }
    }

    addMana(mana) {
        if(this.canManaBoost) {
            this.canManaBoost = false;

            this.getServer().addTask(this.manaBoostTime, () => {
                this.canManaBoost = true;
            });

            this.getServer().addTask(0, () => {
                this.doAddMana(mana);
            });
        }
    }

    makeInvincible(invincibleSeconds) {
        if(this.canMakeInvincible) {
            this.canMakeInvincible = false;

            this.getServer().addTask(this.invincibleTime, () => {
                this.canMakeInvincible = true;
            });

            this.getServer().addTask(0, () => {
                this.doMakeInvincible(invincibleSeconds);
            });
        }
    }

    consume(entity) {
        this.getServer().addTask(0, () => {
            this.doConsume(entity);
        });
    }

    despawn() {
        this.getServer().addTask(0, () => {
            this.doDespawn();
        });
    }

    interact() {
        this.getServer().addTask(0, () => {
            this.doInteract();
        });
    }

    spawn() {
        this.getServer().addTask(0, () => {
            this.doSpawn();
        });
    }

    spawnAsLoot() {
        this.getServer().addTask(0, () => {
            this.doSpawnAsLoot();
        });
    }

    takeDamage(entity, damage) {
        this.getServer().addTask(0, () => {
            this.doTakeDamage(entity, damage);
        });
    }

    

    




    

    action() {
        if(this.canAction) {
            this.canAction = false;

            this.getServer().addTask(this.actionTime, () => {
                this.canAction = true;
            });

            this.getServer().addTask(0, () => {
                this.doAction();
            });
        }
    }

    teleport(screen, x, y) {
        if(this.canOtherAction) {
            this.canOtherAction = false;

            this.getServer().addTask(this.otherTime, () => {
                this.canOtherAction = true;
            });

            this.getServer().addTask(0, () => {
                this.doTeleport(screen, x, y);
            });
        }
    }

    teleportHome() {
        if(this.canOtherAction) {
            this.canOtherAction = false;

            this.getServer().addTask(this.otherTime, () => {
                this.canOtherAction = true;
            });

            this.getServer().addTask(0, () => {
                this.doTeleportHome();
            });
        }
    }

    teleportDeath() {
        if(this.canOtherAction) {
            this.canOtherAction = false;

            this.getServer().addTask(this.otherTime, () => {
                this.canOtherAction = true;
            });

            this.getServer().addTask(0, () => {
                this.doTeleportDeath();
            });
        }
    }

    move(direction) {
        if(!this.isMoveInProgress) {
            this.direction = direction;
        }

        if(this.canMove && this.isNextStepAllowed(direction)) {
            this.isMoveInProgress = true;
            this.canMove = false;
            
            for(let a = 0; a < this.getServer().MOVEMENT_FRAMES; a++) {
                let fraction = a / this.getServer().MOVEMENT_FRAMES;
                this.getServer().addTask(this.movementTime * fraction, () => {
                    let [shiftX, shiftY] = Util.getDirectionalShift(direction);
                    this.animationShiftX = (shiftX * fraction);
                    this.animationShiftY = (shiftY * fraction);
                });
            }
            this.getServer().addTask(this.movementTime, () => {
                this.animationShiftX = 0;
                this.animationShiftY = 0;

                this.isMoveInProgress = false;
                this.canMove = true;

                this.doMove(direction);
            });
        }
    }

    changeDirection(direction) {
        if(!this.isMoveInProgress) {
            this.direction = direction;
        }

        if(this.canMove) {
            this.isMoveInProgress = true;
            this.canMove = false;

            this.getServer().addTask(this.movementTime, () => {
                this.isMoveInProgress = false;
                this.canMove = true;

                this.doChangeDirection(direction);
            });
        }
    }

    wait() {
        if(this.canMove) {
            this.canMove = false;

            this.getServer().addTask(this.movementTime, () => {
                this.canMove = true;
                this.doWait();
            });
        }
    }



    moveScreen(direction) {
        if(this.canOtherAction) {
            this.canOtherAction = false;

            this.getServer().addTask(this.otherTime, () => {
                this.canOtherAction = true;
            });

            this.getServer().addTask(0, () => {
                this.doMoveScreen(direction);
            });
        }
    }

    moveMap(direction) {
        if(this.canOtherAction) {
            this.canOtherAction = false;

            this.getServer().addTask(this.otherTime, () => {
                this.canOtherAction = true;
            });

            this.getServer().addTask(0, () => {
                this.doMoveMap(direction);
            });
        }
    }


    moveWorld(direction) {
        if(this.canOtherAction) {
            this.canOtherAction = false;

            this.getServer().addTask(this.otherTime, () => {
                this.canOtherAction = true;
            });

            this.getServer().addTask(0, () => {
                this.doMoveWorld(direction);
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

    // TODO If an entity is in motion, check both start and end locations...
    doCheckCollision() {
        // Call this after any movement to see if this entity is overlapping another on the same screen.
        let overlappingEntities = this.screen.getOverlappingEntities(this);
        for(let overlappingEntity of overlappingEntities) {
            this.doInteract(overlappingEntity);
            overlappingEntity.doInteract(this);
        }
    }

    isNextStepAllowed(direction) {
        // By default, check screen edges and if any entities in the direction block movement.
        let isFacingEdge = this.screen.isFacingEdge(this, direction);
        let canCrossScreen = this.canCrossScreen();
        let isScreenInDirection = this.isScreenInDirection(direction);
        if(isFacingEdge && (!canCrossScreen || !isScreenInDirection)) {
            return false;
        }
        
        let [shiftX, shiftY] = Util.getDirectionalShift(direction);
        let x = this.x + shiftX;
        let y = this.y + shiftY;

        let entities = this.screen.getEntitiesAt(x, y);
        for(let entity of entities) {
            if(this !== entity && this.isBlockedBy(entity)) {
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
            this.getWorld().deregister("inventory", this.inventory.numItems());
        }
    }

    doInteract(entity) {
        // By default, do nothing.
    }

    doSpawn() {
        this.screen.addEntity(this);
    }

    doSpawnAsLoot() {
        // Spawns this entity as loot (i.e. it will despawn after a certain amount of time).
        this.screen.addEntity(this);

        this.getServer().addTask(this.getServer().LOOT_TIME, () => {
            this.doDespawn();
        })
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

        // If the entity stays on the same screen, this is skipped to avoid triggering deregistration of instance screens.
        if(this.screen !== screen) {
            this.screen.removeEntity(this);
            this.screen = screen;
            screen.addEntity(this, x, y);
        }
    }

    doTeleportHome() {
        // By default, do nothing.
    }

    doTeleportDeath() {
        // Teleport the entity to the death plane.
        let deathMap = this.getWorld().getMapByPosition("death");
        let deathScreen = deathMap.getScreenByPosition(0, 0);
        this.doTeleport(deathScreen, 7, 11);
    }


    // By default, movement happens one tile at a time, and if the edge is crossed then the entity moves to the next screen.
    // Also, if you move onto another entity, the two entities interact with each other.
    doMove(direction) {
        if(this.screen.isFacingEdge(this, direction)) {
            // Cross into the next screen.
            this.screen.doCrossScreen(this, direction);
        }
        else {
            // Just do normal movement.
            let [shiftX, shiftY] = Util.getDirectionalShift(direction);
            this.x += shiftX;
            this.y += shiftY;
        }

        this.doCheckCollision();
    }

    doChangeDirection(direction) {
        // By default, do nothing.
    }

    doWait() {
        // By default, do nothing.
    }

    isScreenInDirection(direction) {
        return this.screen.isScreenInDirection(direction);
    }

    doMoveScreen(direction) {
        let newScreen = this.screen.getScreenInDirection(direction);
        this.doTeleport(newScreen, this.x, this.y);
    }

    doMoveMap(direction) {
        let newMap = this.screen.getMapInDirection(direction);
        let newScreen = newMap.getScreenByPosition(this.screen.x, this.screen.y);
        this.doTeleport(newScreen, this.x, this.y);
    }

    doMoveWorld(direction) {
        let newWorld = this.screen.getWorldInDirection(direction);
        let newMap = newWorld.getMapByPosition(this.getMap().id);
        let newScreen = newMap.getScreenByPosition(this.screen.x, this.screen.y);
        this.doTeleport(newScreen, this.x, this.y);
    }

    addToPurse(gold) {
        if(this.canPurse) {
            this.canPurse = false;

            this.getServer().addTask(this.purseTime, () => {
                this.canPurse = true;
            });

            this.getServer().addTask(0, () => {
                this.doAddToPurse(gold);
            });
        }
    }

    dropFromPurse(gold) {
        if(this.canPurse) {
            this.canPurse = false;

            this.getServer().addTask(this.purseTime, () => {
                this.canPurse = true;
            });

            this.getServer().addTask(0, () => {
                this.doDropFromPurse(gold);
            });
        }
    }


    addToInventory(entity) {
        if(this.canInventory) {
            this.canInventory = false;

            this.getServer().addTask(this.inventoryTime, () => {
                this.canInventory = true;
            });

            this.getServer().addTask(0, () => {
                this.doAddToInventory(entity);
            });
        }
    }

    consumeFromInventory(slot) {
        if(this.canInventory) {
            this.canInventory = false;

            this.getServer().addTask(this.inventoryTime, () => {
                this.canInventory = true;
            });

            this.getServer().addTask(0, () => {
                this.doConsumeFromInventory(slot);
            });
        }
    }

    dropFromInventory(slot, number) {
        if(this.canInventory) {
            this.canInventory = false;

            this.getServer().addTask(this.inventoryTime, () => {
                this.canInventory = true;
            });

            this.getServer().addTask(0, () => {
                this.doDropFromInventory(slot, number);
            });
        }
    }

    swapInventorySlots(slot1, slot2) {
        if(this.canInventory) {
            this.canInventory = false;

            this.getServer().addTask(this.inventoryTime, () => {
                this.canInventory = true;
            });

            this.getServer().addTask(0, () => {
                this.doSwapInventorySlots(slot1, slot2);
            });
        }
    }

    doAddToPurse(gold) {
        if(this.purse) {
            this.purse.addToPurse(gold);
            if(gold.stackSize === 0) {
                gold.doDespawn();
            }
        }
    }

    doDropFromPurse(goldAmount) {
        if(this.purse) {
            // A negative value or a value too large means to drop all the gold.
            if(goldAmount < 0 || goldAmount > this.purse.goldTotal) {
                goldAmount = this.purse.goldTotal;
            }

            this.getWorld().spawnAsLoot("gold", goldAmount, this.screen, this.x, this.y);
            this.purse.removeFromPurse(goldAmount);
        }
    }

    doAddToInventory(entity) {
        if(this.inventory) {
            this.inventory.addToInventory(entity);
            if(entity.stackSize === 0) {
                entity.doDespawn();
            }
        }
    }

    doConsumeFromInventory(slot) {
        // Consume 1 item in this inventory slot.
        if(this.inventory) {
            let item = this.inventory.itemMap.get(slot);
            if(item && item.canConsume(this)) {
                item.consume(this);
                this.inventory.removeFromInventorySlot(slot, 1);
            }
        }
    }

    doDropFromInventory(slot, number) {
        // Drop a number of items from a stack without consuming them.
        if(this.inventory) {
            let item = this.inventory.itemMap.get(slot);
            if(item) {
                // A negative value or a value too large means to drop the entire stack.
                if(number < 0 || number > item.stackSize) {
                    number = item.stackSize;
                }

                this.getWorld().spawnAsLoot(item.id, number, this.screen, this.x, this.y);
                this.inventory.removeFromInventorySlot(slot, number);
            }
        }
    }

    doSwapInventorySlots(slot1, slot2) {
        if(this.inventory) {
            this.inventory.swapInventorySlots(slot1, slot2);
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
        return this.getWorld().createInstance(this.id, number);
    }

    isBlockedBy(entity) {
        // By default, an entity is blocked from moving by any other tangible entity.
        return entity.isTangible;
    }

    canCrossScreen() {
        // By default, an entity can cross into any screen that exists.
        return true;
    }

    isAt(x, y) {
        // Returns true if this entity is at the point or currently moving onto the point.
        let [shiftX, shiftY] = Util.getDirectionalShift(this.direction);

        return (this.x === x && this.y === y)
        || (this.isMoveInProgress && this.x + shiftX === x && this.y + shiftY === y);
    }
}

module.exports = Entity;