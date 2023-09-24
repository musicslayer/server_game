const path = require("path");

class Constants {
    static data = {
        MAX_BYTES_READ: 65536
    };

    static email = {
        EMAIL_FROM: "no-reply@musicslayer.com",
        EMAIL_SUPPORT: "support@musicslayer.com"
    };

    // These variables must point to a valid location on every currently existing world across all servers.
    static fallback = {
        FALLBACK_LOCATION_MAP_NAME: "city",
        FALLBACK_LOCATION_SCREEN_NAME: "field1",
        FALLBACK_LOCATION_X: 0,
        FALLBACK_LOCATION_Y: 0
    };

    static log = {
        // Switch individual log levels on or off.
        LOG_FATAL: true,
        LOG_ERROR: true,
        LOG_WARN: true,
        LOG_INFO: true,
        LOG_DEBUG: true,
        LOG_TRACE: true,

        MAX_LOG_SIZE: 5 * 1024 * 1024 * 1024, // 5GB per file
        SEPARATOR: " ----- "
    };

    // These variables point to various locations used by the app.
    static path = {
        JS_SOURCE_FOLDER: path.resolve("js"),
        LOG_FOLDER: path.resolve("logs"),
        SAVE_STATE_FOLDER: path.resolve("save_states"),
        ZIP_FILE: path.resolve(path.join("assets", "image.zip")),
        ZIP_SOURCE_FOLDER: path.resolve(path.join("assets", "image"))
    };

    // These variables affect server performance.
    static performance = {
        TICK_RATE: 60, // ticks per second
        TICK_SPEED: 1, // speed multiplier for scheduled tasks (should be set to 1 for production)
        LOOT_TIME: 300, // (5 minutes) seconds that spawned loot will remain in the world before despawning
        MOVEMENT_FRAMES: 60 // animation frames per 1 movement step
    };

    static ratelimit = {
        // Each entry is the number of allowed operations per IP address per second.
        operationMap: new Map(Object.entries({
            "html": 100,
            "create_account": 1,
            "delete_account": 1,
            "create_character": 1,
            "select_character": 1,
            "login": 1,
            "forced_logout": 1,
            "input": 1000,
            "data": 1000,
            "dev": 1000
        }))
    };

    static reflection = {
        PRAGMA_EXCLUDE: "#EXCLUDE_REFLECTION"
    };

    static server = {
        MAX_CONNECTIONS_PER_IP: 10,
        REQUEST_TIMEOUT: 30000, // milliseconds
        URL_BASE: "https://localhost"
    };

    // These variables point to the game's start location.
    static start = {
        START_LOCATION_MAP_NAME: "city",
        START_LOCATION_SCREEN_NAME: "field1",
        START_LOCATION_X: 0,
        START_LOCATION_Y: 0
    };
}

module.exports = Constants;