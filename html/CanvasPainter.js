const ANIMATION_TIME = 4; // seconds per animation cycle
const ANIMATION_FRAMES = 8; // frames per animation cycle
const NUM_TILES_X = 16;
const NUM_TILES_Y = 12;
const SIDE_PANEL_TILES = 10;
const IMAGE_SCALE_FACTOR = 64;

const canvas_width = (NUM_TILES_X + SIDE_PANEL_TILES) * IMAGE_SCALE_FACTOR;
const canvas_height = NUM_TILES_Y * IMAGE_SCALE_FACTOR;
const canvas_showGrid = true;

class CanvasPainter {
    canvas;
    ctx;

    constructor(canvas, imageCatalog) {
        this.canvas = canvas;
        this.canvas.width = canvas_width;
        this.canvas.height = canvas_height;

        this.imageCatalog = imageCatalog;

        this.ctx = this.canvas.getContext("2d");
    }

    setVisible(bool) {
        canvas.style.display = bool ? "inline" : "none";
    }

    drawClient(time, clientData) {
        let canvasBuffer = document.createElement("canvas");
        canvasBuffer.width = this.canvas.width;
        canvasBuffer.height = this.canvas.height;
        
        let ctxBuffer = canvasBuffer.getContext("2d");
        
        if(canvas_showGrid) {
            this.drawScreenGrid(ctxBuffer);
            this.drawInventoryGrid(ctxBuffer);
        }
        
        let animationFrame = Math.floor(ANIMATION_FRAMES * time / (1000 * ANIMATION_TIME)) % ANIMATION_FRAMES;
        this.drawScreen(ctxBuffer, animationFrame, clientData.tiles, clientData.entities, clientData.inventory, clientData.purse, clientData.info);
        
        // Clear current screen and draw new screen quickly to prevent flickering.
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(canvasBuffer, 0, 0);
    }

    drawScreen(ctxBuffer, animationFrame, tiles, entities, inventory, purse, info) {
        // Only draw the screen where the player is located at.
        ctxBuffer.beginPath();

        // Tiles
        while(tiles.length > 0) {
            let tile = tiles.shift();
            
            while(tile.names.length > 0) {
                let name = tile.names.shift();
                let image = this.imageCatalog.getImageByTileName(name, animationFrame);
                
                ctxBuffer.drawImage(image, tile.x * IMAGE_SCALE_FACTOR, tile.y * IMAGE_SCALE_FACTOR, IMAGE_SCALE_FACTOR, IMAGE_SCALE_FACTOR);
            }
        }
        
        // Entities
        while(entities.length > 0) {
            let entity = entities.shift();
            let image = this.imageCatalog.getImageByEntityClassName(entity.className, animationFrame);
            
            let x = entity.x + entity.animationShiftX;
            let y = entity.y + entity.animationShiftY;
            
            ctxBuffer.drawImage(image, x * IMAGE_SCALE_FACTOR, y * IMAGE_SCALE_FACTOR, IMAGE_SCALE_FACTOR, IMAGE_SCALE_FACTOR);
            
            if(entity.stackSize !== 1) {
                ctxBuffer.drawImage(this.getStackSizeImage(entity.stackSize), x * IMAGE_SCALE_FACTOR, y * IMAGE_SCALE_FACTOR, IMAGE_SCALE_FACTOR, IMAGE_SCALE_FACTOR);
            }
            
            if(isValid(entity.healthFraction)) {
                ctxBuffer.drawImage(this.getHealthBarImage(entity.healthFraction), x * IMAGE_SCALE_FACTOR, y * IMAGE_SCALE_FACTOR, IMAGE_SCALE_FACTOR, IMAGE_SCALE_FACTOR);
            }
            
            if(isValid(entity.manaFraction)) {
                ctxBuffer.drawImage(this.getManaBarImage(entity.manaFraction), x * IMAGE_SCALE_FACTOR, y * IMAGE_SCALE_FACTOR, IMAGE_SCALE_FACTOR, IMAGE_SCALE_FACTOR);
            }
            
            if(isValid(entity.experienceFraction)) {
                ctxBuffer.drawImage(this.getExperienceBarImage(entity.experienceFraction), x * IMAGE_SCALE_FACTOR, y * IMAGE_SCALE_FACTOR, IMAGE_SCALE_FACTOR, IMAGE_SCALE_FACTOR);
            }
            
            if(isValid(entity.level)) {
                ctxBuffer.drawImage(this.getLevelImage(entity.level), x * IMAGE_SCALE_FACTOR, y * IMAGE_SCALE_FACTOR, IMAGE_SCALE_FACTOR, IMAGE_SCALE_FACTOR);
            }
            
            if(entity.statuses.includes("dead") || entity.statuses.includes("invincible")) {
                let haloImage = this.imageCatalog.getImageByStatusName("invincible", animationFrame);
                ctxBuffer.drawImage(haloImage, x * IMAGE_SCALE_FACTOR, y * IMAGE_SCALE_FACTOR, IMAGE_SCALE_FACTOR, IMAGE_SCALE_FACTOR);
            }
        }

        // Screen Dividers
        ctxBuffer.fillRect(NUM_TILES_X * IMAGE_SCALE_FACTOR, 0, IMAGE_SCALE_FACTOR, NUM_TILES_Y * IMAGE_SCALE_FACTOR);
        ctxBuffer.fillRect((NUM_TILES_X + 1) * IMAGE_SCALE_FACTOR, 6 * IMAGE_SCALE_FACTOR, 9 * IMAGE_SCALE_FACTOR, IMAGE_SCALE_FACTOR);
        
        // Inventory
        let originInventoryX = 17;
        let originInventoryY = 7;
        let inventoryImages = this.getInventoryImages(inventory.items, animationFrame);
        while(inventoryImages.length > 0) {
            let inventoryImage = inventoryImages.shift();
            ctxBuffer.drawImage(inventoryImage.image, (originInventoryX + inventoryImage.x) * IMAGE_SCALE_FACTOR, (originInventoryY + inventoryImage.y) * IMAGE_SCALE_FACTOR, IMAGE_SCALE_FACTOR, IMAGE_SCALE_FACTOR);
        }
        
        this.drawInventoryCursor(ctxBuffer, inventory.currentSlot);
        
        // Purse
        let originPurseX = 17;
        let originPurseY = 0;
        let purseImage = this.imageCatalog.getImageByEntityClassName("Gold", animationFrame);
        ctxBuffer.drawImage(purseImage, originPurseX * IMAGE_SCALE_FACTOR, originPurseY * IMAGE_SCALE_FACTOR, IMAGE_SCALE_FACTOR, IMAGE_SCALE_FACTOR);
        ctxBuffer.drawImage(this.getGoldTotalImage(purse.goldTotal), (originPurseX + 1) * IMAGE_SCALE_FACTOR, originPurseY * IMAGE_SCALE_FACTOR, IMAGE_SCALE_FACTOR, IMAGE_SCALE_FACTOR);
        
        // Info
        if(info.className !== "Undefined") {
            let W = IMAGE_SCALE_FACTOR * 6;
            let originInfoX = 17;
            let originInfoY = 1;
            let infoImage = this.imageCatalog.getImageByEntityClassName(info.className, animationFrame);
            ctxBuffer.drawImage(infoImage, originInfoX * IMAGE_SCALE_FACTOR, originInfoY * IMAGE_SCALE_FACTOR, IMAGE_SCALE_FACTOR, IMAGE_SCALE_FACTOR);
            ctxBuffer.drawImage(this.getInfoNameImage(info.name), (originInfoX + 1) * IMAGE_SCALE_FACTOR, originInfoY * IMAGE_SCALE_FACTOR, W, IMAGE_SCALE_FACTOR);
            ctxBuffer.drawImage(this.getInfoTextImage(info.text), (originInfoX + 1) * IMAGE_SCALE_FACTOR, originInfoY * IMAGE_SCALE_FACTOR, W, IMAGE_SCALE_FACTOR);
        }
        
        ctxBuffer.stroke();
    }
    
