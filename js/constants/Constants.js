class Constants {
    static email = {
        EMAIL_FROM: "no-reply@musicslayer.com",
        EMAIL_SUPPORT: "support@musicslayer.com"
    }

    // These variables must point to a valid location on every currently existing world across all servers.
    static fallback = {
        FALLBACK_LOCATION_MAP_NAME: "city",
        FALLBACK_LOCATION_SCREEN_NAME: "field1",
        FALLBACK_LOCATION_X: 0,
        FALLBACK_LOCATION_Y: 0
    }

    // These variables affect server performance.
    static performance = {
        TICK_RATE: 60, // ticks per second
        TICK_SPEED: 1, // speed multiplier for scheduled tasks
        LOOT_TIME: 300, // (5 minutes) seconds that spawned loot will remain in the world before despawning
        MOVEMENT_FRAMES: 60 // animation frames per 1 movement step
    }

    static server = {
        URL_BASE: "https://localhost"
    }

    // These variables point to the game's start location.
    static start = {
        START_LOCATION_MAP_NAME: "city",
        START_LOCATION_SCREEN_NAME: "field1",
        START_LOCATION_X: 0,
        START_LOCATION_Y: 0
    }
}

module.exports = Constants;