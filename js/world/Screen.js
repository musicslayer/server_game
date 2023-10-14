const fs = require("fs");
const { EOL } = require("os");

const Reflection = require("../reflection/Reflection.js");
const Entity = require("../entity/Entity.js");
const ServerTask = require("../server/ServerTask.js");
const Tile = require("./Tile.js");
const Util = require("../util/Util.js");

const COMMA = ",";
const PIPE = "|";

class Screen {
    map;
    name;
    displayName;
    x;
    y;

    // For now, these are just fixed numbers.
    numTilesX = 16;
    numTilesY = 12;

    pvpStatus;

    tiles = [];
    entities = [];

    static loadScreenFromFile(map, className, screenFile) {
        let screen = Reflection.createInstance(className);
        screen.map = map;

        let screenData = fs.readFileSync(screenFile, "ascii");
        let lines = screenData ? screenData.split(EOL) : [];

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
                while(tilePart.length > 0) {
                    let tile = new Tile();
                    tile.name = tilePart.shift();
                    tile.x = x;
                    tile.y = y;

                    screen.addTile(tile);
                }
            }

            // Third part is the entities
            let entityPart = parts.shift().split(COMMA);
            if(entityPart[0]) {
                while(entityPart.length > 0) {
                    let id = entityPart.shift();
                    let stackSize = Number(entityPart.shift());

                    let entity = Entity.createInstance(id, stackSize);
                    entity.setScreen(screen);
                    entity.x = x;
                    entity.y = y;

                    // Schedule each entity to be spawned.
                    let serverTask = new ServerTask(undefined, 0, 1, "spawn", entity);
                    entity.getServer().scheduleTask(serverTask);
                }
            }

            // Fourth part is a teleporter destination
            let teleporterPart = parts.shift().split(COMMA);
            if(teleporterPart[0]) {
                while(teleporterPart.length > 0) {
                    let destinationMapName = teleporterPart.shift();
                    let destinationScreenName = teleporterPart.shift();
                    let destinationX = Number(teleporterPart.shift());
                    let destinationY = Number(teleporterPart.shift());

                    let teleporter = Entity.createInstance("Teleporter", 1);
                    teleporter.setScreen(screen);
                    teleporter.x = x;
                    teleporter.y = y;
                    teleporter.destinationMapName = destinationMapName;
                    teleporter.destinationScreenName = destinationScreenName;
                    teleporter.destinationX = destinationX;
                    teleporter.destinationY = destinationY;

                    // Schedule each teleporter to be spawned.
                    let serverTask = new ServerTask(undefined, 0, 1, "spawn", teleporter);
                    teleporter.getServer().scheduleTask(serverTask);
                }
            }

            // Fifth part is info text (don't split any further)
            let infoPart = parts.shift();
            if(infoPart !== "") {
                let infoText = infoPart;

                let infoSign = Entity.createInstance("InfoSign", 1);
                infoSign.setScreen(screen);
                infoSign.x = x;
                infoSign.y = y;
                infoSign.infoText = infoText;

                // Schedule each info sign to be spawned.
                let serverTask = new ServerTask(undefined, 0, 1, "spawn", infoSign);
                infoSign.getServer().scheduleTask(serverTask);
            }
        }

        return screen;
    }

    addBackgroundTile(tileName) {
        // Add this tile to every square on this screen.
        for(let x = 0; x < this.numTilesX; x++) {
            for(let y = 0; y < this.numTilesY; y++) {
                let tile = new Tile();
                tile.name = tileName;
                tile.x = x;
                tile.y = y;

                // Make sure these are placed in the array before any other existing tiles.
                this.tiles.unshift(tile);
            }
        }
    }

    addTile(tile) {
        this.tiles.push(tile);
    }

    addEntity(entity) {
        this.entities.push(entity);
    }

    removeEntity(entity) {
        let index = this.entities.indexOf(entity);
        this.entities.splice(index, 1);
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
        let entitiesAt = [];

        for(let entity of this.entities) {
            if(entity.isAt(x, y)) {
                entitiesAt.push(entity);
            }
        }

        return entitiesAt;
    }

    getHighestVisibleEntity(x, y) {
        let highestVisibleEntity;

        // Iterate backwards to get the highest visible entity.
        let entitiesReverse = this.entities.slice().reverse();
        for(let entity of entitiesReverse) {
            if(entity.isVisible() && entity.isAt(x, y)) {
                highestVisibleEntity = entity;
                break;
            }
        }

        return highestVisibleEntity;
    }

    getScreenInDirection(direction) {
        return this.map.getScreenInDirection(this, direction);
    }

    hasXY(x, y) {
        return x >= 0 && x < this.numTilesX && y >= 0 && y < this.numTilesY;
    }

    getPlayerCount() {
        let playerCount = 0;

        for(let entity of this.entities) {
            if(entity.isPlayer) {
                playerCount++;
            }
        }

        return playerCount;
    }

    notifyPlayerRemoval() {
        // By default, just call the same method on the map.
        this.map.notifyPlayerRemoval();
    }

    allowsItemUse() {
        // Returns whether a player can drop or consume items from the inventory or purse on this screen.
        // By default, we allow this.
        return true;
    }

    serialize(writer) {
        // Only serialize non-players here.
        writer.beginObject()
            .serialize("!V!", 1)
            .serialize("className", Util.getClassName(this))
            .serialize("name", this.name)
            .serialize("displayName", this.displayName)
            .serialize("x", this.x)
            .serialize("y", this.y)
            .serialize("numTilesX", this.numTilesX)
            .serialize("numTilesY", this.numTilesY)
            .serialize("pvpStatus", this.pvpStatus)
            .serializeArray("tiles", this.tiles)
            .referenceArray("entities", this.entities)
        .endObject();
    }

    static deserialize(reader) {
        let screen;
        reader.beginObject();

        let version = reader.deserialize("!V!", "String");
        if(version === "1") {
            let className = reader.deserialize("className", "String");
            screen = Reflection.createInstance(className);

            screen.name = reader.deserialize("name", "String");
            screen.displayName = reader.deserialize("displayName", "String");
            screen.x = reader.deserialize("x", "Number");
            screen.y = reader.deserialize("y", "Number");
            screen.numTilesX = reader.deserialize("numTilesX", "Number");
            screen.numTilesY = reader.deserialize("numTilesY", "Number");
            screen.pvpStatus = reader.deserialize("pvpStatus", "String");
            
            let tiles = reader.deserializeArray("tiles", "Tile");
            let entities = reader.dereferenceArray("entities", "Entity");

            for(let tile of tiles) {
                screen.addTile(tile);
            }

            for(let entity of entities) {
                entity.screen = screen;
                screen.addEntity(entity);
            }
        }
        else {
            throw(new Error("Unknown version number: " + version));
        }

        reader.endObject();
        return screen;
    }
}

module.exports = Screen;