    drawScreenGrid(ctxBuffer) {
        ctxBuffer.beginPath();

        for(let x = 0; x < NUM_TILES_X + 1; x++) {
            ctxBuffer.moveTo(x * IMAGE_SCALE_FACTOR, 0);
            ctxBuffer.lineTo(x * IMAGE_SCALE_FACTOR, NUM_TILES_Y * IMAGE_SCALE_FACTOR);
        }

        for(let y = 0; y < NUM_TILES_Y + 1; y++) {
            ctxBuffer.moveTo(0, y * IMAGE_SCALE_FACTOR);
            ctxBuffer.lineTo(NUM_TILES_X * IMAGE_SCALE_FACTOR, y * IMAGE_SCALE_FACTOR);
        }

        ctxBuffer.stroke();
    }
    
    drawInventoryGrid(ctxBuffer) {
        ctxBuffer.beginPath();

        for(let x = NUM_TILES_X + 1; x < NUM_TILES_X + SIDE_PANEL_TILES + 1; x++) {
            ctxBuffer.moveTo(x * IMAGE_SCALE_FACTOR, 7 * IMAGE_SCALE_FACTOR);
            ctxBuffer.lineTo(x * IMAGE_SCALE_FACTOR, NUM_TILES_Y * IMAGE_SCALE_FACTOR);
        }

        for(let y = 7; y < NUM_TILES_Y + 1; y++) {
            ctxBuffer.moveTo((NUM_TILES_X + 1) * IMAGE_SCALE_FACTOR, y * IMAGE_SCALE_FACTOR);
            ctxBuffer.lineTo((NUM_TILES_X + SIDE_PANEL_TILES) * IMAGE_SCALE_FACTOR, y * IMAGE_SCALE_FACTOR);
        }

        ctxBuffer.stroke();
    }
    
