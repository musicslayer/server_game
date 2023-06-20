//const { createCanvas, Image } = require("canvas")

const EntitySpawner = require("./EntitySpawner.js");
//const ImageCatalog = require("../image/ImageCatalog.js");
const Server = require("../server/Server.js");
const DeathScreen = require("../world/DeathScreen.js");
const DeathMap = require("../world/DeathMap.js");

class Entity {
    // e.g. The entity that spawned a projectile is the owner.
    owner;

    // Each subclass should have a unique ID.
    id;

    screen;
    x;
    y;

    // Certain entities (i.e. players) can teleport home, so store the desired location here.
    homeScreen;
    homeX;
    homeY;

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

    spawn(screen, x, y) {
        Server.addTask(() => {
            this.doSpawn(screen, x, y);
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

    teleport(screen, x, y) {
        if(this.canOtherAction) {
            this.canOtherAction = false;

            Server.scheduleTaskForSeconds(this.otherTime, () => {
                this.canOtherAction = true;
            });

            Server.addTask(() => {
                this.doTeleport(screen, x, y);
            });
        }
    }

    teleportHome() {
        if(this.canOtherAction) {
            this.canOtherAction = false;

            Server.scheduleTaskForSeconds(this.otherTime, () => {
                this.canOtherAction = true;
            });

            Server.addTask(() => {
                this.doTeleportHome();
            });
        }
    }

    teleportDeath() {
        if(this.canOtherAction) {
            this.canOtherAction = false;

            Server.scheduleTaskForSeconds(this.otherTime, () => {
                this.canOtherAction = true;
            });

            Server.addTask(() => {
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
        let entities = this.screen.otherEntities.concat(this.screen.playerEntities);
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
            isScreen = this.screen.isScreenUp();
            y--;
        }
        else if(this.direction === "down") {
            isEdge = y == 11;
            isScreen = this.screen.isScreenDown();
            y++;
        }
        else if(this.direction === "left") {
            isEdge = x == 0;
            isScreen = this.screen.isScreenLeft();
            x--;
        }
        else if(this.direction === "right") {
            isEdge = x == 15;
            isScreen = this.screen.isScreenRight();
            x++;
        }

        if(isEdge && !isScreen) {
            return false;
        }

        // TODO Should these sorts of methods be in the screen class?
        let entities = this.screen.otherEntities.concat(this.screen.playerEntities);
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

        if(this.inventory) {
            Server.deregisterInventoryEntity(this.inventory.itemArray.length);
        }
    }

    doInteract(entity) {
        // By default, do nothing.
    }

    doSpawn(screen, x, y) {
        // By default, the home location is where an entity is first spawned. This can be changed later.
        this.homeScreen = screen;
        this.homeX = x;
        this.homeY = y;

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
            if(screen.isDynamic) {
                this?.inventory.turnOff();
                this?.purse.turnOff();
            }
            else {
                this?.inventory.turnOn();
                this?.purse.turnOn();
            }

            // If the entity stays on the same screen, skip this to avoid triggering "screen.checkDestruction()".
            this.screen.removeEntity(this);
            this.screen = screen;
            screen.addEntity(this);
        }
    }

    doTeleportHome() {
        // Teleport the entity to its home location.
        this.doTeleport(this.homeScreen, this.homeX, this.homeY);
    }

    doTeleportDeath() {
        // Teleport the entity to the death plane.
        let deathMap = DeathMap.createDeathMap();
        let deathScreen = DeathScreen.createDeathScreen(0, 0);
        deathScreen.attachMap(deathMap);
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
        if(newMap) {
            let newScreen = newMap.getScreenByPosition(this.screen.x, this.screen.y);
            this.doTeleport(newScreen, this.x, this.y);
        }
    }

    doMapDown() {
        let newMap = this.screen.getMapDown();
        if(newMap) {
            let newScreen = newMap.getScreenByPosition(this.screen.x, this.screen.y);
            this.doTeleport(newScreen, this.x, this.y);
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

    addToPurse(gold) {
        if(this.canPurse) {
            this.canPurse = false;

            Server.scheduleTaskForSeconds(this.purseTime, () => {
                this.canPurse = true;
            });

            Server.addTask(() => {
                this.doAddToPurse(gold);
            });
        }
    }

    dropFromPurse(gold) {
        if(this.canPurse) {
            this.canPurse = false;

            Server.scheduleTaskForSeconds(this.purseTime, () => {
                this.canPurse = true;
            });

            Server.addTask(() => {
                this.doDropFromPurse(gold);
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

    swapInventorySlots(slot1, slot2) {
        if(this.canInventory) {
            this.canInventory = false;

            Server.scheduleTaskForSeconds(this.inventoryTime, () => {
                this.canInventory = true;
            });

            Server.addTask(() => {
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

            EntitySpawner.spawn("gold", goldAmount, this.screen, this.x, this.y);
            this.purse.removeFromPurse(goldAmount);
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
        // Drop a number of items from a stack without consuming them.
        if(this.inventory && this.inventory.isActive) {
            let item = this.inventory.itemArray[slot];
            if(item) {
                // A negative value or a value too large means to drop the entire stack.
                if(number < 0 || number > item.stackSize) {
                    number = item.stackSize;
                }

                EntitySpawner.spawn(item.id, number, this.screen, this.x, this.y);
                this.inventory.removeFromInventorySlot(slot, number);
            }
        }
    }

    doSwapInventorySlots(slot1, slot2) {
        // Switch 2 inventory slots.
        if(this.inventory) {
            this.inventory.swapInventorySlots(slot1, slot2);
        }
    }









    /*
    getImages() {
        // By default, use a generic picture.
        let images = this.getEntityImages();

        // Don't bother drawing a "1".
        if(this.stackSize > 1) {
            images.push({
                x: this.x + this.animationShiftX,
                y: this.y + this.animationShiftY,
                image: this.getEntityCountImage()
            });
        }

        return images;
    }

    getEntityImages() {
        // By default, use a generic picture.
        let images = [];

        images.push({
            x: this.x + this.animationShiftX,
            y: this.y + this.animationShiftY,
            image: ImageCatalog.IMAGE_CATALOG.getImageTableByName("_base").getImageByName("unknown")
        });

        return images;
    }

    getEntityCountImage() {
        let canvas = createCanvas(128, 128);
        let ctx = canvas.getContext("2d");

        ctx.font = "30px Arial";
        ctx.fillText("" + this.stackSize, 0, 20);

        const buffer = canvas.toBuffer("image/png");

        let image = new Image();
        image.src = buffer;

        return image;
    }
    */

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