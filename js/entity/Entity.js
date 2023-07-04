const Reflection = require("../reflection/Reflection.js");
const EntityFactory = require("./EntityFactory.js");
const Util = require("../util/Util.js");
const Performance = require("../server/Performance.js");

class Entity {
    isSerializable = true; // By default, entities can be serialized and saved.
    isSpawned = false; // Only true if this entity instance exists in the game world.
    isPlayer = false;

    owner; // e.g. The entity that spawned a projectile is the owner.

    health = 0;
    maxHealth = 0;

    mana = 0;
    maxMana = 0;

    isDead = false;
    isInvincible = false;

    screen;
    x;
    y;
    animationShiftX = 0;
    animationShiftY = 0;

    // Certain entities (i.e. players) can teleport home, so store the desired location here.
    homeMapName;
    homeScreenName; // Cannot be a dynamic screen
    homeX;
    homeY;
    


    
    isTangible = false; // Tangible objects block movement and can interact with projectiles.
    isActionBlocker = false; // Action blockers block projectiles without interacting with them.

    isMoveInProgress = false;

    // Seconds to perform 1 movement or action.
    moveTime = 0.1;
    directionTime = 0;
    actionTime = 0.1;
    inventoryTime = 0.1;
    purseTime = 0.1;
    createTime = 0.1

    // To avoid awkward edge cases, just make every entity start facing to the right.
    direction = "right";

    // By default, entities don't form into stacks of themselves.
    maxStackNumber = 1;
    maxStackSize = 1;
    stackSize = 1;

    // Used by subclasses.
    healthRegen;
    manaRegen;
    inventory;
    purse;
    progress;

    getClassName() {
        return this.constructor.name;
    }

    getName() {
        return undefined;
    }

    getInfo() {
        return undefined;
    }

    getServerScheduler() {
        return this.screen.map.world.universe.server.serverScheduler;
    }

    /*
        These methods can change the state of the game and should always be scheduled on the server.
    */

    // TODO We can rename these to get rid of the "do" prefix
    doAddHealth(health) {
        this.health = Math.min(this.health + health, this.maxHealth);
    }

    doAddMana(mana) {
        this.mana = Math.min(this.mana + mana, this.maxMana);
    }

    doMakeInvincible(invincibleSeconds) {
        this.isInvincible = true;
        this.getServerScheduler().scheduleTask(undefined, invincibleSeconds, () => {
            this.isInvincible = false;
        });
    }

    doCheckCollision() {
        // Call this after any movement to see if this entity is overlapping another on the same screen.
        let overlappingEntities = this.screen.getOverlappingEntities(this);
        for(let overlappingEntity of overlappingEntities) {
            this.doInteract(overlappingEntity);
            overlappingEntity.doInteract(this);
        }
    }

    

    doConsume(entity) {
        // By default, do nothing.
    }

    doDespawn() {
        this.isSpawned = false;
        this.screen.removeEntity(this);
    }

    doInteract(entity) {
        // By default, do nothing.
    }

    doSpawnEntity(entity) {
        entity.owner = this;
        entity.doSpawn();
    }

    doSpawn() {
        this.isSpawned = true;
        this.screen.addEntity(this);
    }

    doSpawnInWorld(world) {
        // Spawns into the same map/screen/x/y that the entity is already located at but in the given world.
        this.doSpawn();

        let map = world.getMapByName(this.screen.map.name);
        let screen = map?.getScreenByName(this.screen.name);

        if(screen) {
            this.doTeleport(screen, this.x, this.y);
        }
    }

