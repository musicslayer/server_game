const fs = require("fs");

const Tile = require("./Tile.js");
const Util = require("../util/Util.js");

const COMMA = ",";
const CRLF = "\r\n";
const PIPE = "|";

class Screen {
    map;
    name;
    x;
    y;
    pvpStatus;

    // For now, these are just fixed numbers.
    numTilesX = 16;
    numTilesY = 12;

    tiles = [];
    otherEntities = [];
    playerEntities = [];

    loadScreenFromFile(screenFile) {
        let tileData = fs.readFileSync(screenFile, "ascii");
        let lines = tileData ? tileData.split(CRLF) : [];

        // Each line represents a square within this screen.
        while(lines.length > 0) {
            let line = lines.shift();
            let parts = line.split(PIPE);

            // First part is the x,y
            let numPart = parts[0].split(COMMA);
            let x = Number(numPart.shift());
            let y = Number(numPart.shift());

            // Second part is the tiles
            let tilePart = parts[1].split(COMMA);
            if(tilePart[0]) {
                let imageFolders = [];
                let imageFiles = [];

                while(tilePart.length > 0) {
                    imageFolders.push(tilePart.shift());
                    imageFiles.push(tilePart.shift());
                }

                let tile = new Tile(imageFolders, imageFiles);
                tile.x = x;
                tile.y = y;
        
                this.addTile(tile);
            }

            // Third part is the entities
            let entityPart = parts[2].split(COMMA);
            if(entityPart[0]) {
                while(entityPart.length > 0) {
                    let id = entityPart.shift();
                    let stackSize = Number(entityPart.shift());
                    this.getWorld().spawn(id, stackSize, this, x, y);
                }
            }
        }

    }

    addTile(tile) {
        this.tiles.push(tile);
    }

    addEntity(entity) {
        if(entity.isPlayer) {
            this.playerEntities.push(entity);
        }
        else {
            this.otherEntities.push(entity);
        }

        if(this.isDynamic) {
            this.getWorld().register("instance", 1);
        }
        else {
            this.getWorld().register("persistent", 1);
        }
    }

    removeEntity(entity) {
        if(entity.isPlayer) {
            const index = this.playerEntities.indexOf(entity);
            if(index > -1) {
                this.playerEntities.splice(index, 1);
            }
        }
        else {
            const index = this.otherEntities.indexOf(entity);
            if(index > -1) {
                this.otherEntities.splice(index, 1);
            }
        }

        if(this.isDynamic) {
            this.getWorld().deregister("instance", 1);

            // If there are no more players in an instance screen, then the entire screen should be deregistered.
            if(this.playerEntities.length === 0) {
                this.getWorld().deregister("instance", this.otherEntities.length);
            }
        }
        else {
            this.getWorld().deregister("persistent", 1);
        }
    }

    isFacingEdge(entity, direction) {
        let [shiftX, shiftY] = Util.getDirectionalShift(direction);
        let x = entity.x + shiftX;
        let y = entity.y + shiftY;

        return x < 0 || x > this.numTilesX - 1 || y < 0 || y > this.numTilesY - 1;
    }

    doCrossScreen(entity, direction) {
        // Move to the next screen and wrap position around.
        let [shiftX, shiftY] = Util.getDirectionalShift(direction);
        entity.x -= shiftX * (this.numTilesX - 1);
        entity.y -= shiftY * (this.numTilesY - 1)
        
        entity.doMoveScreen(direction);
    }

    isScreenInDirection(direction) {
        return this.map.isScreenInDirection(this, direction);
    }

    getOverlappingEntities(entity) {
        let overlappingEntities = this.getEntitiesAt(entity.x, entity.y);
        if(entity.isMoveInProgress) {
            let [shiftX, shiftY] = Util.getDirectionalShift(entity.direction);
            overlappingEntities = overlappingEntities.concat(this.getEntitiesAt(entity.x + shiftX, entity.y + shiftY));
        }

        return overlappingEntities;
    }

    getEntitiesAt(x, y) {
        let entities = [];

        let screenEntities = this.otherEntities.concat(this.playerEntities);
        for(let screenEntity of screenEntities) {
            if(screenEntity.isAt(x, y)) {
                entities.push(screenEntity);
            }
        }

        return entities;
    }

    getHighestEntity(x, y) {
        let highestEntity;

        // Iterate backwards to get the highest entity.
        let screenEntities = this.otherEntities.concat(this.playerEntities);
        for(let i = screenEntities.length - 1; i >= 0; i--) {
            let screenEntity = screenEntities[i];
            if(x === screenEntity.x && y === screenEntity.y) {
                highestEntity = screenEntity;
                break;
            }
        }

        return highestEntity;
    }

    getScreenInDirection(direction) {
        return this.map.getScreenInDirection(this, direction);
    }

    getMapInDirection(direction) {
        return this.map.getMapInDirection(direction);
    }

    getWorldInDirection(direction) {
        return this.map.world.getWorldInDirection(direction);
    }



    getServer() {
        return this.map.world.galaxy.server;
    }

    getWorld() {
        return this.map.world;
    }


    serialize() {
        let s = "{";
        s += "\"name\":";
        s += "\"" + this.name + "\"";
        s += ",";
        s += "\"x\":";
        s += "\"" + this.x + "\"";
        s += ",";
        s += "\"y\":";
        s += "\"" + this.y + "\"";
        s += ",";
        s += "\"numTilesX\":";
        s += "\"" + this.numTilesX + "\"";
        s += ",";
        s += "\"numTilesY\":";
        s += "\"" + this.numTilesY + "\"";
        s += ",";
        s += "\"pvpStatus\":";
        s += "\"" + this.pvpStatus + "\"";
        s += ",";



        s += "\"tiles\":";
        s += "[";
        for(let tile of this.tiles) {
            s += tile.serialize();
            s += ",";
        }
        if(s[s.length - 1] === ",") {s = s.slice(0, s.length - 1)}
        s += "]";
        s += ",";

        s += "\"otherEntities\":";
        s += "[";
        for(let otherEntity of this.otherEntities) {
            if(otherEntity.isSerializable) {
                s += otherEntity.serialize();
                s += ",";
            }
        }
        if(s[s.length - 1] === ",") {s = s.slice(0, s.length - 1)}
        s += "]";

        // Don't serialize players here.
        s += "}";

        return s;
    }

    deserialize(s) {
        let j = JSON.parse(s);

        this.name = j.name;
        this.x = Number(j.x);
        this.y = Number(j.y);
        this.numTilesX = Number(j.numTilesX);
        this.numTilesY = Number(j.numTilesY);
        this.pvpStatus = j.pvpStatus;

        for(let tile_j of j.tiles) {
            let tile_s = JSON.stringify(tile_j);

            let tile = Tile.deserialize(tile_s);

            this.addTile(tile);
        }

        for(let otherEntity_j of j.otherEntities) {
            let otherEntity = this.getWorld().spawn(otherEntity_j.id, Number(otherEntity_j.stackSize), this, Number(otherEntity_j.x), Number(otherEntity_j.y));
            this.addEntity(otherEntity);
        }

        // Don't deserialize players here.
    }
}

module.exports = Screen;