    drawInventoryCursor(ctxBuffer, currentSlot) {
        if(currentSlot !== undefined) {
            let xy = slot2XY(currentSlot);

            ctxBuffer.beginPath();
            
            ctxBuffer.lineWidth = "3";
            ctxBuffer.strokeStyle = "red";

            ctxBuffer.rect(xy[0], xy[1], IMAGE_SCALE_FACTOR, IMAGE_SCALE_FACTOR);
            ctxBuffer.stroke();

            ctxBuffer.lineWidth = "1";
            ctxBuffer.strokeStyle = "black";
            
            ctxBuffer.stroke();
        }
    }
    
    getStackSizeImage(stackSize) {
        let canvasTemp = document.createElement("canvas");
        canvasTemp.width = 128;
        canvasTemp.height = 128;
        
        let ctxTemp = canvasTemp.getContext("2d");
        ctxTemp.font = "30px Arial";
        ctxTemp.fillText("" + stackSize, 0, 20);
        
        return canvasTemp;
    }
    
    getHealthBarImage(healthFraction) {
        let canvasTemp = document.createElement("canvas");
        canvasTemp.width = 128;
        canvasTemp.height = 128;
        
        let ctxTemp = canvasTemp.getContext("2d");
        ctxTemp.fillStyle = "#222222";
        ctxTemp.fillRect(20, 0, 88, 20);
        ctxTemp.fillStyle = "#ff0000";
        ctxTemp.fillRect(20, 0, 88 * healthFraction, 20);
        
        return canvasTemp;
    }
    
    getManaBarImage(manaFraction) {
        let canvasTemp = document.createElement("canvas");
        canvasTemp.width = 128;
        canvasTemp.height = 128;
        
        let ctxTemp = canvasTemp.getContext("2d");
        ctxTemp.fillStyle = "#222222";
        ctxTemp.fillRect(20, 20, 88, 20);
        ctxTemp.fillStyle = "#0000ff";
        ctxTemp.fillRect(20, 20, 88 * manaFraction, 20);
        
        return canvasTemp;
    }
    
    getExperienceBarImage(experienceFraction) {
        let canvasTemp = document.createElement("canvas");
        canvasTemp.width = 128;
        canvasTemp.height = 128;
        
        let ctxTemp = canvasTemp.getContext("2d");
        ctxTemp.fillStyle = "#222222";
        ctxTemp.fillRect(20, 40, 88, 20);
        ctxTemp.fillStyle = "#00ff00";
        ctxTemp.fillRect(20, 40, 88 * experienceFraction, 20);
        
        return canvasTemp;
    }
    
    getLevelImage(level) {
        let canvasTemp = document.createElement("canvas");
        canvasTemp.width = 128;
        canvasTemp.height = 128;
        
        let ctxTemp = canvasTemp.getContext("2d");
        ctxTemp.font = "30px Arial";
        ctxTemp.fillText("Level: " + level, 20, 80);
        
        return canvasTemp;
    }
    
    getGoldTotalImage(goldTotal) {
        let canvasTemp = document.createElement("canvas");
        canvasTemp.width = 128;
        canvasTemp.height = 128;

        let ctxTemp = canvasTemp.getContext("2d");
        ctxTemp.font = "30px Arial";
        ctxTemp.fillText("Gold: " + goldTotal, 0, 70);
        
        return canvasTemp;
    }
    
    getInfoNameImage(text) {
        let canvasTemp = document.createElement("canvas");
        canvasTemp.width = 128 * 6;
        canvasTemp.height = 128;

        let ctxTemp = canvasTemp.getContext("2d");
        ctxTemp.font = "30px Arial";
        ctxTemp.fillText(text, 0, 50);
        
        return canvasTemp;
    }
    
    getInfoTextImage(text) {
        let canvasTemp = document.createElement("canvas");
        canvasTemp.width = 128 * 6;
        canvasTemp.height = 128;

        let ctxTemp = canvasTemp.getContext("2d");
        ctxTemp.font = "30px Arial";
        ctxTemp.fillText(text, 0, 90);
        
        return canvasTemp;
    }
    
    getInventoryImages(items, animationFrame) {
        // Returns an array of all the images that should be drawn on this screen.
        let images = [];

        // Manually specify inventory slots.
        let xSlots = [0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1, 2, 3, 4, 5, 6, 7, 8];
        let ySlots = [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4];

        for(let item of items) {
            let x = xSlots.shift();
            let y = ySlots.shift();
            
            if(item) {
                let itemImage = this.imageCatalog.getImageByEntityClassName(item.className, animationFrame);
                images.push({
                    x: x,
                    y: y,
                    image: itemImage
                });

                // For cosmetic reasons, only add the stackSize if it is not 1
                if(item.stackSize !== 1) {
                    images.push({
                        x: x,
                        y: y,
                        image: this.getStackSizeImage(item.stackSize)
                    });
                }
            }
        }

        return images;
    }
}

function isValid(n) {
    return n !== undefined && n !== NaN && n !== null;
}

function slot2XY(slot) {
    let originX = 17;
    let originY = 7;

    let nx = slot % 9;
    let ny = Math.floor(slot / 9);

    let x = (originX + nx) * IMAGE_SCALE_FACTOR;
    let y = (originY + ny) * IMAGE_SCALE_FACTOR;

    return [x, y];
}

export { CanvasPainter };