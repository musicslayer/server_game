import { ImageCatalog } from "./ImageCatalog.js";

const ANIMATION_TIME = 4; // seconds per animation cycle
const ANIMATION_FRAMES = 8; // frames per animation cycle
const SHOW_SCREEN_GRID = true;
const SHOW_INVENTORY_GRID = true;

// TODO "IMAGE_SCALE_FACTOR" and "128" and widths of text boxes needs to be fixed!
// TODO Organize better.
// TODO Where should ImageCatalog be constructed?

class CanvasPainter {
    canvas;
    ctx;
    gameScreen;
    imageCatalog;

    constructor(canvas, gameScreen) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        this.gameScreen = gameScreen;
    }

    async createImageCatalog() {
        this.imageCatalog = new ImageCatalog();
        await this.imageCatalog.createImageCatalog();
    }

    setVisible(bool) {
        this.canvas.style.display = bool ? "inline" : "none";
    }

    drawClient(time, clientData) {
        let canvasBuffer = document.createElement("canvas");
        canvasBuffer.width = this.canvas.width;
        canvasBuffer.height = this.canvas.height;
        
        let ctxBuffer = canvasBuffer.getContext("2d");
        
        if(SHOW_SCREEN_GRID) {
            this.drawScreenGrid(ctxBuffer);
        }
        if(SHOW_INVENTORY_GRID) {
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
                
                ctxBuffer.drawImage(image, tile.x * this.gameScreen.imageScaleFactor, tile.y * this.gameScreen.imageScaleFactor, this.gameScreen.imageScaleFactor, this.gameScreen.imageScaleFactor);
            }
        }
        
        // Entities
        while(entities.length > 0) {
            let entity = entities.shift();
            let image = this.imageCatalog.getImageByEntityClassName(entity.className, animationFrame);
            
            let x = entity.x + entity.animationShiftX;
            let y = entity.y + entity.animationShiftY;
            
            ctxBuffer.drawImage(image, x * this.gameScreen.imageScaleFactor, y * this.gameScreen.imageScaleFactor, this.gameScreen.imageScaleFactor, this.gameScreen.imageScaleFactor);
            
            if(entity.stackSize !== 1) {
                ctxBuffer.drawImage(this.getStackSizeImage(entity.stackSize), x * this.gameScreen.imageScaleFactor, y * this.gameScreen.imageScaleFactor, this.gameScreen.imageScaleFactor, this.gameScreen.imageScaleFactor);
            }
            
            if(entity.healthFraction !== undefined) {
                ctxBuffer.drawImage(this.getHealthBarImage(entity.healthFraction), x * this.gameScreen.imageScaleFactor, y * this.gameScreen.imageScaleFactor, this.gameScreen.imageScaleFactor, this.gameScreen.imageScaleFactor);
            }
            
            if(entity.manaFraction !== undefined) {
                ctxBuffer.drawImage(this.getManaBarImage(entity.manaFraction), x * this.gameScreen.imageScaleFactor, y * this.gameScreen.imageScaleFactor, this.gameScreen.imageScaleFactor, this.gameScreen.imageScaleFactor);
            }
            
            if(entity.experienceFraction !== undefined) {
                ctxBuffer.drawImage(this.getExperienceBarImage(entity.experienceFraction), x * this.gameScreen.imageScaleFactor, y * this.gameScreen.imageScaleFactor, this.gameScreen.imageScaleFactor, this.gameScreen.imageScaleFactor);
            }
            
            if(entity.level !== undefined) {
                ctxBuffer.drawImage(this.getLevelImage(entity.level), x * this.gameScreen.imageScaleFactor, y * this.gameScreen.imageScaleFactor, this.gameScreen.imageScaleFactor, this.gameScreen.imageScaleFactor);
            }
            
            if(entity.statuses.includes("dead") || entity.statuses.includes("invincible")) {
                let haloImage = this.imageCatalog.getImageByStatusName("invincible", animationFrame);
                ctxBuffer.drawImage(haloImage, x * this.gameScreen.imageScaleFactor, y * this.gameScreen.imageScaleFactor, this.gameScreen.imageScaleFactor, this.gameScreen.imageScaleFactor);
            }
        }

        // Screen Dividers
        ctxBuffer.fillRect(this.gameScreen.screenTilesX * this.gameScreen.imageScaleFactor, 0, this.gameScreen.imageScaleFactor, this.gameScreen.screenTilesY * this.gameScreen.imageScaleFactor);
        ctxBuffer.fillRect((this.gameScreen.screenTilesX + 1) * this.gameScreen.imageScaleFactor, 6 * this.gameScreen.imageScaleFactor, 9 * this.gameScreen.imageScaleFactor, this.gameScreen.imageScaleFactor);
        
        // Inventory
        let inventoryImages = this.getInventoryImages(inventory.items, animationFrame);
        while(inventoryImages.length > 0) {
            let inventoryImage = inventoryImages.shift();
            ctxBuffer.drawImage(inventoryImage.image, (this.gameScreen.inventoryOriginX + inventoryImage.x) * this.gameScreen.imageScaleFactor, (this.gameScreen.inventoryOriginY + inventoryImage.y) * this.gameScreen.imageScaleFactor, this.gameScreen.imageScaleFactor, this.gameScreen.imageScaleFactor);
        }
        
        this.drawInventoryCursor(ctxBuffer, inventory.currentSlot);
        
        // Purse
        let purseImage = this.imageCatalog.getImageByEntityClassName("Gold", animationFrame);
        ctxBuffer.drawImage(purseImage, this.gameScreen.purseOriginX * this.gameScreen.imageScaleFactor, this.gameScreen.purseOriginY * this.gameScreen.imageScaleFactor, this.gameScreen.imageScaleFactor, this.gameScreen.imageScaleFactor);
        ctxBuffer.drawImage(this.getGoldTotalImage(purse.goldTotal), (this.gameScreen.purseOriginX + 1) * this.gameScreen.imageScaleFactor, this.gameScreen.purseOriginY * this.gameScreen.imageScaleFactor, this.gameScreen.imageScaleFactor, this.gameScreen.imageScaleFactor);
        
        // Info
        if(info.className !== "Undefined") {
            let W = this.gameScreen.imageScaleFactor * 6;
            let originInfoX = 17;
            let originInfoY = 1;
            let infoImage = this.imageCatalog.getImageByEntityClassName(info.className, animationFrame);
            ctxBuffer.drawImage(infoImage, originInfoX * this.gameScreen.imageScaleFactor, originInfoY * this.gameScreen.imageScaleFactor, this.gameScreen.imageScaleFactor, this.gameScreen.imageScaleFactor);
            ctxBuffer.drawImage(this.getInfoNameImage(info.name), (originInfoX + 1) * this.gameScreen.imageScaleFactor, originInfoY * this.gameScreen.imageScaleFactor, W, this.gameScreen.imageScaleFactor);
            ctxBuffer.drawImage(this.getInfoTextImage(info.text), (originInfoX + 1) * this.gameScreen.imageScaleFactor, originInfoY * this.gameScreen.imageScaleFactor, W, this.gameScreen.imageScaleFactor);
        }
        
        ctxBuffer.stroke();
    }
    
    drawScreenGrid(ctxBuffer) {
        ctxBuffer.beginPath();

        for(let x = 0; x < this.gameScreen.screenTilesX + 1; x++) {
            ctxBuffer.moveTo(x * this.gameScreen.imageScaleFactor, 0);
            ctxBuffer.lineTo(x * this.gameScreen.imageScaleFactor, this.gameScreen.screenTilesY * this.gameScreen.imageScaleFactor);
        }

        for(let y = 0; y < this.gameScreen.screenTilesY + 1; y++) {
            ctxBuffer.moveTo(0, y * this.gameScreen.imageScaleFactor);
            ctxBuffer.lineTo(this.gameScreen.screenTilesX * this.gameScreen.imageScaleFactor, y * this.gameScreen.imageScaleFactor);
        }

        ctxBuffer.stroke();
    }
    
    drawInventoryGrid(ctxBuffer) {
        ctxBuffer.beginPath();

        for(let x = this.gameScreen.screenTilesX + 1; x < this.gameScreen.screenTilesX + this.gameScreen.inventoryTilesX + 1; x++) {
            ctxBuffer.moveTo(x * this.gameScreen.imageScaleFactor, 7 * this.gameScreen.imageScaleFactor);
            ctxBuffer.lineTo(x * this.gameScreen.imageScaleFactor, this.gameScreen.screenTilesY * this.gameScreen.imageScaleFactor);
        }

        for(let y = 7; y < this.gameScreen.screenTilesY + 1; y++) {
            ctxBuffer.moveTo((this.gameScreen.screenTilesX + 1) * this.gameScreen.imageScaleFactor, y * this.gameScreen.imageScaleFactor);
            ctxBuffer.lineTo((this.gameScreen.screenTilesX + this.gameScreen.inventoryTilesX) * this.gameScreen.imageScaleFactor, y * this.gameScreen.imageScaleFactor);
        }

        ctxBuffer.stroke();
    }
    
    drawInventoryCursor(ctxBuffer, currentSlot) {
        if(currentSlot !== undefined) {
            let xy = this.gameScreen.getInventoryXY(currentSlot);

            ctxBuffer.beginPath();
            
            ctxBuffer.lineWidth = "3";
            ctxBuffer.strokeStyle = "red";

            ctxBuffer.rect(xy[0], xy[1], this.gameScreen.imageScaleFactor, this.gameScreen.imageScaleFactor);
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

export { CanvasPainter };