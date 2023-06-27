class Performance {
    // These variables affect server performance.
    static TICK_RATE = 60; // times per second
    static MOVEMENT_FRAMES = 60; // frames per 1 tile of movement
    static LOOT_TIME = 300; // (5 minutes) seconds that spawned loot will remain in the world before despawning
}

module.exports = Performance;