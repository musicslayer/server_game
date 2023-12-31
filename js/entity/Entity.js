const Reflection = require("../reflection/Reflection.js");
const Util = require("../util/Util.js");
const Constants = require("../constants/Constants.js");
const ServerTask = require("../server/ServerTask.js");
const UID = require("../uid/UID.js");

class Entity extends UID {
    isSpawned = false; // Only true if this entity instance exists in the game world.
    isPlayer = false;

    owner_uid; // e.g. The entity that spawned a projectile is the owner.

    health = 0;
    maxHealth = 0;

    mana = 0;
    maxMana = 0;

    statuses = [];

    screen;
    mapName;
    screenName;
    x;
    y;
    animationShiftX = 0;
    animationShiftY = 0;

    // Certain entities (i.e. players) can teleport home, so store the desired location here.
    homeMapName;
    homeScreenName;
    homeX;
    homeY;
    


    
    isTangible = false; // Tangible objects block movement and can interact with projectiles.
    isActionBlocker = false; // Action blockers block projectiles without interacting with them.

    isMoveInProgress = false;

    selectedEntity_uid;
    selectedSlot = 0;
    delayMap = new Map();

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

    serverTasks = [];
    statusServerTaskMap = new Map();

    static createInstance(className, stackSize, ...args) {
        // Use this factory method to create subclass instances.
        let entity = Reflection.createInstance(className, ...args) ?? Reflection.createInstance("UnknownEntity", ...args);
        entity.stackSize = stackSize;
        return entity;
    }

    static getEntity(uid) {
        return UID.uidMap.get("Entity").get(uid);
    }

    getUIDMapName() {
        return "Entity";
    }

    getName() {
        return undefined;
    }

    getImageName() {
        // Returns the name used to look up the image on the Client.
        return undefined;
    }

    getInfo() {
        return undefined;
    }

    isVisible() {
        // By default, entities can be seen unless they have the status of "invisible"
        return !this.isStatus("invisible");
    }

    getServer() {
        return this.screen.map.world.universe.server;
    }

    getHealthFraction() {
        return this.maxHealth === 0 ? undefined : this.health / this.maxHealth;
    }

    getManaFraction() {
        return this.maxMana === 0 ? undefined : this.mana / this.maxMana;
    }

    getExperienceFraction() {
        let experienceFraction;

        if(this.progress) {
            experienceFraction = this.progress.nextExperience === 0 ? undefined : this.progress.experience / this.progress.nextExperience;
        }

        return experienceFraction;
    }

    getLevel() {
        return this.progress?.level;
    }

    onEntitySpawn() {
        // By default, do nothing.
    }

    onEntityDespawn() {
        // By default, do nothing.
    }

    /*
        These "doX" methods can change the state of the server and thus should always be scheduled.
    */

    doAddHealth(health) {
        if(!this.isStatus("dead")) {
            this.health = Math.min(this.health + health, this.maxHealth);
        }
    }

    doAddMana(mana) {
        if(!this.isStatus("dead")) {
            this.mana = Math.min(this.mana + mana, this.maxMana);
        }
    }

    doMakeStatus(status, time) {
        // Gives the entity a status and registers the server task to later remove it.
        // This should not be used with the "dead" status.
        this.addStatus(status);

        let serverTask = new ServerTask(undefined, time, 1, "status_off", this, status);

        this.ownStatusServerTask(status, serverTask);
        this.getServer().scheduleTask(serverTask);
    }

    doCheckCollision() {
        // Call this after any movement to see if this entity is overlapping another on the same screen.
        let overlappingEntities = this.screen.getOverlappingEntities(this);
        for(let overlappingEntity of overlappingEntities) {
            this.doInteract(overlappingEntity);
            overlappingEntity.doInteract(this);
        }
    }

    
    // eslint-disable-next-line no-unused-vars
    doConsume(entity) {
        // By default, do nothing.
    }

