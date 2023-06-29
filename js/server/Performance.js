class Performance {
    // These variables affect server performance.
    static TICK_RATE = 60; // times per second
    static LOOT_TIME = 300; // (5 minutes) seconds that spawned loot will remain in the world before despawning
    static MOVEMENT_FRAMES = 60; // animation frames per 1 movement step.
}

module.exports = Performance;