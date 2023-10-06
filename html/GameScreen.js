class GameScreen {
    // All values are numbers of tiles relative to the origin of the canvas.
    screenOriginX = 0;
    screenOriginY = 0;
    screenTilesX = 16;
    screenTilesY = 12;

    inventoryOriginX = 17;
    inventoryOriginY = 7;
    inventoryTilesX = 9;
    inventoryTilesY = 5;

    purseOriginX = 17;
    purseOriginY = 0;
    purseTilesX = 1;
    purseTilesY = 1;

    infoOriginX = 17;
    infoOriginY = 1;
    infoTilesX = 1;
    infoTilesY = 1;

    canvas;
    canvasBorderPixelsX;
    canvasBorderPixelsY;
    imageScaleFactor;

    constructor(canvas, canvasBorderPixelsX, canvasBorderPixelsY, imageScaleFactor) {
        this.canvas = canvas;
        this.canvasBorderPixelsX = canvasBorderPixelsX;
        this.canvasBorderPixelsY = canvasBorderPixelsY;
        this.imageScaleFactor = imageScaleFactor;
    }

    getPositionData(x, y) {
        let location;
        let info = [];

        let rect = this.canvas.getBoundingClientRect();
        let rx = x - rect.left - this.canvasBorderPixelsX;
        let ry = y - rect.top - this.canvasBorderPixelsY;

        if(rx >= this.screenOriginX * this.imageScaleFactor
            && rx < (this.screenOriginX + this.screenTilesX) * this.imageScaleFactor
            && ry >= this.screenOriginY
            && ry < (this.screenOriginY + this.screenTilesY) * this.imageScaleFactor) {

            location = "screen";
            let screenTiles = this.getScreenTiles(rx, ry);
            info.push(screenTiles[0]);
            info.push(screenTiles[1]);
        }
        else if(rx >= this.inventoryOriginX * this.imageScaleFactor
            && rx < (this.inventoryOriginX + this.inventoryTilesX) * this.imageScaleFactor
            && ry >= this.inventoryOriginY * this.imageScaleFactor
            && ry < (this.inventoryOriginY + this.inventoryTilesY) * this.imageScaleFactor) {

            location = "inventory";
            let inventorySlot = this.getInventorySlot(rx, ry);
            info.push(inventorySlot);
        }
        else if(rx >= this.purseOriginX * this.imageScaleFactor
            && rx < (this.purseOriginX + this.purseTilesX) * this.imageScaleFactor
            && ry >= this.purseOriginY * this.imageScaleFactor
            && ry < (this.purseOriginY + this.purseTilesY) * this.imageScaleFactor) {

            location = "purse";
            let purseNumber = this.getPurseNumber(rx, ry);
            info.push(purseNumber);
        }

        return [location, info];
    }

    getScreenTiles(rx, ry) {
        let nx = Math.floor((rx / this.imageScaleFactor) - this.screenOriginX);
        let ny = Math.floor((ry / this.imageScaleFactor) - this.screenOriginY);
        return [nx, ny];
    }

    getInventorySlot(rx, ry) {
        let nx = Math.floor((rx / this.imageScaleFactor) - this.inventoryOriginX);
        let ny = Math.floor((ry / this.imageScaleFactor) - this.inventoryOriginY);
        let slot = ny * 9 + nx;
        return slot;
    }

    getInventoryXY(slot) {
        let nx = slot % 9;
        let ny = Math.floor(slot / 9);
        let rx = (nx + this.inventoryOriginX) * this.imageScaleFactor;
        let ry = (ny + this.inventoryOriginY) * this.imageScaleFactor;
        return [rx, ry];
    }

    getPurseNumber(rx, ry) {
        // For now, there is only one purse.
        return 0;
    }
}

export { GameScreen };