    doDespawn() {
        this.isSpawned = false;
        this.screen.removeEntity(this);
        this.cancelAllServerTasks();

        // When players are removed we notify the screen in case instances should be destroyed.
        // Non-players will never be used again so remove them from the UID map.
        if(this.isPlayer) {
            this.screen.notifyPlayerRemoval();
        }
        else {
            this.remove();
        }

        this.getOwner()?.onEntityDespawn();
    }

    // eslint-disable-next-line no-unused-vars
    doInteract(entity) {
        // By default, do nothing.
    }

    doSpawnEntity(entity) {
        entity.setOwner(this);
        entity.doSpawn();
        this.onEntitySpawn();
    }

    doSpawn() {
        this.isSpawned = true;
        this.screen.addEntity(this);
    }

    doSpawnAsLoot() {
        // Spawns this entity as loot (i.e. it will despawn after a certain amount of time).
        this.doSpawn();

        let serverTask = new ServerTask(undefined, Constants.performance.LOOT_TIME, 1, "despawn", this);
        this.getServer().scheduleTask(serverTask);
    }

    // eslint-disable-next-line no-unused-vars
    doTakeDamage(entity, damage) {
        // By default, do nothing.
    }


    doAnimationReset() {
        this.isMoveInProgress = false;
        this.animationShiftX = 0;
        this.animationShiftY = 0;
    }

    doAnimationShift(fraction, shiftX, shiftY) {
        this.isMoveInProgress = true;
        this.animationShiftX = (shiftX * fraction);
        this.animationShiftY = (shiftY * fraction);
    }



    doAction() {
        // By default, do nothing.
    }

    

    doTeleportDeath() {
        // Teleport the entity to the death plane.
        let deathWorld = this.screen.map.world.universe.getWorldByID("death");
        deathWorld.teleportToEntrance(this);
    }

    doTeleportFallback() {
        // Teleport the entity to the fallback map.
        let fallbackWorld = this.screen.map.world.universe.getWorldByID("fallback");
        fallbackWorld.teleportToEntrance(this);
    }

    doTeleportTutorial() {
        // Teleport the entity to the tutorial map.
        let tutorialWorld = this.screen.map.world.universe.getWorldByID("tutorial");
        tutorialWorld.teleportToEntrance(this);
    }

    doTeleportHome() {
        this.doTeleportLocation(this.homeMapName, this.homeScreenName, this.homeX, this.homeY);
    }

    doTeleportLocation(mapName, screenName, x, y) {
        let map = this.screen.map.world.getMapByName(mapName);
        let screen = map?.getScreenByName(screenName);
        
        if(screen) {
            this.doTeleport(screen, x, y);
        }
        else {
            this.doTeleportFallback();
        }
    }

    doTeleport(screen, x, y) {
        // Move to an arbitrary point in the world. Do not check collision or call spawn/respawn.
        if(screen.hasXY(x, y)) {
            this.x = x;
            this.y = y;

            // If the screen does not change, skip this for performance reasons.
            if(this.screen !== screen) {
                let oldScreen = this.screen;

                this.screen.removeEntity(this);
                this.setScreen(screen);
                this.screen.addEntity(this, x, y);

                // When players are removed we notify the screen in case instances should be destroyed.
                if(this.isPlayer) {
                    oldScreen.notifyPlayerRemoval();
                }
            }
        }
    }

    doKill() {
        // Called when an entity is killed but not despawned, for example players who die and get sent to the death plane.
        this.health = 0;
        this.mana = 0;

        // Remove all statuses and add "dead".
        let statuses = this.statuses.slice();
        for(let status of statuses) {
            this.removeStatus(status);
        }

        // ??? If the player is in a dungeon, could we just teleport them to the entrance instead of making them "dead"?
        this.addStatus("dead");
        this.doTeleportDeath();
    }

