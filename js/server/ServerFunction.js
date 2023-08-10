class ServerFunction {
    static functionMap = new Map();

    static init() {
        // Manually add all functions that could be scheduled on the server.
        let map = ServerFunction.functionMap;

        map.set("_wrapper", (_this, animation, time, serverTask) => {
            if(!serverTask.isCancelled) {
                serverTask.execute();

                serverTask.count--;
                if(serverTask.count > 0) {
                    // TODO Can we access "_this" or "_this.server" from inside the function without needing it passed in?
                    // --- Do we even need this wrapper anymore...?
                    _this.server.addTask(animation, time, _this);
                }
            }
        });

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

        map.set("drop_from_inventory", (entity, slot, number) => {
            entity.doDropFromInventory(slot, number);
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
            entity.isInvincible = false;
        });

        map.set("invincible_on", (entity, invincibleSeconds) => {
            entity.doMakeInvincible(invincibleSeconds);
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

        map.set("move_world", (entity, direction) => {
            entity.doMoveWorld(direction);
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
    }

    static getFunction(name) {
        return ServerFunction.functionMap.get(name);
    }
}

module.exports = ServerFunction;