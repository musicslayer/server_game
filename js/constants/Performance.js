class Performance {
    // These variables affect server performance.
    static TICK_RATE = 60; // ticks per second
    static TICK_SPEED = 1; // speed multiplier for scheduled tasks
    static LOOT_TIME = 300; // (5 minutes) seconds that spawned loot will remain in the world before despawning
    static MOVEMENT_FRAMES = 60; // animation frames per 1 movement step
}

module.exports = Performance;