    doRevive() {
        // Called when an entity is revived but was not despawned first, for example players who enter a revive portal.
        this.health = this.maxHealth;
        this.mana = this.maxMana;

        this.removeStatus("dead");

        this.doTeleportHome();
    }

    doChangeDirection(direction) {
        this.direction = direction;
    }

    doMoveStep(direction) {
        // Perform a single step of movement in the direction.
        // If the edge is crossed then the entity moves to the next screen.
        // Also, if you move onto another entity, the two entities interact with each other.
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

    doMoveScreen(direction) {
        let newScreen = this.screen.getScreenInDirection(direction);
        this.doTeleport(newScreen, this.x, this.y);
    }

    doMoveMap(direction) {
        let newMap = this.screen.map.getMapInDirection(direction);
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
                let gold = Entity.createInstance("Gold", goldAmount);
                gold.setScreen(this.screen);
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

    doDropFromInventory(slot, stackSize) {
        // Drop a number of items from a stack without consuming them.
        if(this.inventory) {
            let item = this.inventory.itemMap.get(slot);
            if(item) {
                // A negative value or a value too large means to drop the entire stack.
                if(stackSize < 0 || stackSize > item.stackSize) {
                    stackSize = item.stackSize;
                }

                if(stackSize > 0) {
                    let itemDrop = Entity.createInstance(Util.getClassName(item), stackSize);
                    itemDrop.setScreen(this.screen);
                    itemDrop.x = this.x;
                    itemDrop.y = this.y;

                    itemDrop.doSpawnAsLoot();

                    this.inventory.removeFromInventorySlot(slot, stackSize);
                }
            }
        }
    }

    doSwapInventorySlots(slot1, slot2) {
        if(this.inventory) {
            // Swap the selected slots.
            if(this.inventory.itemMap.has(slot1) && this.inventory.itemMap.has(slot2)) {
                if(this.selectedSlot === slot1) {
                    this.setSelectedEntity(this.inventory.itemMap.get(slot1));
                    this.selectedSlot = slot2;
                }
                else if(this.selectedSlot === slot2) {
                    this.setSelectedEntity(this.inventory.itemMap.get(slot2));
                    this.selectedSlot = slot1;
                }
            }

            // Swap the inventory items.
            this.inventory.swapInventorySlots(slot1, slot2);
        }
    }

    doInventoryNext() {
        if(this.inventory) {
            this.selectedSlot = this.selectedSlot === this.inventory.maxSlots - 1 ? 0 : this.selectedSlot + 1;
            this.setSelectedEntity(this.inventory.itemMap.get(this.selectedSlot));
        }
    }

    doInventoryPrevious() {
        if(this.inventory) {
            this.selectedSlot = this.selectedSlot === 0 ? this.inventory.maxSlots - 1 : this.selectedSlot - 1;
            this.setSelectedEntity(this.inventory.itemMap.get(this.selectedSlot));
        }
    }

    doSelectEntityInventory(slot) {
        if(this.inventory) {
            let item = this.inventory.itemMap.get(slot);
            if(item) {
                this.selectedSlot = slot;
                this.setSelectedEntity(item);
            }
        }
    }

    doSelectEntityScreen(x, y) {
        this.setSelectedEntity(this.screen.getHighestVisibleEntity(x, y));
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

    // eslint-disable-next-line no-unused-vars
    canConsume(entity) {
        // By default, any entity can consume any item.
        return true;
    }

    canTakeDamageFrom(entity) {
        // If this entity is a player and the root entity doing the damage is a player,
        // only allow damage if we are in a pvp screen. Otherwise, damage is always allowed.
        return this.screen.pvpStatus === "pvp" || !this.isPlayer || !this.getRootEntity(entity).isPlayer;
    }

    canBeDamaged() {
        // Entities that are invincible or dead cannot take damage.
        return !this.isStatus("invincible") && !this.isStatus("dead");
    }

    getRootEntity(entity) {
        let rootEntity = entity;

        while(rootEntity.getOwner()) {
            rootEntity = rootEntity.getOwner();
        }

        return rootEntity;
    }

    clone(stackSize) {
        // By default, just create another instance with the same screen and the provided stack size.
        let clone = Entity.createInstance(Util.getClassName(this), stackSize);
        clone.setScreen(this.screen);
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

    ownServerTask(serverTask) {
        serverTask.owner = this;
        this.serverTasks.push(serverTask);
    }

    disownServerTask(serverTask) {
        serverTask.owner = undefined;
        let index = this.serverTasks.indexOf(serverTask);
        this.serverTasks.splice(index, 1);
    }

    cancelAllServerTasks() {
        // Cancels and removes all server tasks that this entity owns.
        while(this.serverTasks.length > 0) {
            let serverTask = this.serverTasks.shift();
            serverTask.isCancelled = true;
        }
    }

    ownStatusServerTask(status, serverTask) {
        // Store tasks for the same status in a map. These are handled separately from the regular server tasks.
        let statusServerTaskArray = this.statusServerTaskMap.get(status) ?? [];
        statusServerTaskArray.push(serverTask);
        this.statusServerTaskMap.set(status, statusServerTaskArray);
    }

    cancelStatusServerTasks(status) {
        let statusServerTaskArray = this.statusServerTaskMap.get(status) ?? [];
        while(statusServerTaskArray.length > 0) {
            let statusServerTask = statusServerTaskArray.shift();
            statusServerTask.isCancelled = true;
        }

        this.statusServerTaskMap.delete(status);
    }

    setScreen(screen) {
        this.screen = screen;
        this.mapName = screen.map.name;
        this.screenName = screen.name;
    }

    addStatus(status) {
        // A status can only appear in the array once.
        if(!this.statuses.includes(status)) {
            this.statuses.push(status);
        }
    }

    removeStatus(status) {
        let index = this.statuses.indexOf(status);
        if(index !== -1) {
            this.statuses.splice(index, 1);
        }

        // When a status is removed, all similar tasks must be cancelled.
        this.cancelStatusServerTasks(status);
    }

    isStatus(status) {
        return this.statuses.includes(status);
    }

    getOwner() {
        return Entity.getEntity(this.owner_uid);
    }

    setOwner(owner) {
        this.owner_uid = owner?.uid;
    }

    getSelectedEntity() {
        return Entity.getEntity(this.selectedEntity_uid);
    }

    setSelectedEntity(selectedEntity) {
        this.selectedEntity_uid = selectedEntity?.uid;
    }

    getLastPlayer() {
        return Entity.getEntity(this.lastPlayer_uid);
    }

    setLastPlayer(lastPlayer) {
        this.lastPlayer_uid = lastPlayer?.uid;
    }

    serialize(writer) {
        writer.beginObject()
            .serialize("!V!", 1)
            .serialize("uid", this.uid)
            .serialize("className", Util.getClassName(this))
            .serialize("isSpawned", this.isSpawned)
            .serialize("isPlayer", this.isPlayer)
            .serialize("owner_uid", this.owner_uid)
            .serialize("health", this.health)
            .serialize("maxHealth", this.maxHealth)
            .serialize("mana", this.mana)
            .serialize("maxMana", this.maxMana)
            .serializeArray("statuses", this.statuses)
            .serialize("mapName", this.mapName)
            .serialize("screenName", this.screenName)
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
            .serialize("selectedEntity_uid", this.selectedEntity_uid)
            .serialize("selectedSlot", this.selectedSlot)
            .serializeMap("delayMap", this.delayMap)
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
            .serialize("healthRegen", this.healthRegen)
            .serialize("manaRegen", this.manaRegen)
            .serialize("inventory", this.inventory)
            .serialize("purse", this.purse)
            .serialize("progress", this.progress)
            .serialize("ai", this.ai)
            .serialize("range", this.range)
            .serialize("damage", this.damage)
            .serialize("isMulti", this.isMulti)
            .serialize("spawnTime", this.spawnTime)
            .serialize("entityCount", this.entityCount)
            .serialize("maxEntityCount", this.maxEntityCount)
            .serializeMap("aggroMap", this.aggroMap)
            .serialize("maxAggro", this.maxAggro)
            .serialize("aggroGain", this.aggroGain)
            .serialize("aggroForgiveness", this.aggroForgiveness)
            .serialize("aggroForgivenessTime", this.aggroForgivenessTime)
            .serialize("lastPlayer_uid", this.lastPlayer_uid)
            .serialize("destinationMapName", this.destinationMapName)
            .serialize("destinationScreenName", this.destinationScreenName)
            .serialize("destinationX", this.destinationX)
            .serialize("destinationY", this.destinationY)
            .serialize("infoText", this.infoText)
        .endObject();
    }

    static deserialize(reader) {
        let entity;
        reader.beginObject();

        let version = reader.deserialize("!V!", "String");
        if(version === "1") {
            let uid = reader.deserialize("uid", "Number");

            let className = reader.deserialize("className", "String");
            entity = Reflection.createInstance(className, uid);
            entity.isSpawned = reader.deserialize("isSpawned", "Boolean");
            entity.isPlayer = reader.deserialize("isPlayer", "Boolean");
            entity.owner_uid = reader.deserialize("owner_uid", "Number");
            entity.health = reader.deserialize("health", "Number");
            entity.maxHealth = reader.deserialize("maxHealth", "Number");
            entity.mana = reader.deserialize("mana", "Number");
            entity.maxMana = reader.deserialize("maxMana", "Number");
            entity.statuses = reader.deserializeArray("statuses", "String");
            entity.mapName = reader.deserialize("mapName", "String");
            entity.screenName = reader.deserialize("screenName", "String");
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
            entity.selectedEntity_uid = reader.deserialize("selectedEntity_uid", "Number");
            entity.selectedSlot = reader.deserialize("selectedSlot", "Number");
            entity.delayMap = reader.deserializeMap("delayMap", "String", "Boolean");
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
            entity.healthRegen = reader.deserialize("healthRegen", "Number");
            entity.manaRegen = reader.deserialize("manaRegen", "Number");
            entity.inventory = reader.deserialize("inventory", "Inventory");
            entity.purse = reader.deserialize("purse", "Purse");
            entity.progress = reader.deserialize("progress", "Progress");
            entity.ai = reader.deserialize("ai", "AI");
            entity.range = reader.deserialize("range", "Number");
            entity.damage = reader.deserialize("damage", "Number");
            entity.isMulti = reader.deserialize("isMulti", "Boolean");
            entity.spawnTime = reader.deserialize("spawnTime", "Number");
            entity.entityCount = reader.deserialize("entityCount", "Number");
            entity.maxEntityCount = reader.deserialize("maxEntityCount", "Number");
            entity.aggroMap = reader.deserializeMap("aggroMap", "Number", "Number");
            entity.maxAggro = reader.deserialize("maxAggro", "Number");
            entity.aggroGain = reader.deserialize("aggroGain", "Number");
            entity.aggroForgiveness = reader.deserialize("aggroForgiveness", "Number");
            entity.aggroForgivenessTime = reader.deserialize("aggroForgivenessTime", "Number");
            entity.lastPlayer_uid = reader.deserialize("lastPlayer_uid", "Number");
            entity.destinationMapName = reader.deserialize("destinationMapName", "String");
            entity.destinationScreenName = reader.deserialize("destinationScreenName", "String");
            entity.destinationX = reader.deserialize("destinationX", "Number");
            entity.destinationY = reader.deserialize("destinationY", "Number");
            entity.infoText = reader.deserialize("infoText", "String");
        }
        else {
            throw(new Error("Unknown version number: " + version));
        }

        reader.endObject();
        return entity;
    }
}

module.exports = Entity;