const Reflection = require("../reflection/Reflection.js");
const EntityFactory = require("./EntityFactory.js");
const Util = require("../util/Util.js");
const Fallback = require("../constants/Fallback.js");
const Performance = require("../constants/Performance.js");
const ServerTask = require("../server/ServerTask.js");
const UID = require("../uid/UID.js");

class Entity extends UID {
    id;

    isSpawned = false; // Only true if this entity instance exists in the game world.
    isPlayer = false;
    isAI = false;

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

    aggroMap = new Map();

    constructor(uid) {
        super(uid);
    }

    getUIDMapName() {
        return "Entity";
    }

    getName() {
        return undefined;
    }

    getInfo() {
        return undefined;
    }

    getServer() {
        return this.screen.map.world.universe.server;
    }

    /*
        These "doX" methods can change the state of the server and thus should always be scheduled.
    */

    doAddHealth(health) {
        this.health = Math.min(this.health + health, this.maxHealth);
    }

    doAddMana(mana) {
        this.mana = Math.min(this.mana + mana, this.maxMana);
    }

    doMakeInvincible(invincibleSeconds) {
        this.isInvincible = true;

        let serverTask = new ServerTask((entity) => {
            entity.isInvincible = false;
        }, this);

        this.getServer().scheduleTask(undefined, invincibleSeconds, serverTask);
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
        entity.ownerID = this.id;
        entity.doSpawn();
    }

    doSpawn() {
        this.isSpawned = true;
        this.screen.addEntity(this);
    }