    doSpawnAsLoot() {
        // Spawns this entity as loot (i.e. it will despawn after a certain amount of time).
        this.doSpawn();

        this.getServerScheduler().scheduleTask(undefined, Performance.LOOT_TIME, () => {
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
        let homeMap = this.screen.map.world.getMapByName(this.homeMapName);
        let homeScreen = homeMap?.getScreenByName(this.homeScreenName);

        if(homeScreen) {
            this.doTeleport(homeScreen, this.homeX, this.homeY);
        }
    }

    doTeleportDeath() {
        // Teleport the entity to the death plane.
        let deathMap = this.screen.map.world.getMapByPosition("death");
        let deathScreen = deathMap.getScreenByPosition(0, 0);
        this.doTeleport(deathScreen, 7, 11);
    }

    doKill() {
        // Called when an entity is killed but not despawned, for example players who die and get sent to the death plane.
        this.health = 0;
        this.mana = 0;

        this.isDead = true;
        this.isInvincible = false;

        // ??? If the player is in a dungeon, could we just teleport them to the entrance instead?
        this.doTeleportDeath();
    }

    doRevive() {
        // Called when an entity is revived but was not despawned first, for example players who enter a revive portal.
        this.health = this.maxHealth;
        this.mana = this.maxMana;

        this.isDead = false;

        this.doTeleportHome();
    }

    doChangeDirection(direction) {
        this.direction = direction;
    }

    doMoveStep() {
        // Perform a single step of movement in the entity's current direction.
        // If the edge is crossed then the entity moves to the next screen.
        // Also, if you move onto another entity, the two entities interact with each other.
        if(this.screen.isFacingEdge(this, this.direction)) {
            // Cross into the next screen.
            this.screen.doCrossScreen(this, this.direction);
        }
        else {
            // Just do normal movement.
            let [shiftX, shiftY] = Util.getDirectionalShift(this.direction);
            this.x += shiftX;
            this.y += shiftY;
        }

        this.doCheckCollision();
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
        let newMap = newWorld.getMapByPosition(this.screen.map.id);
        let newScreen = newMap.getScreenByPosition(this.screen.x, this.screen.y);
        this.doTeleport(newScreen, this.x, this.y);
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

            if(goldAmount > 0) {
                let gold = EntityFactory.createInstance("Gold", goldAmount);
                gold.screen = this.screen;
                gold.x = this.x;
                gold.y = this.y;

                gold.doSpawnAsLoot();

                this.purse.removeFromPurse(goldAmount);
            }
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
                item.doConsume(this);
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

                if(number > 0) {
                    let itemDrop = EntityFactory.createInstance(item.getClassName(), number);
                    itemDrop.screen = this.screen;
                    itemDrop.x = this.x;
                    itemDrop.y = this.y;

                    itemDrop.doSpawnAsLoot();

                    this.inventory.removeFromInventorySlot(slot, number);
                }
            }
        }
    }

    doSwapInventorySlots(slot1, slot2) {
        if(this.inventory) {
            this.inventory.swapInventorySlots(slot1, slot2);
        }
    }





    isScreenInDirection(direction) {
        return this.screen.isScreenInDirection(direction);
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

    getRootEntity(entity) {
        let rootEntity = entity;

        while(rootEntity.owner) {
            rootEntity = rootEntity.owner;
        }

        return rootEntity;
    }

    clone(number) {
        // By default, just create another instance with the same screen and the provided stack size.
        let clone = EntityFactory.createInstance(this.getClassName(), number);
        clone.screen = this.screen;
        return clone;
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
        return (this.x === x && this.y === y) || (this.getMovementX() === x && this.getMovementY() === y);
    }

    getMovementX() {
        // Returns x, but if movement is in progress return the value that the entity is moving towards.
        let [shiftX, ] = Util.getDirectionalShift(this.direction);
        return this.isMoveInProgress ? this.x + shiftX : this.x;
    }

    getMovementY() {
        // Returns y, but if movement is in progress return the value that the entity is moving towards.
        let [, shiftY] = Util.getDirectionalShift(this.direction);
        return this.isMoveInProgress ? this.y + shiftY : this.y;
    }

    // TODO how to serialize owner? Or do we not need to because all the ones with owners aren't saved?

    serialize(writer) {
        // To avoid a circular loop, don't serialize the screen.
        writer.beginObject()
            .serialize("className", this.getClassName())
            .serialize("stackSize", this.stackSize)
            .serialize("x", this.x)
            .serialize("y", this.y)
        .endObject();
    }

    static deserialize(reader) {
        let entity;

        reader.beginObject();
        let className = reader.deserialize("className", "String");
        let stackSize = reader.deserialize("stackSize", "Number");
        let x = reader.deserialize("x", "Number");
        let y = reader.deserialize("y", "Number");
        reader.endObject();

        entity = Reflection.createInstance(className);

        entity.stackSize = stackSize;
        entity.x = x;
        entity.y = y;

        return entity;
    }
}

module.exports = Entity;