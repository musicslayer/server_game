class Entity {
    // e.g. The entity that spawned a projectile is the owner.
    owner;

    // Each subclass should have a unique ID.
    id;

    screen;
    x;
    y;

    // Certain entities (i.e. players) can teleport home, so store the desired location here.
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

    moveLeft() {
        if(!this.isMoving) {
            this.direction = "left";
        }

        if(this.canMove && this.isNextStepAllowed()) {
            this.isMoving = true;
            this.canMove = false;
            
            for(let a = 0; a < this.getServer().MOVEMENT_FRAMES; a++) {
                let fraction = a / this.getServer().MOVEMENT_FRAMES;
                this.getServer().addTask(this.movementTime * fraction, () => {
                    this.animationShiftX = -fraction;
                });
            }
            this.getServer().addTask(this.movementTime, () => {
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

            for(let a = 0; a < this.getServer().MOVEMENT_FRAMES; a++) {
                let fraction = a / this.getServer().MOVEMENT_FRAMES;
                this.getServer().addTask(this.movementTime * fraction, () => {
                    this.animationShiftY = -fraction;
                });
            }
            this.getServer().addTask(this.movementTime, () => {
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

            for(let a = 0; a < this.getServer().MOVEMENT_FRAMES; a++) {
                let fraction = a / this.getServer().MOVEMENT_FRAMES;
                this.getServer().addTask(this.movementTime * fraction, () => {
                    this.animationShiftX = fraction;
                });
            }
            this.getServer().addTask(this.movementTime, () => {
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

            for(let a = 0; a < this.getServer().MOVEMENT_FRAMES; a++) {
                let fraction = a / this.getServer().MOVEMENT_FRAMES;
                this.getServer().addTask(this.movementTime * fraction, () => {
                    this.animationShiftY = fraction;
                });
            }
            this.getServer().addTask(this.movementTime, () => {
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

            this.getServer().addTask(this.otherTime, () => {
                this.canOtherAction = true;
            });

            this.getServer().addTask(0, () => {
                this.doScreenLeft();
            });
        }
    }

    screenUp() {
        if(this.canOtherAction) {
            this.canOtherAction = false;

            this.getServer().addTask(this.otherTime, () => {
                this.canOtherAction = true;
            });

            this.getServer().addTask(0, () => {
                this.doScreenUp();
            });
        }
    }

    screenRight() {
        if(this.canOtherAction) {
            this.canOtherAction = false;

            this.getServer().addTask(this.otherTime, () => {
                this.canOtherAction = true;
            });

            this.getServer().addTask(0, () => {
                this.doScreenRight();
            });
        }
    }

    screenDown() {
        if(this.canOtherAction) {
            this.canOtherAction = false;

            this.getServer().addTask(this.otherTime, () => {
                this.canOtherAction = true;
            });

            this.getServer().addTask(0, () => {
                this.doScreenDown();
            });
        }
    }


    mapUp() {
        if(this.canOtherAction) {
            this.canOtherAction = false;

            this.getServer().addTask(this.otherTime, () => {
                this.canOtherAction = true;
            });

            this.getServer().addTask(0, () => {
                this.doMapUp();
            });
        }
    }

    mapDown() {
        if(this.canOtherAction) {
            this.canOtherAction = false;

            this.getServer().addTask(this.otherTime, () => {
                this.canOtherAction = true;
            });

            this.getServer().addTask(0, () => {
                this.doMapDown();
            });
        }
    }



    worldUp() {
        if(this.canOtherAction) {
            this.canOtherAction = false;

            this.getServer().addTask(this.otherTime, () => {
                this.canOtherAction = true;
            });

            this.getServer().addTask(0, () => {
                this.doWorldUp();
            });
        }
    }

    worldDown() {
        if(this.canOtherAction) {
            this.canOtherAction = false;

            this.getServer().addTask(this.otherTime, () => {
                this.canOtherAction = true;
            });

            this.getServer().addTask(0, () => {
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
            this.getWorld().deregister("inventory", this.inventory.itemArray.length);
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
        let newMap = newWorld.getMapByPosition(this.getMap().id);
        let newScreen = newMap.getScreenByPosition(this.screen.x, this.screen.y);
        this.doTeleport(newScreen, this.x, this.y);
    }

    doWorldDown() {
        let newWorld = this.screen.getWorldDown();
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
            let item = this.inventory.itemArray[slot];
            if(item && item.canConsume(this)) {
                item.consume(this);
                this.inventory.removeFromInventorySlot(slot, 1);
            }
        }
    }

    doDropFromInventory(slot, number) {
        // Drop a number of items from a stack without consuming them.
        if(this.inventory) {
            let item = this.inventory.itemArray[slot];
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
}

module.exports = Entity;