    doSpawnAsLoot() {
        // Spawns this entity as loot (i.e. it will despawn after a certain amount of time).
        this.doSpawn();

        let serverTask = new ServerTask((entity) => {
            entity.doDespawn();
        }, this);

        this.getServer().scheduleTask(undefined, Performance.LOOT_TIME, serverTask);
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

    doTeleportFallback() {
        // If the fallback screen cannot be found, then do nothing.
        // Players will remain trapped on the fallback map until this is fixed.
        let fallbackMap = this.screen.map.world.getMapByName(Fallback.FALLBACK_MAP_NAME);
        let fallbackScreen = fallbackMap?.getScreenByName(Fallback.FALLBACK_SCREEN_NAME);
        let fallbackX = Fallback.FALLBACK_X;
        let fallbackY = Fallback.FALLBACK_Y;

        if(fallbackScreen) {
            this.doTeleport(fallbackScreen, fallbackX, fallbackY);
        }
    }

    doTeleportHome() {
        let homeMap = this.screen.map.world.getMapByName(this.homeMapName);
        let homeScreen = homeMap?.getScreenByName(this.homeScreenName);

        if(homeScreen) {
            this.doTeleport(homeScreen, this.homeX, this.homeY);
        }
        else {
            this.doTeleportFallback();
        }
    }

    doTeleportDeath() {
        // Teleport the entity to the death plane.
        let deathMap = this.screen.map.world.getMapByID("death");
        let deathScreen = deathMap.getScreenByID(0, 0);
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
        let newMap = this.screen.map.getMapInDirection(direction);
        let newScreen = newMap.getScreenByID(this.screen.x, this.screen.y);
        this.doTeleport(newScreen, this.x, this.y);
    }

    doMoveWorld(direction) {
        let newWorld = this.screen.map.world.getWorldInDirection(direction);
        let newMap = newWorld.getMapByID(this.screen.map.id);
        let newScreen = newMap.getScreenByID(this.screen.x, this.screen.y);
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
                    let itemDrop = EntityFactory.createInstance(Util.getClassName(item), number);
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

        while(rootEntity.getOwner()) {
            rootEntity = rootEntity.getOwner();
        }

        return rootEntity;
    }

    getOwner() {
        if(this.ownerID) {
            this.owner = EntityFactory.entityMap.get(this.ownerID);
            this.ownerID = undefined;
        }
        return this.owner;
    }

    clone(number) {
        // By default, just create another instance with the same screen and the provided stack size.
        let clone = EntityFactory.createInstance(Util.getClassName(this), number);
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

    serialize(writer) {
        // To avoid a circular loop, only write a reference to the screen.
        writer.beginObject()
            .serialize("!V!", 1)
            .serialize("uid", this.uid)
            .serialize("className", Util.getClassName(this))
            .serialize("id", this.id)
            .serialize("isSpawned", this.isSpawned)
            .serialize("isPlayer", this.isPlayer)
            .serialize("isAI", this.isAI)
            .serialize("ownerID", this.owner?.id ?? this.ownerID)
            .serialize("health", this.health)
            .serialize("maxHealth", this.maxHealth)
            .serialize("mana", this.mana)
            .serialize("maxMana", this.maxMana)
            .serialize("isDead", this.isDead)
            .serialize("isInvincible", this.isInvincible)
            .reference("screen", this.screen)
            .serialize("x", this.x)
            .serialize("y", this.y)
            .serialize("animationShiftX", this.animationShiftX)
            .serialize("animationShiftY", this.animationShiftY)
            .serialize("homeMapName", this.homeMapName)
            .serialize("homeScreenName", this.homeScreenName)
            .serialize("homeX", this.homeX)
            .serialize("homeY", this.homeY)
            .serialize("isTangible", this.isTangible)
            .serialize("isActionBlocker", this.isActionBlocker)
            .serialize("isMoveInProgress", this.isMoveInProgress)
            .serialize("moveTime", this.moveTime)
            .serialize("directionTime", this.directionTime)
            .serialize("actionTime", this.actionTime)
            .serialize("inventoryTime", this.inventoryTime)
            .serialize("purseTime", this.purseTime)
            .serialize("createTime", this.createTime)
            .serialize("direction", this.direction)
            .serialize("maxStackNumber", this.maxStackNumber)
            .serialize("maxStackSize", this.maxStackSize)
            .serialize("stackSize", this.stackSize)

        if(this.isPlayer) {
            writer.serialize("healthRegen", this.healthRegen)
                .serialize("manaRegen", this.manaRegen)
                .serialize("inventory", this.inventory)
                .serialize("purse", this.purse)
                .serialize("progress", this.progress)
        }

        if(this.isAI) {
            writer.serialize("ai", this.ai)
        }

        // Projectile
        writer.serialize("range", this.range);
        writer.serialize("damage", this.damage);
        writer.serialize("isMulti", this.isMulti);

        // Monster Spawner
        writer.serialize("spawnTime", this.spawnTime);
        writer.serialize("monsterCount", this.monsterCount);
        writer.serialize("maxMonsterCount", this.maxMonsterCount);

        // Monster
        writer.serializeMap("aggroMap", this.aggroMap);
        writer.serialize("maxAggro", this.maxAggro);
        writer.serialize("aggroGain", this.aggroGain);
        writer.serialize("aggroForgiveness", this.aggroForgiveness);
        writer.serialize("aggroForgivenessTime", this.aggroForgivenessTime);
        writer.serialize("lastPlayerID", this.lastPlayerID);

        writer.endObject();
    }

    static deserialize(reader) {
        let entity;
        reader.beginObject();

        let version = reader.deserialize("!V!", "String");
        if(version === "1") {
            let uid = reader.deserialize("uid", "Number");

            let className = reader.deserialize("className", "String");
            entity = Reflection.createInstance(className, uid);

            // Note that "ownerID" and "screenInfo" will be used later.
            entity.id = reader.deserialize("id", "Number");
            entity.isSpawned = reader.deserialize("isSpawned", "Boolean");
            entity.isPlayer = reader.deserialize("isPlayer", "Boolean");
            entity.isAI = reader.deserialize("isAI", "Boolean");
            entity.ownerID = reader.deserialize("ownerID", "Number");
            entity.health = reader.deserialize("health", "Number");
            entity.maxHealth = reader.deserialize("maxHealth", "Number");
            entity.mana = reader.deserialize("mana", "Number");
            entity.maxMana = reader.deserialize("maxMana", "Number");
            entity.isDead = reader.deserialize("isDead", "Boolean");
            entity.isInvincible = reader.deserialize("isInvincible", "Boolean");
            entity.screenInfo = reader.dereference("screen", "Screen");
            entity.x = reader.deserialize("x", "Number");
            entity.y = reader.deserialize("y", "Number");
            entity.animationShiftX = reader.deserialize("animationShiftX", "Number");
            entity.animationShiftY = reader.deserialize("animationShiftY", "Number");
            entity.homeMapName = reader.deserialize("homeMapName", "String");
            entity.homeScreenName = reader.deserialize("homeScreenName", "String");
            entity.homeX = reader.deserialize("homeX", "Number");
            entity.homeY = reader.deserialize("homeY", "Number");
            entity.isTangible = reader.deserialize("isTangible", "Boolean");
            entity.isActionBlocker = reader.deserialize("isActionBlocker", "Boolean");
            entity.isMoveInProgress = reader.deserialize("isMoveInProgress", "Boolean");
            entity.moveTime = reader.deserialize("moveTime", "Number");
            entity.directionTime = reader.deserialize("directionTime", "Number");
            entity.actionTime = reader.deserialize("actionTime", "Number");
            entity.inventoryTime = reader.deserialize("inventoryTime", "Number");
            entity.purseTime = reader.deserialize("purseTime", "Number");
            entity.createTime = reader.deserialize("createTime", "Number");
            entity.direction = reader.deserialize("direction", "String");
            entity.maxStackNumber = reader.deserialize("maxStackNumber", "Number");
            entity.maxStackSize = reader.deserialize("maxStackSize", "Number");
            entity.stackSize = reader.deserialize("stackSize", "Number");

            if(entity.isPlayer) {
                entity.healthRegen = reader.deserialize("healthRegen", "Number");
                entity.manaRegen = reader.deserialize("manaRegen", "Number");
                entity.inventory = reader.deserialize("inventory", "Inventory");
                entity.purse = reader.deserialize("purse", "Purse");
                entity.progress = reader.deserialize("progress", "Progress");
            }

            if(entity.isAI) {
                entity.ai = reader.deserialize("ai", "AI");
            }

            entity.range = reader.deserialize("range", "Number");
            entity.damage = reader.deserialize("damage", "Number");
            entity.isMulti = reader.deserialize("isMulti", "Boolean");

            entity.spawnTime = reader.deserialize("spawnTime", "Number");
            entity.monsterCount = reader.deserialize("monsterCount", "Number");
            entity.maxMonsterCount = reader.deserialize("maxMonsterCount", "Number");

            entity.aggroMap = reader.deserializeMap("aggroMap", "Number", "Number");
            entity.maxAggro = reader.deserialize("maxAggro", "Number");
            entity.aggroGain = reader.deserialize("aggroGain", "Number");
            entity.aggroForgiveness = reader.deserialize("aggroForgiveness", "Number");
            entity.aggroForgivenessTime = reader.deserialize("aggroForgivenessTime", "Number");
            entity.lastPlayerID = reader.deserialize("lastPlayerID", "Number");

            // Update the EntityFactory mapping.
            EntityFactory.entityMap.set(entity.id, entity);
        }
        else {
            throw("Unknown version number: " + version);
        }

        reader.endObject();
        return entity;
    }
}

module.exports = Entity;