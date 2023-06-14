const Entity = require("./Entity.js");
const ImageCatalog = require("../image/ImageCatalog.js");
const Server = require("../server/Server.js");

class Projectile extends Entity {
    owner;

    direction;
    range;
    damage;
    isMulti;

    isCollision;
    isDone;

    constructor(owner, direction, range, isMulti) {
        super();
        this.owner = owner;
        this.direction = direction;
        this.range = range;
        this.damage = 40;
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

        this.doCheckCollision();

        this.isDone = this.isDone || this.range <= 0 || this.x < 0 || (this.isCollision && !this.isMulti);

        if(this.isDone) {
            this.despawn();
        }
        else {
            this.moveProjectile();
        }
    }

    doMoveUp() {
        this.y--;
        this.range--;

        this.doCheckCollision();

        this.isDone = this.isDone || this.range <= 0 || this.y < 0 || (this.isCollision && !this.isMulti);

        if(this.isDone) {
            this.despawn();
        }
        else {
            this.moveProjectile();
        }
    }

    doMoveRight() {
        this.x++;
        this.range--;

        this.doCheckCollision();

        this.isDone = this.isDone || this.range <= 0 || this.x > this.numTilesX - 1 || (this.isCollision && !this.isMulti);

        if(this.isDone) {
            this.despawn();
        }
        else {
            this.moveProjectile();
        }
    }

    doMoveDown() {
        this.y++;
        this.range--;

        this.doCheckCollision();

        this.isDone = this.isDone || this.range <= 0 || this.y > this.numTilesY - 1 || (this.isCollision && !this.isMulti);

        if(this.isDone) {
            this.despawn();
        }
        else {
            this.moveProjectile();
        }
    }

    getImages() {
        let images = [];

        images.push({
            x: this.x,
            y: this.y,
            image: ImageCatalog.IMAGE_CATALOG.getImageTableByName("magic").getImageByName("orb")
        });

        return images;
    }
}

module.exports = Projectile;