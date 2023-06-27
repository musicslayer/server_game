const EntityFactory = require("./EntityFactory.js");

class Inventory {
    maxSlots = 45;
    itemMap = new Map();

    owner;

    constructor(owner) {
        this.owner = owner;

        // Prefill inventory with undefined so that 0 -> maxSlots count as having values in the map.
        for(let index = 0; index < this.maxSlots; index++) {
            this.itemMap.set(index, undefined)
        }
    }

    numItems() {
        // Returns the number of actual items (i.e. not undefined) in the item map.
        let num = 0;

        for(let index = 0; index < this.maxSlots; index++) {
            let item = this.itemMap.get(index);
            if(item) {
                num++;
            }
        }

        return num;
    }

    addToInventory(entity) {
        let numStacks = 0;

        // See if this item is already in the inventory and there is room in the stack to add it.
        for(let index = 0; index < this.maxSlots && entity.stackSize > 0; index++) {
            let item = this.itemMap.get(index);
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
            let item = this.itemMap.get(index);
            if(!item) {
                numStacks++;

                let N = Math.min(entity.maxStackSize, entity.stackSize);
                
                entity.stackSize -= N;
                let item = EntityFactory.cloneInstance(entity, N);

                this.itemMap.set(index, item);
                this.owner.getWorldCounter().register("inventory", 1);
            }
        }
    }

    removeFromInventorySlot(slot, number) {
        let item = this.itemMap.get(slot);
        if(item) {
            item.stackSize -= number;
            if(item.stackSize === 0) {
                this.itemMap.set(slot, undefined);
                this.owner.getWorldCounter().deregister("inventory", 1);
            }
        }
    }

    swapInventorySlots(slot1, slot2) {
        if(this.itemMap.has(slot1) && this.itemMap.has(slot2)) {
            let item1 = this.itemMap.get(slot1);
            let item2 = this.itemMap.get(slot2);

            this.itemMap.set(slot1, item2);
            this.itemMap.set(slot2, item1);
        }
    }
}

module.exports = Inventory;