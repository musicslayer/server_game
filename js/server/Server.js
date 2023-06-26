const fs = require("fs");
const { Worker } = require("worker_threads");

const Galaxy = require("../world/Galaxy.js");

class Server {
    // These variables affect server performance.
    TICK_RATE = 60; // times per second
    MOVEMENT_FRAMES = 60; // frames per 1 tile of movement
    LOOT_TIME = 300; // (5 minutes) seconds that spawned loot will remain in the world before despawning

    isPaused = true;
    scheduledTaskMap = new Map();
    currentTick = 0;

    galaxy;
    id;
    name;

    addTask(seconds, task) {
        let tick = Math.floor(this.currentTick + seconds * this.TICK_RATE);
        let tasks = this.scheduledTaskMap.get(tick) ?? [];
        tasks.push(task);
        this.scheduledTaskMap.set(tick, tasks);
    }

    addRefreshTask(seconds, task) {
        // Add a task that will execute every time the given duration passes.
        this.addTask(seconds, () => {
            task();
            this.addRefreshTask(seconds, task);
        });
    }

    initServerTick() {
        // Start a timer thread that will alert the main thread after every tick.
        this.isPaused = false;

        const shared = new Int32Array(new SharedArrayBuffer(4));
        this.doWork(shared);
    
        const worker = new Worker("./js/server/server_tick.js", {
            workerData: {
                shared: shared,
                interval: 1000000000 / this.TICK_RATE // In nanoseconds
            }
        });
        worker.on("error", (err) => {
            console.error(err);
            console.error(err.stack);
        });
    };

    async doWork(shared) {
        await Atomics.waitAsync(shared, 0, 0).value;
        if(!this.isPaused) {
            let tasks = this.scheduledTaskMap.get(this.currentTick) ?? [];
            this.scheduledTaskMap.delete(this.currentTick);

            // Increment the current tick now so that new tasks added during a task won't be executed until the next tick.
            this.currentTick++;

            for(let task of tasks) {
                task();
            }
        }
    
        this.doWork(shared)
    }

    addGalaxy(galaxy) {
        this.galaxy = galaxy;
    }

    save(stateFile) {
        // Save the server state to the file.
        // We save the current tick but none of the scheduled tasks.
        this.isPaused = true;

        let s = this.serialize();
        fs.writeFileSync(stateFile, s, "ascii");

        this.isPaused = false;
    }

    load(stateFile) {
        // Change the server state to the state recorded in the file.
        this.isPaused = true;

        // Wipe the scheduled tasks.
        this.scheduledTaskMap = new Map();

        let s = fs.readFileSync(stateFile, "ascii");
        this.deserialize(s);

        this.isPaused = false;
    }

    serialize() {
        let s = "{";
        s += "\"currentTick\":";
        s += "\"" + this.currentTick + "\"";
        s += ",";
        s += "\"galaxy\":";
        s += this.galaxy.serialize();
        s += "}";

        return s;
    }

    deserialize(s) {
        let j = JSON.parse(s);
        let galaxy_s = JSON.stringify(j.galaxy);

        this.currentTick = j.currentTick;

        let galaxy = new Galaxy();
        galaxy.server = this;

        galaxy.deserialize(galaxy_s);
        this.addGalaxy(galaxy);

        // Don't deserialize the scheduled tasks here.
    }
}

module.exports = Server;