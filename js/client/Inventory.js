const { createCanvas, Image } = require("canvas")

class Inventory {
    // TODO For now, just say each max stack is 20 for every item.
    maxStackSize = 20;
    maxSlots = 45;

    currentSlot;
    itemDataArray = []; // {item, id, count}

    addToInventory(entity) {
        // TODO If inventory is full, do not pick up item.
        // TODO Should there be a key to pick up item?

        // See if this item is already in the inventory and there is room in the stack to add it. Otherwise create a new stack.
        let index = 0;

        for(let itemData of this.itemDataArray) {
            // TODO We should only use the undefined slot if the item doesn't already exist anywhere in the inventory.
            if(itemData === undefined) {
                this.itemDataArray[index] = {
                    item: entity,
                    id: entity.id,
                    count: 1
                }
                return;
            }

            if(itemData.id === entity.id && itemData.count < this.maxStackSize) {
                itemData.count++;
                return;
            }

            index++;
        }

        this.itemDataArray.push({
            item: entity,
            id: entity.id,
            count: 1
        });
    }

    removeFromInventory(entity) {
        // Note that this only removes the item. The caller is responsible for calling "consume" and actually using the item.
        let index = 0;

        for(let itemData of this.itemDataArray) {
            if(itemData.id === entity.id) {
                itemData.count--;
                if(itemData.count === 0) {
                    // Remove this item without shifting anything else.
                    //this.itemDataArray.splice(index, 1);

                    this.itemDataArray[index] = undefined;
                }
                
                return;
            }

            index++;
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