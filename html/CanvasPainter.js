const ANIMATION_TIME = 4; // seconds per animation cycle
const ANIMATION_FRAMES = 8; // frames per animation cycle
const SHOW_SCREEN_GRID = true;
const SHOW_INVENTORY_GRID = true;

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

    drawLocationInfoImageScaled(ctxBuffer, image, x, y, width, height) {
        // Draws the image on the map info area but scales it based on the GameScreen.
        ctxBuffer.drawImage(image, (this.gameScreen.locationInfoOriginX + x) * this.gameScreen.imageScaleFactor, (this.gameScreen.locationInfoOriginY + y) * this.gameScreen.imageScaleFactor, width * this.gameScreen.imageScaleFactor, height * this.gameScreen.imageScaleFactor);
    }

    drawPurseImageScaled(ctxBuffer, image, x, y, width, height) {
        // Draws the image on the purse but scales it based on the GameScreen.
        // Width and height before scaling is always 1.
        ctxBuffer.drawImage(image, (this.gameScreen.purseOriginX + x) * this.gameScreen.imageScaleFactor, (this.gameScreen.purseOriginY + y) * this.gameScreen.imageScaleFactor, width * this.gameScreen.imageScaleFactor, height * this.gameScreen.imageScaleFactor);
    }

    drawEntityInfoImageScaled(ctxBuffer, image, x, y, width, height) {
        // Draws the image on the entity info area but scales it based on the GameScreen.
        ctxBuffer.drawImage(image, (this.gameScreen.entityInfoOriginX + x) * this.gameScreen.imageScaleFactor, (this.gameScreen.entityInfoOriginY + y) * this.gameScreen.imageScaleFactor, width * this.gameScreen.imageScaleFactor, height * this.gameScreen.imageScaleFactor);
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

    getFractionBarImage(x, y, fraction, color) {
        // x, y is the upper-left corner of the bar, and is a fraction between 0 and 1.
        let canvasTemp = document.createElement("canvas");
        canvasTemp.width = this.gameScreen.imageScaleFactor;
        canvasTemp.height = this.gameScreen.imageScaleFactor;
        
        let ctxTemp = canvasTemp.getContext("2d");
        ctxTemp.fillStyle = "#222222";
        ctxTemp.fillRect(x * this.gameScreen.imageScaleFactor, y * this.gameScreen.imageScaleFactor, this.gameScreen.imageScaleFactor * (1 - 2 * x), 0.15 * this.gameScreen.imageScaleFactor);
        ctxTemp.fillStyle = color;
        ctxTemp.fillRect(x * this.gameScreen.imageScaleFactor, y * this.gameScreen.imageScaleFactor, fraction * this.gameScreen.imageScaleFactor * (1 - 2 * x), 0.15 * this.gameScreen.imageScaleFactor);
        
        return canvasTemp;
    }

    getTextImage(text, x, y, width, height, color) {
        // x, y is the lower-left corner of the text baseline, and is a fraction between 0 and 1.
        let canvasTemp = document.createElement("canvas");
        canvasTemp.width = width * this.gameScreen.imageScaleFactor;
        canvasTemp.height = height * this.gameScreen.imageScaleFactor;

        // As a baseline reference, if the image scale factor is 64 then the font size is 15.
        let fontSize = 15 * (this.gameScreen.imageScaleFactor / 64);

        let ctxTemp = canvasTemp.getContext("2d");
        ctxTemp.font = fontSize + "px Arial";
        ctxTemp.fillStyle = color;
        ctxTemp.fillText(text, x * this.gameScreen.imageScaleFactor, y * this.gameScreen.imageScaleFactor, width * this.gameScreen.imageScaleFactor);
        
        return canvasTemp;
    }

    drawClient(time, clientData) {
        // Draw everything on a temporary canvas so that the current canvas can be updated all at once.
        let canvasBuffer = document.createElement("canvas");
        canvasBuffer.width = this.canvas.width;
        canvasBuffer.height = this.canvas.height;
        
        let ctxBuffer = canvasBuffer.getContext("2d");
        
        let animationFrame = Math.floor(ANIMATION_FRAMES * time / (1000 * ANIMATION_TIME)) % ANIMATION_FRAMES;
        this.drawScreen(ctxBuffer, animationFrame, clientData.tiles, clientData.entities, clientData.inventory, clientData.purse, clientData.screenInfo, clientData.locationInfo, clientData.entityInfo);
        
        // Clear current screen and draw new screen quickly to prevent flickering.
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(canvasBuffer, 0, 0);
    }

    drawScreen(ctxBuffer, animationFrame, tiles, entities, inventory, purse, screenInfo, locationInfo, entityInfo) {
        // Only draw the screen where the player is located at.
        ctxBuffer.beginPath();

        // Tiles
        while(tiles.length > 0) {
            let tile = tiles.shift();
            let image = this.imageCatalog.getImageByTileName(tile.name, animationFrame);
            this.drawScreenImageScaled(ctxBuffer, image, tile.x, tile.y);
        }

        // Draw grid over the tiles but under everything else.
        if(SHOW_SCREEN_GRID) {
            this.drawScreenGrid(ctxBuffer);
        }
        if(SHOW_INVENTORY_GRID) {
            this.drawInventoryGrid(ctxBuffer);
        }
        
        // Entities
        while(entities.length > 0) {
            let entity = entities.shift();

            if(!entity.isVisible) {
                // To show that the player is invisible we make the image partially transparent.
                // Note that other invisible players/entities will not be sent to the client to draw at all.
                ctxBuffer.globalAlpha = 0.2;
            }

            let x = entity.x + entity.animationShiftX;
            let y = entity.y + entity.animationShiftY;
            let image = this.imageCatalog.getImageByEntityImageName(entity.imageName, animationFrame);
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

            for(let status of entity.statuses) {
                let statusImage = this.imageCatalog.getImageByStatusName(status, animationFrame);
                this.drawScreenImageScaled(ctxBuffer, statusImage, x, y);
            }

            ctxBuffer.globalAlpha = 1.0;
        }

        // Screen Dividers
        this.fillRectScaled(ctxBuffer, this.gameScreen.screenTilesX, 0, 1, this.gameScreen.screenTilesY);
        this.fillRectScaled(ctxBuffer, this.gameScreen.screenTilesX + 1, 6, 9, 1);

        // Screen Border
        this.drawScreenBorder(ctxBuffer, screenInfo);
        
        // Inventory
        let inventoryImages = this.getInventoryImages(inventory.items, animationFrame);
        while(inventoryImages.length > 0) {
            let inventoryImage = inventoryImages.shift();
            this.drawInventoryImageScaled(ctxBuffer, inventoryImage.image, inventoryImage.x, inventoryImage.y);
        }
        
        if(inventory.currentSlot !== undefined) {
            this.drawInventoryCursor(ctxBuffer, inventory.currentSlot);
        }

        // Location Info
        let locationInfoWidth = this.gameScreen.locationInfoTilesX;
        let locationInfoHeight = this.gameScreen.locationInfoTilesY;
        let mapInfoTextImage = this.getMapInfoTextImage(locationInfo.mapDisplayName, locationInfoWidth, locationInfoHeight);
        let screenInfoTextImage = this.getScreenInfoTextImage(locationInfo.screenDisplayName, locationInfo.pvpStatus, locationInfoWidth, locationInfoHeight);
        this.drawLocationInfoImageScaled(ctxBuffer, mapInfoTextImage, 0, 0, locationInfoWidth, locationInfoHeight);
        this.drawLocationInfoImageScaled(ctxBuffer, screenInfoTextImage, 0, 0, locationInfoWidth, locationInfoHeight);
        
        // Purse
        let purseWidth = this.gameScreen.purseTilesX - 1;
        let purseHeight = this.gameScreen.purseTilesY;
        let purseImage = this.imageCatalog.getImageByEntityImageName("item_gold", animationFrame);
        let goldTotalImage = this.getGoldTotalImage(purse.goldTotal, purseWidth, purseHeight);
        this.drawPurseImageScaled(ctxBuffer, purseImage, 0, 0, 1, 1);
        this.drawPurseImageScaled(ctxBuffer, goldTotalImage, 1, 0, purseWidth, purseHeight);
        
        // Entity Info
        if(entityInfo.imageName !== undefined && entityInfo.name !== undefined && entityInfo.text !== undefined) {
            let entityInfoWidth = this.gameScreen.entityInfoTilesX - 1;
            let entityInfoHeight = this.gameScreen.entityInfoTilesY;
            let entityInfoImage = this.imageCatalog.getImageByEntityImageName(entityInfo.imageName, animationFrame);
            let entityInfoNameImage = this.getEntityInfoNameImage(entityInfo.name, entityInfoWidth, entityInfoHeight);
            let entityInfoTextImage = this.getEntityInfoTextImage(entityInfo.text, entityInfoWidth, entityInfoHeight);

            this.drawEntityInfoImageScaled(ctxBuffer, entityInfoImage, 0, 0, 1, 1);
            this.drawEntityInfoImageScaled(ctxBuffer, entityInfoNameImage, 1, 0, entityInfoWidth, entityInfoHeight);
            this.drawEntityInfoImageScaled(ctxBuffer, entityInfoTextImage, 1, 0, entityInfoWidth, entityInfoHeight);
        }
        
        ctxBuffer.stroke();
    }

    drawScreenBorder(ctxBuffer, screenInfo) {
        // For each edge, green means there is an accessible screen in that direction and red means there is not.
        ctxBuffer.beginPath();

        let green = "#00FF00";
        let red = "#FF0000";

        ctxBuffer.fillStyle = screenInfo.isUp ? green: red;
        this.fillRectScaled(ctxBuffer, 0, 0, this.gameScreen.screenTilesX, 0.05);
        
        ctxBuffer.fillStyle = screenInfo.isDown ? green: red;
        this.fillRectScaled(ctxBuffer, 0, this.gameScreen.screenTilesY, this.gameScreen.screenTilesX, -0.05);

        ctxBuffer.fillStyle = screenInfo.isLeft ? green: red;
        this.fillRectScaled(ctxBuffer, 0, 0, 0.05, this.gameScreen.screenTilesY);

        ctxBuffer.fillStyle = screenInfo.isRight ? green: red;
        this.fillRectScaled(ctxBuffer, this.gameScreen.screenTilesX, 0, -0.05, this.gameScreen.screenTilesY);
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
    
    drawInventoryCursor(ctxBuffer, currentSlot) {
        // xy will be relative to the entire canvas, not any particular region.
        let xy = this.gameScreen.getInventoryXY(currentSlot);

        ctxBuffer.beginPath();
        ctxBuffer.rect(xy[0], xy[1], this.gameScreen.imageScaleFactor, this.gameScreen.imageScaleFactor);
        
        ctxBuffer.lineWidth = "3";
        ctxBuffer.strokeStyle = "red";
        ctxBuffer.stroke();

        ctxBuffer.lineWidth = "1";
        ctxBuffer.strokeStyle = "black";
        ctxBuffer.stroke();
    }
    
    getHealthBarImage(healthFraction) {
        return this.getFractionBarImage(0.15, 0, healthFraction, "#ff0000");
    }
    
    getManaBarImage(manaFraction) {
        return this.getFractionBarImage(0.15, 0.15, manaFraction, "#0000ff");
    }
    
    getExperienceBarImage(experienceFraction) {
        return this.getFractionBarImage(0.15, 0.30, experienceFraction, "#00ff00");
    }

    getStackSizeImage(stackSize) {
        return this.getTextImage("" + stackSize, 0, 0.15, 1, 1, "#000000");
    }
    
    getLevelImage(level) {
        return this.getTextImage("Level: " + level, 0.15, 0.625, 1, 1, "#000000");
    }
    
    getGoldTotalImage(goldTotal, width, height) {
        return this.getTextImage("Gold: " + goldTotal, 0, 0.55, width, height, "#000000");
    }

    getMapInfoTextImage(mapDisplayName, width, height) {
        return this.getTextImage(mapDisplayName, 0, 0.4, width, height, "#000000");
    }

    getScreenInfoTextImage(screenDisplayName, pvpStatus, width, height) {
        let black = "#000000";
        let red = "#FF0000";
        let color = pvpStatus === "pvp" ? red : black;
        let text = screenDisplayName + " [" + pvpStatus + "]";
        return this.getTextImage(text, 0, 0.7, width, height, color);
    }
    
    getEntityInfoNameImage(entityInfoName, width, height) {
        return this.getTextImage(entityInfoName, 0, 0.4, width, height, "#000000");
    }
    
    getEntityInfoTextImage(entityInfoText, width, height) {
        return this.getTextImage(entityInfoText, 0, 0.7, width, height, "#000000");
    }

    getInventoryImages(items, animationFrame) {
        // Returns an array of all the images that should be drawn on this screen.
        let images = [];

        for(let y = 0; y < this.gameScreen.inventoryTilesY; y++) {
            for(let x = 0; x < this.gameScreen.inventoryTilesX; x++) {
                let item = items.shift();
                if(item) {
                    let itemImage = this.imageCatalog.getImageByEntityImageName(item.imageName, animationFrame);
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
        }

        return images;
    }
}

export { CanvasPainter };