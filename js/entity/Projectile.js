const Entity = require("./Entity.js");
const ImageCatalog = require("../image/ImageCatalog.js");
const Server = require("../server/Server.js");

class Projectile extends Entity {
    id = "projectile";

    owner;
    direction;
    range;
    isMulti;

    isCollision;

    damage = 40;
    movementTime = 0.05;

    constructor(owner, direction, range, isMulti) {
        super();

        this.owner = owner;
        this.direction = direction;
        this.range = range;
        this.isMulti = isMulti;
    }

    doSpawn(world, map, screen, x, y) {
        super.doSpawn(world, map, screen, x, y);
        Server.addTask(() => { this.moveProjectile(); });
    }

    doInteract(entity) {
        // Do some damage to the other entity unless it is the owner.
        if(entity !== this.owner && entity.isTangible) {
            entity.doTakeDamage(this, this.damage);
            this.isCollision = true;
        }
    }

    moveProjectile() {
        // Do this immediately so that projectiles can hit things overlapping the owner.
        this.doCheckCollision();

        if(!this.isNextStepAllowed() || (this.isCollision && !this.isMulti)) {
            this.despawn();
            return;
        }

        if(this.direction === "left") {
            this.moveLeft();
        }
        else if(this.direction === "right") {
            this.moveRight();
        }
        else if(this.direction === "up") {
            this.moveUp();
        }
        else if(this.direction === "down") {
            this.moveDown();
        }
    }

    // Movement happens one tile at a time, and if the range is reached or the edge is crossed then the projectile despawns.
    doMoveLeft() {
        this.x--;
        this.range--;

        if(this.range <= 0) {
            this.despawn();
        }
        else {
            this.moveProjectile();
        }
    }

    doMoveUp() {
        this.y--;
        this.range--;

        if(this.range <= 0) {
            this.despawn();
        }
        else {
            this.moveProjectile();
        }
    }

    doMoveRight() {
        this.x++;
        this.range--;

        if(this.range <= 0) {
            this.despawn();
        }
        else {
            this.moveProjectile();
        }
    }

    doMoveDown() {
        this.y++;
        this.range--;

        if(this.range <= 0) {
            this.despawn();
        }
        else {
            this.moveProjectile();
        }
    }

    isNextStepAllowed() {
        // By default, check screen edges and if any entities in the direction block action movement.
        // Projectiles can never cross screen edges even if the next screen exists.
        let x = this.x;
        let y = this.y;
        let isEdge;

        if(this.direction === "up") {
            isEdge = y == 0;
            y--;
        }
        else if(this.direction === "down") {
            isEdge = y == 11;
            y++;
        }
        else if(this.direction === "left") {
            isEdge = x == 0;
            x--;
        }
        else if(this.direction === "right") {
            isEdge = x == 15;
            x++;
        }

        if(isEdge) {
            return false;
        }

        let entities = this.screen.otherEntities.concat(this.screen.playerEntities);
        for(let entity of entities) {
            if(this !== entity && x === entity.x && y === entity.y && entity.blocksAction) {
                return false;
            }
        }

        return true;
    }

    getEntityImages() {
        let images = [];

        images.push({
            x: this.x + this.animationShiftX,
            y: this.y + this.animationShiftY,
            image: ImageCatalog.IMAGE_CATALOG.getImageTableByName("magic").getImageByName("orb")
        });

        return images;
    }
}

module.exports = Projectile;