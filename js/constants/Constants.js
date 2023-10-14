const path = require("path");

class Constants {
    static data = {
        MAX_BYTES_READ: 65536
    };

    // These variables must point to a valid location on every currently existing world across all servers.
    static fallback = {
        FALLBACK_LOCATION_MAP_NAME: "city",
        FALLBACK_LOCATION_SCREEN_NAME: "start_field",
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
        MOVEMENT_FRAMES: 60, // animation frames per 1 movement step
        MAX_WORLDS: 4, // The number of regular worlds a server has.
        MAX_WORLD_PLAYER_COUNT: 20 // The max number of simultaneous players allowed to log into a world.
    };

    static ratelimit = {
        // Each entry is the number of allowed operations per IP address per second.
        OPERATION_MAP: new Map(Object.entries({
            "html": 1000,
            "create_account": 1000,
            "delete_account": 1000,
            "create_character": 1000,
            "delete_character": 1000,
            "login_account": 1000,
            "login_character": 1000,
            "change_password": 1000,
            "change_email": 1000,
            "logout_account": 1000,
            "enable_account": 1000,
            "disable_account": 1000,
            "get_character_classes": 1000,
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
        REQUEST_TIMEOUT: 60000 // milliseconds
    };

    // These variables point to the game's start location.
    static start = {
        START_LOCATION_MAP_NAME: "city",
        START_LOCATION_SCREEN_NAME: "start_field",
        START_LOCATION_X: 0,
        START_LOCATION_Y: 0
    };
}

module.exports = Constants;