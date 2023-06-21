const EntitySpawner = require("./EntitySpawner.js");
const Server = require("../server/Server.js");

class Inventory {
    maxSlots = 45;

    currentSlot;
    itemArray = [];

    isActive = true;

    constructor() {
        // Prefill inventory to make logic easier.
        for(let index = 0; index < this.maxSlots; index++) {
            this.itemArray[index] = undefined;
        }
    }

    turnOn() {
        this.isActive = true;
    }

    turnOff() {
        this.isActive = false;
    }

    // Return value is whether the ENTIRE entity was added to the inventory (i.e. if we need to despawn it)
    addToInventory(entity) {
        let numStacks = 0;

        // See if this item is already in the inventory and there is room in the stack to add it.
        for(let index = 0; index < this.maxSlots && entity.stackSize > 0; index++) {
            let item = this.itemArray[index];
            if(item && item.id === entity.id) {
                // Item is already in the inventory. Add as much of the entity's stack as we can to this stack.
                numStacks++;

                let N = Math.min(entity.stackSize, item.maxStackSize - item.stackSize);

                entity.stackSize -= N;
                item.stackSize += N;
            }
        }

        // There is no more room in existing stacks, so now we try to create new stacks.
        for(let index = 0; index < this.maxSlots && entity.stackSize > 0 && numStacks < entity.maxStackNumber; index++) {
            if(this.itemArray[index] === undefined) {
                numStacks++;

                let item = EntitySpawner.cloneInstance(entity, 0);
                this.itemArray[index] = item;
                Server.registerInventoryEntity(1);

                let N = Math.min(entity.maxStackSize, entity.stackSize);

                entity.stackSize -= N;
                item.stackSize += N;
            }
        }
    }

    removeFromInventorySlot(slot, number) {
        let item = this.itemArray[slot];
        if(item) {
            item.stackSize -= number;
            if(item.stackSize === 0) {
                this.itemArray[slot] = undefined;
                Server.deregisterInventoryEntity(1);
            }
        }
    }

    selectInventorySlot(slot) {
        this.currentSlot = slot;
    }

    getCurrentlySelectedItem() {
        return this.itemArray[this.currentSlot];
    }

    getItemAtSlot(slot) {
        return this.itemArray[slot];
    }

    shiftInventorySlotBackward() {
        if(this.currentSlot === undefined || this.currentSlot === 0) {
            this.currentSlot = this.maxSlots - 1;
        }
        else {
            this.currentSlot--;
        }
    }

    shiftInventorySlotForward() {
        if(this.currentSlot === undefined || this.currentSlot === this.maxSlots - 1) {
            this.currentSlot = 0;
        }
        else {
            this.currentSlot++;
        }
    }

    swapInventorySlots(slot1, slot2) {
        let item1 = this.itemArray[slot1];
        let item2 = this.itemArray[slot2];

        this.itemArray[slot1] = item2;
        this.itemArray[slot2] = item1;
    }
}

module.exports = Inventory;