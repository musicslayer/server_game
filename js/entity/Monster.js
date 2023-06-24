const Entity = require("./Entity.js");
const MonsterAI = require("../ai/MonsterAI.js");
const Util = require("../util/Util.js");

class Monster extends Entity {
    id = "monster";

    health = 70;
    maxHealth = 100;
    experienceReward = 20;

    isTangible = true;

    movementTime = 1;

    ai = new MonsterAI();

    aggroMap = new Map();
    lastPlayer;

    getName() {
        return "Monster";
    }

    getInfo() {
        return "A creature that you can kill for loot and experience.";
    }

    doTakeDamage(entity, damage) {
        //this.health = Math.max(this.health - damage, 0);

        let rootEntity = this.getRootEntity(entity);

        // If damage came from a player, increase aggro.
        if(rootEntity.isPlayer) {
            this.lastPlayer = rootEntity;

            let aggro = this.aggroMap.get(rootEntity) ?? 0;
            aggro++;
            this.aggroMap.set(rootEntity, aggro);
        }

        if(this.health === 0) {
            rootEntity.doAddExperience(this.experienceReward);
            this.getWorld().spawnAsLoot("gold", 100, this.screen, this.x, this.y);
            this.doDespawn();

            if(this.owner) {
                this.owner.onMonsterDeath();
            }
        }
    }

    getAggroPlayer() {
        // Returns the player that currently has the aggro.
        let players = [];

        // First find max aggro.
        let max = 0;
        for(let player of this.screen.playerEntities) {
            let aggro = this.aggroMap.get(player) ?? 0;
            max = Math.max(max, aggro);

            if(max === aggro) {
                players.push(player);
            }
        }

        if(max === 0 || players.length === 0) {
            // If no players have non-zero aggro, than don't target anyone.
            return undefined;
        }

        // If the last player to hit the monster is tied for first, choose that one.
        if(players.includes(this.lastPlayer)) {
            return this.lastPlayer;
        }

        // Otherwise, just return the first player in the array.
        return players[0];
    }

    doSpawn() {
        super.doSpawn();

        this.getServer().addTask(0, () => {
            //this.moveMonster();
            this.ai.generateNextActivity(this);
        });
    }

    attack() {
        // Spawn a "melee projectile" representing a melee attack.
        let x = this.x;
        let y = this.y;

        // If the monster is moving, fire the projectile ahead of the motion.
        if(this.isMoveInProgress) {
            let [shiftX, shiftY] = Util.getDirectionalShift(this.direction);
            x += shiftX;
            y += shiftY;
        }

        let projectile = this.getWorld().spawn("melee_projectile", 1, this.screen, x, y, this.direction, 1, 40, false);
        projectile.owner = this;
    }

    doMove(direction) {
        let [shiftX, shiftY] = Util.getDirectionalShift(direction);
        this.x += shiftX;
        this.y += shiftY;

        //this.moveMonster();
        this.ai.generateNextActivity(this);
    }

    doWait() {
        //this.moveMonster();
        this.ai.generateNextActivity(this);
    }

    canCrossScreen() {
        return false;
    }
}

module.exports = Monster;