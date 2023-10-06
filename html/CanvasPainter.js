const ANIMATION_TIME = 4; // seconds per animation cycle
const ANIMATION_FRAMES = 8; // frames per animation cycle
const SHOW_SCREEN_GRID = true;
const SHOW_INVENTORY_GRID = true;

// TODO "IMAGE_SCALE_FACTOR" and "128" and widths of text boxes needs to be fixed!
// TODO Organize better!

class CanvasPainter {
    canvas;
    ctx;
    gameScreen;
    imageCatalog;

    constructor(canvas, gameScreen, imageCatalog) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        this.gameScreen = gameScreen;
        this.imageCatalog = imageCatalog;
    }

    setVisible(bool) {
        this.canvas.style.display = bool ? "inline" : "none";
    }

    drawScreenImageScaled(ctxBuffer, image, x, y) {
        // Draws the image on the screen but scales it based on the GameScreen.
        // Width and height before scaling is always 1.
        ctxBuffer.drawImage(image, (this.gameScreen.screenOriginX + x) * this.gameScreen.imageScaleFactor, (this.gameScreen.screenOriginY + y) * this.gameScreen.imageScaleFactor, this.gameScreen.imageScaleFactor, this.gameScreen.imageScaleFactor);
    }

    drawInventoryImageScaled(ctxBuffer, image, x, y) {
        // Draws the image on the inventory but scales it based on the GameScreen.
        // Width and height before scaling is always 1.
        ctxBuffer.drawImage(image, (this.gameScreen.inventoryOriginX + x) * this.gameScreen.imageScaleFactor, (this.gameScreen.inventoryOriginY + y) * this.gameScreen.imageScaleFactor, this.gameScreen.imageScaleFactor, this.gameScreen.imageScaleFactor);
    }

    drawPurseImageScaled(ctxBuffer, image, x, y) {
        // Draws the image on the purse but scales it based on the GameScreen.
        // Width and height before scaling is always 1.
        ctxBuffer.drawImage(image, (this.gameScreen.purseOriginX + x) * this.gameScreen.imageScaleFactor, (this.gameScreen.purseOriginY + y) * this.gameScreen.imageScaleFactor, this.gameScreen.imageScaleFactor, this.gameScreen.imageScaleFactor);
    }

    drawInfoImageScaled(ctxBuffer, image, x, y, width, height) {
        // Draws the image on the info area but scales it based on the GameScreen.
        ctxBuffer.drawImage(image, (this.gameScreen.infoOriginX + x) * this.gameScreen.imageScaleFactor, (this.gameScreen.infoOriginY + y) * this.gameScreen.imageScaleFactor, width * this.gameScreen.imageScaleFactor, height * this.gameScreen.imageScaleFactor);
    }

    drawScreenLineScaled(ctxBuffer, x1, y1, x2, y2) {
        // Draws a line on the screen but scales it based on the GameScreen.
        ctxBuffer.moveTo((this.gameScreen.screenOriginX + x1) * this.gameScreen.imageScaleFactor, (this.gameScreen.screenOriginY + y1) * this.gameScreen.imageScaleFactor);
        ctxBuffer.lineTo((this.gameScreen.screenOriginX + x2) * this.gameScreen.imageScaleFactor, (this.gameScreen.screenOriginY + y2) * this.gameScreen.imageScaleFactor);
    }

    drawInventoryLineScaled(ctxBuffer, x1, y1, x2, y2) {
        // Draws a line on the inventory but scales it based on the GameScreen.
        ctxBuffer.moveTo((this.gameScreen.inventoryOriginX + x1) * this.gameScreen.imageScaleFactor, (this.gameScreen.inventoryOriginY + y1) * this.gameScreen.imageScaleFactor);
        ctxBuffer.lineTo((this.gameScreen.inventoryOriginX + x2) * this.gameScreen.imageScaleFactor, (this.gameScreen.inventoryOriginY + y2) * this.gameScreen.imageScaleFactor);
    }

    fillRectScaled(ctxBuffer, x, y, width, height) {
        ctxBuffer.fillRect(x * this.gameScreen.imageScaleFactor, y * this.gameScreen.imageScaleFactor, width * this.gameScreen.imageScaleFactor, height * this.gameScreen.imageScaleFactor);
    }

    drawClient(time, clientData) {
        // Draw everything on a temporary canvas so that the current canvas can be updated all at once.
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
                
                this.drawScreenImageScaled(ctxBuffer, image, tile.x, tile.y);
            }
        }
        
        // Entities
        while(entities.length > 0) {
            let entity = entities.shift();
            let image = this.imageCatalog.getImageByEntityClassName(entity.className, animationFrame);
            
            let x = entity.x + entity.animationShiftX;
            let y = entity.y + entity.animationShiftY;

            this.drawScreenImageScaled(ctxBuffer, image, x, y);
            
            if(entity.stackSize !== 1) {
                let stackSizeImage = this.getStackSizeImage(entity.stackSize);
                this.drawScreenImageScaled(ctxBuffer, stackSizeImage, x, y);
            }
            
            if(entity.healthFraction !== undefined) {
                let healthBarImage = this.getHealthBarImage(entity.healthFraction);
                this.drawScreenImageScaled(ctxBuffer, healthBarImage, x, y);
            }
            
            if(entity.manaFraction !== undefined) {
                let manaBarImage = this.getManaBarImage(entity.manaFraction);
                this.drawScreenImageScaled(ctxBuffer, manaBarImage, x, y);
            }
            
            if(entity.experienceFraction !== undefined) {
                let experienceBarImage = this.getExperienceBarImage(entity.experienceFraction)
                this.drawScreenImageScaled(ctxBuffer, experienceBarImage, x, y);
            }
            
            if(entity.level !== undefined) {
                let levelImage = this.getLevelImage(entity.level)
                this.drawScreenImageScaled(ctxBuffer, levelImage, x, y);
            }
            
            if(entity.statuses.includes("dead") || entity.statuses.includes("invincible")) {
                let haloImage = this.imageCatalog.getImageByStatusName("invincible", animationFrame);
                this.drawScreenImageScaled(ctxBuffer, haloImage, x, y);
            }
        }

        // Screen Dividers
        this.fillRectScaled(ctxBuffer, this.gameScreen.screenTilesX, 0, 1, this.gameScreen.screenTilesY);
        this.fillRectScaled(ctxBuffer, this.gameScreen.screenTilesX + 1, 6, 9, 1);
        
        // Inventory
        let inventoryImages = this.getInventoryImages(inventory.items, animationFrame);
        while(inventoryImages.length > 0) {
            let inventoryImage = inventoryImages.shift();
            this.drawInventoryImageScaled(ctxBuffer, inventoryImage.image, inventoryImage.x, inventoryImage.y);
        }
        
        this.drawInventoryCursor(ctxBuffer, inventory.currentSlot);
        
        // Purse
        let purseImage = this.imageCatalog.getImageByEntityClassName("Gold", animationFrame);
        let goldTotalImage = this.getGoldTotalImage(purse.goldTotal);
        this.drawPurseImageScaled(ctxBuffer, purseImage, 0, 0);
        this.drawPurseImageScaled(ctxBuffer, goldTotalImage, 1, 0);
        
        // Info
        if(info.className !== "Undefined") {
            let infoWidth = 6;
            let infoImage = this.imageCatalog.getImageByEntityClassName(info.className, animationFrame);
            let infoNameImage = this.getInfoNameImage(info.name);
            let infoTextImage = this.getInfoTextImage(info.text);

            this.drawInfoImageScaled(ctxBuffer, infoImage, 0, 0, 1, 1);
            this.drawInfoImageScaled(ctxBuffer, infoNameImage, 1, 0, infoWidth, 1);
            this.drawInfoImageScaled(ctxBuffer, infoTextImage, 1, 0, infoWidth, 1);
        }
        
        ctxBuffer.stroke();
    }
    
    drawScreenGrid(ctxBuffer) {
        ctxBuffer.beginPath();

        for(let x = 0; x < this.gameScreen.screenTilesX + 1; x++) {
            this.drawScreenLineScaled(ctxBuffer, x, 0, x, this.gameScreen.screenTilesY);
        }

        for(let y = 0; y < this.gameScreen.screenTilesY + 1; y++) {
            this.drawScreenLineScaled(ctxBuffer, 0, y, this.gameScreen.screenTilesX, y);
        }

        ctxBuffer.stroke();
    }
    
    drawInventoryGrid(ctxBuffer) {
        ctxBuffer.beginPath();

        for(let x = 0; x < this.gameScreen.inventoryTilesX + 1; x++) {
            this.drawInventoryLineScaled(ctxBuffer, x, 0, x, this.gameScreen.inventoryTilesY);
        }

        for(let y = 0; y < this.gameScreen.inventoryTilesY + 1; y++) {
            this.drawInventoryLineScaled(ctxBuffer, 0, y, this.gameScreen.inventoryTilesX, y);
        }

        ctxBuffer.stroke();
    }
    
    // TODO Everything below this line.
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