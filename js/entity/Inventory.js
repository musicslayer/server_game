const { createCanvas, Image } = require("canvas")

class Inventory {
    maxSlots = 45;

    currentSlot;
    itemDataArray = []; // {item, id, count}

    constructor() {
        // Prefill inventory to make logic easier.
        for(let index = 0; index < this.maxSlots; index++) {
            this.itemDataArray[index] = undefined;
        }
    }

    addToInventory(entity) {
        // See if this item is already in the inventory and there is room in the stack to add it. Otherwise create a new stack.
        let numStacks = 0;

        for(let index = 0; index < this.maxSlots; index++) {
            let itemData = this.itemDataArray[index];
            if(itemData && itemData.id === entity.id) {
                if(itemData.count < itemData.item.maxStackSize) {
                    itemData.count++;
                    return true;
                }
                else {
                    numStacks++;
                }
            }
        }

        // Item is not in inventory. If we can create another stack, look for the first empty slot.
        if(numStacks < entity.maxStackNumber) {
            for(let index = 0; index < this.maxSlots; index++) {
                let itemData = this.itemDataArray[index];
                if(itemData === undefined) {
                    this.itemDataArray[index] = {
                        item: entity,
                        id: entity.id,
                        count: 1
                    }
                    return true;
                }
            }
        }

        // Inventory is full. Do not pick up item.
        return false;
    }

    removeFromInventorySlot(slot, number) {
        let itemData = this.itemDataArray[slot];
        if(itemData) {
            itemData.count -= number;
            if(itemData.count === 0) {
                this.itemDataArray[slot] = undefined;
            }
        }
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
        let itemData1 = this.itemDataArray[slot1];
        let itemData2 = this.itemDataArray[slot2];

        this.itemDataArray[slot1] = itemData2;
        this.itemDataArray[slot2] = itemData1;
    }

    getInventoryImages() {
        // Returns an array of all the images that should be drawn on this screen.
        let images = [];

        // Manually specify inventory slots.
        let xSlots = [0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1, 2, 3, 4, 5, 6, 7, 8];
        let ySlots = [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4];

        for(let itemData of this.itemDataArray) {
            let x = xSlots.shift();
            let y = ySlots.shift();

            let itemImages = itemData?.item?.getImages();
            if(itemImages) {
                for(let itemImage of itemImages) {
                    images.push({
                        x: x,
                        y: y,
                        image: itemImage.image
                    });
                }

                // For cosmetic reasons, only add the count if it is > 1
                if(itemData.count > 1) {
                    images.push({
                        x: x,
                        y: y,
                        image: this.getCountImage(itemData.count)
                    });
                }
            }
        }

        return images;
    }

    getCountImage(count) {
        let canvas = createCanvas(128, 128);
        let ctx = canvas.getContext("2d");

        ctx.font = "30px Arial";
        ctx.fillText("" + count, 0, 20);

        const buffer = canvas.toBuffer("image/png");

        let image = new Image();
        image.src = buffer;

        return image;
    }
}

module.exports = Inventory;