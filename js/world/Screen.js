const fs = require("fs");

const Reflection = require("../reflection/Reflection.js");
const EntityFactory = require("../entity/EntityFactory.js");
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

    // For now, these are just fixed numbers.
    numTilesX = 16;
    numTilesY = 12;

    pvpStatus;

    tiles = [];
    otherEntities = [];
    playerEntities = [];

    static loadScreenFromFile(className, screenFile) {
        let screen = Reflection.createInstance(className);

        let tileData = fs.readFileSync(screenFile, "ascii");
        let lines = tileData ? tileData.split(CRLF) : [];

        // Each line represents a square within this screen.
        while(lines.length > 0) {
            let line = lines.shift();
            let parts = line.split(PIPE);

            // First part is the x,y
            let numPart = parts.shift().split(COMMA);
            let x = Number(numPart.shift());
            let y = Number(numPart.shift());

            // Second part is the tiles
            let tilePart = parts.shift().split(COMMA);
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
        
                screen.addTile(tile);
            }

            // Third part is the entities
            let entityPart = parts.shift().split(COMMA);
            if(entityPart[0]) {
                while(entityPart.length > 0) {
                    let id = entityPart.shift();
                    let stackSize = Number(entityPart.shift());

                    let entity = EntityFactory.createInstance(id, stackSize);
                    entity.screen = screen;
                    entity.x = x;
                    entity.y = y;

                    // Don't spawn entities here. This will be done later.
                    screen.addEntity(entity);
                }
            }
        }

        return screen;
    }

    addTile(tile) {
        this.tiles.push(tile);
    }

    addEntity(entity) {
        if(entity.isPlayer) {
            const index = this.playerEntities.indexOf(entity);
            if(index === -1) {
                this.playerEntities.push(entity);
            }
        }
        else {
            const index = this.otherEntities.indexOf(entity);
            if(index === -1) {
                this.otherEntities.push(entity);
            }
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
            overlappingEntities = overlappingEntities.concat(this.getEntitiesAt(entity.getMovementX(), entity.getMovementY()));
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
            if(screenEntity.isAt(x, y)) {
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

    serialize(writer) {
        // Only serialize non-players here.
        writer.beginObject()
            .serialize("!V!", 1)
            .serialize("name", this.name)
            .serialize("x", this.x)
            .serialize("y", this.y)
            .serialize("numTilesX", this.numTilesX)
            .serialize("numTilesY", this.numTilesY)
            .serialize("pvpStatus", this.pvpStatus)
            .serializeArray("tiles", this.tiles)
            .serializeArray("otherEntities", this.otherEntities)
        .endObject();
    }

    static deserialize(reader) {
        let screen;
        reader.beginObject();

        let version = reader.deserialize("!V!", "String");
        if(version === "1") {
            screen = new Screen();
            screen.name = reader.deserialize("name", "String");
            screen.x = reader.deserialize("x", "Number");
            screen.y = reader.deserialize("y", "Number");
            screen.numTilesX = reader.deserialize("numTilesX", "Number");
            screen.numTilesY = reader.deserialize("numTilesY", "Number");
            screen.pvpStatus = reader.deserialize("pvpStatus", "String");
            let tiles = reader.deserializeArray("tiles", "Tile");
            let otherEntities = reader.deserializeArray("otherEntities", "Entity");

            for(let tile of tiles) {
                screen.addTile(tile);
            }

            for(let entity of otherEntities) {
                entity.screen = screen;
                screen.addEntity(entity);
            }
        }
        else {
            throw("Unknown version number: " + version);
        }

        reader.endObject();
        return screen;
    }

    reference(writer) {
        // Write enough information so the screen can be found later.
        writer.beginObject()
            .serialize("screenX", this.x)
            .serialize("screenY", this.y)
            .serialize("mapName", this.map.name)
            .serialize("worldName", this.map.world.name)
            .serialize("universeName", this.map.world.universe.name)
            .serialize("serverName", this.map.world.universe.server.name)
        .endObject();
    }

    static dereference(reader) {
        // Only return the information here, not an actual Screen instance.
        reader.beginObject();
        let screenX = reader.deserialize("screenX", "Number");
        let screenY = reader.deserialize("screenY", "Number");
        let mapName = reader.deserialize("mapName", "String");
        let worldName = reader.deserialize("worldName", "String");
        let universeName = reader.deserialize("universeName", "String");
        let serverName = reader.deserialize("serverName", "String");
        reader.endObject();

        return {
            screenX: screenX,
            screenY: screenY,
            mapName: mapName,
            worldName: worldName,
            universeName: universeName,
            serverName: serverName
        };
    }
}

module.exports = Screen;