class ServerFunction {
    static functionMap = new Map();
    static functionStringMap = new Map(); // Used to generate entropy.

    static init() {
        // Manually add all functions that could be scheduled on the server.
        let map = ServerFunction.functionMap;

        map.set("action", (entity) => {
            entity.doAction();
        });

        map.set("add_experience", (entity, experienceReward) => {
            entity.doAddExperience(experienceReward);
        });

        map.set("add_health", (entity, healthReward) => {
            entity.doAddHealth(healthReward);
        });

        map.set("add_mana", (entity, manaReward) => {
            entity.doAddMana(manaReward);
        });

        map.set("ai_generate_next_activity", (entity) => {
            entity.ai.generateNextActivity(entity);
        });

        map.set("animation_reset", (entity) => {
            entity.doAnimationReset();
        });

        map.set("animation_shift", (entity, fraction, shiftX, shiftY) => {
            entity.doAnimationShift(fraction, shiftX, shiftY);
        });

        map.set("change_direction", (entity, direction) => {
            entity.doChangeDirection(direction);
        });

        map.set("consume_from_inventory", (entity, slot) => {
            entity.doConsumeFromInventory(slot);
        });

        map.set("decrease_aggro", (entity) => {
            entity.decreaseAggro();
        });

        map.set("despawn", (entity) => {
            entity.doDespawn();
        });

        map.set("drop_from_inventory", (entity, slot, stackSize) => {
            entity.doDropFromInventory(slot, stackSize);
        });

        map.set("drop_from_purse", (entity, goldAmount) => {
            entity.doDropFromPurse(goldAmount);
        });

        map.set("inventory_next", (entity) => {
            entity.doInventoryNext();
        });

        map.set("inventory_previous", (entity) => {
            entity.doInventoryPrevious();
        });

        map.set("inventory_swap", (entity, slot1, slot2) => {
            entity.doSwapInventorySlots(slot1, slot2);
        });

        map.set("invincible_off", (entity) => {
            entity.removeStatus("invincible");
        });

        map.set("invincible_on", (entity, invincibleSeconds) => {
            entity.doMakeInvincible(invincibleSeconds);
        });

        map.set("invisible_off", (entity) => {
            entity.removeStatus("invisible");
        });

        map.set("invisible_on", (entity, invisibleSeconds) => {
            entity.doMakeInvisible(invisibleSeconds);
        });

        map.set("kill", (entity) => {
            entity.doKill();
        });

        map.set("move_map", (entity, direction) => {
            entity.doMoveMap(direction);
        })

        map.set("move_screen", (entity, direction) => {
            entity.doMoveScreen(direction);
        });

        map.set("move_step", (entity, direction) => {
            entity.doMoveStep(direction);
        });

        map.set("regen", (entity) => {
            entity.doAddHealth(entity.healthRegen)
            entity.doAddMana(entity.manaRegen)
        });

        map.set("revive", (entity) => {
            entity.doRevive();
        });

        map.set("select_entity_inventory", (entity, slot) => {
            entity.doSelectEntityInventory(slot);
        });

        map.set("select_entity_screen", (entity, x, y) => {
            entity.doSelectEntityScreen(x, y);
        });

        map.set("set_delay_off", (entity, delayType) => {
            entity.delayMap.set(delayType, false);
        });

        map.set("spawn", (entity) => {
            entity.doSpawn();
        });

        map.set("spawn_entity", (entity, otherEntity) => {
            entity.doSpawnEntity(otherEntity);
        });

        map.set("spawn_monster", (entity) => {
            entity.doSpawnEntity(entity.createMonsterInstance());
            entity.onMonsterSpawn();
        });

        map.set("teleport", (entity, x, y) => {
            entity.doTeleport(entity.screen, x, y);
        });
        
        map.set("teleport_home", (entity) => {
            entity.doTeleportHome();
        });

        for(let key of map.keys()) {
            let fcnString = ServerFunction.functionMap.get(key).toString();
            ServerFunction.functionStringMap.set(key, fcnString);
        }
    }

    static getFunction(name) {
        return ServerFunction.functionMap.get(name);
    }

    static getFunctionString(name) {
        return ServerFunction.functionStringMap.get(name);
    }
}

module.exports = ServerFunction;