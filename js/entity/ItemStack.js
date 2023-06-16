const { createCanvas, Image } = require("canvas")

const Entity = require("./Entity.js");

class ItemStack extends Entity {
    id = "item_stack";
    item;
    stackSize;

    constructor(item, stackSize) {
        super();
        this.item = item;
        this.stackSize = stackSize;
    }

    doSpawn(world, map, screen, x, y) {
        super.doSpawn(world, map, screen, x, y);

        // We don't actually spawn the item, but we want to initialize some of its variables.
        // This is needed so we can use the item's images later when making the stack's images.
        this.item.homeWorld = world;
        this.item.homeMap = map;
        this.item.homeScreen = screen;
        this.item.homeX = x;
        this.item.homeY = y;

        this.item.world = world;
        this.item.map = map;
        this.item.screen = screen;
        this.item.x = x;
        this.item.y = y;
    }

    getImages() {
        let images = this.item.getImages();

        images.push({
            x: this.x + this.animationShiftX,
            y: this.y + this.animationShiftY,
            image: this.getItemCountImage()
        });

        return images;
    }

    getItemCountImage() {
        let canvas = createCanvas(128, 128);
        let ctx = canvas.getContext("2d");

        ctx.font = "30px Arial";
        ctx.fillText("" + this.stackSize, 0, 20);

        const buffer = canvas.toBuffer("image/png");

        let image = new Image();
        image.src = buffer;

        return image;
    }

    doInteract(entity) {
        // The item will be collected as many times as possible from the stack.
        if(entity.inventory) {
            while(this.stackSize > 0) {
                let success = entity.doAddToInventory(this.item);
                if(success) {
                    this.stackSize--;
                }
                else {
                    break;
                }
            }

            if(this.stackSize === 0) {
                this.doDespawn();
            }
        }
    }
}

module.exports = ItemStack;