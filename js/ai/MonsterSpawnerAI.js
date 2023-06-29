class MonsterSpawnerAI {
    generateNextActivity(monsterSpawner) {
        // If we are not at the max number of monsters, spawn a new one.
        if(monsterSpawner.monsterCount < monsterSpawner.maxMonsterCount) {
            monsterSpawner.getServerScheduler().scheduleTask(undefined, 0, () => {
                let monster = monsterSpawner.createMonsterInstance();
                monsterSpawner.doSpawnEntity(monster);
                monsterSpawner.onMonsterSpawn();
            });
        }

        monsterSpawner.getServerScheduler().scheduleTask(undefined, monsterSpawner.spawnTime, () => {
            this.generateNextActivity(monsterSpawner);
        });
    }
}

module.exports = MonsterSpawnerAI;