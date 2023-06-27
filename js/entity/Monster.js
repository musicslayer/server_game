const Entity = require("./Entity.js");
const EntityFactory = require("./EntityFactory.js");
const MonsterAI = require("../ai/MonsterAI.js");
const Util = require("../util/Util.js");

class Monster extends Entity {
    isSerializable = false;

    id = "monster";

    health = 70;
    maxHealth = 100;
    experienceReward = 20;

    isTangible = true;

    movementTime = 1;

    ai = new MonsterAI();

    aggroMap = new Map();
    maxAggro = 300;
    aggroGain = 1;
    aggroForgiveness = 10;

    lastPlayer;

    getName() {
        return "Monster";
    }

    getInfo() {
        return "A creature that you can kill for loot and experience.";
    }

    doSpawn() {
        super.doSpawn();

        // Monster activities are controlled by an AI class.
        this.getServerClock().addTask(0, () => {
            this.ai.generateNextActivity(this);
        });

        // Use this to gradually decrease aggro over time.
        this.getServerClock().addRefreshTask(10, () => {
            this.decreaseAggro();
        });
    }

    doTakeDamage(entity, damage) {
        this.health = Math.max(this.health - damage, 0);

        let rootEntity = this.getRootEntity(entity);

        // If damage came from a player, increase aggro.
        if(rootEntity.isPlayer) {
            this.lastPlayer = rootEntity;

            let aggro = this.aggroMap.get(rootEntity) ?? 0;
            aggro = Math.min(aggro + this.aggroGain, this.maxAggro);
            this.aggroMap.set(rootEntity, aggro);
        }

        if(this.health === 0) {
            this.aggroMap.clear();
            rootEntity.doAddExperience(this.experienceReward);

            let gold = EntityFactory.createInstance("gold", 100);
            gold.screen = this.screen;
            gold.x = this.x;
            gold.y = this.y;
    
            gold.doSpawnAsLoot();
            this.doDespawn();

            this.owner?.onMonsterDeath();
        }
    }

    decreaseAggro() {
        // If a player is no longer on the screen, decrease the aggro for that player.
        for(let player of this.aggroMap.keys()) {
            if(!this.screen.playerEntities.includes(player)) {
                let aggro = this.aggroMap.get(player) ?? 0;
                let newAggro = Math.max(aggro - this.aggroForgiveness, 0);

                if(newAggro === 0) {
                    this.aggroMap.delete(player);
                }
                else {
                    this.aggroMap.set(player, newAggro);
                }
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

    doAttack() {
        // Spawn a "melee projectile" representing a melee attack.
        // If the monster is moving, fire the projectile ahead of the motion.
        let projectile = EntityFactory.createInstance("melee_projectile", 1, this.direction, 1, 40, false);
        projectile.screen = this.screen;
        projectile.x = this.getMovementX();
        projectile.y = this.getMovementY();

        this.doCreateEntity(projectile);
    }

    doMoveStep(direction) {
        let [shiftX, shiftY] = Util.getDirectionalShift(direction);
        this.x += shiftX;
        this.y += shiftY;

        this.ai.generateNextActivity(this);
    }

    doChangeDirection() {
        this.ai.generateNextActivity(this);
    }

    doWait() {
        this.ai.generateNextActivity(this);
    }

    canCrossScreen() {
        return false;
    }
}

module.exports = Monster;