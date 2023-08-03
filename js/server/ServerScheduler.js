const path = require("path");
const { Worker } = require("worker_threads");

const Performance = require("../constants/Performance.js");
const ServerTaskList = require("./ServerTaskList.js");

const WORKER_FILE_PATH = path.resolve(path.join("js", "server", "server_tick.js"));

class ServerScheduler {
    scheduledTaskMap = new Map();
    currentTick = 0;
    isCancelled = false;

    worker;

    getTick(time) {
        return Math.floor(this.currentTick + time * Performance.TICK_RATE);
    }

    addTask(time, serverTask) {
        let tick = this.getTick(time);
        let serverTaskList = this.scheduledTaskMap.get(tick) ?? new ServerTaskList();
        serverTaskList.addTask(serverTask);
        this.scheduledTaskMap.set(tick, serverTaskList);
    }

    initServerTick() {
        // Start a timer thread that will alert the main thread after every tick.
        let shared = new Int32Array(new SharedArrayBuffer(4));
        this.doWork(shared);
    
        this.worker = new Worker(WORKER_FILE_PATH, {
            workerData: {
                shared: shared,
                interval: 1000000000 / Performance.TICK_RATE // In nanoseconds
            }
        });
        this.worker.on("error", (err) => {
            console.error(err);
            console.error(err.stack);
        });
    };

    async endServerTick() {
        // We need to manually end worker threads when a server is no longer in use.
        this.isCancelled = true;
        this.worker.terminate();
    }

    async doWork(shared) {
        while(!this.isCancelled) {
            await Atomics.waitAsync(shared, 0, 0).value;

            let serverTaskList = this.scheduledTaskMap.get(this.currentTick) ?? new ServerTaskList();
            this.scheduledTaskMap.delete(this.currentTick);

            // Increment the current tick now so that new tasks added during a task won't be executed until the next tick.
            this.currentTick++;

            serverTaskList.execute();
        }
    }

    serialize(writer) {
        // Don't serialize the worker because the deserialized server will create a new one.
        writer.beginObject()
            .serialize("!V!", 1)
            .serializeMap("scheduledTaskMap", this.scheduledTaskMap)
            .serialize("currentTick", this.currentTick)
        .endObject();
    }

    static deserialize(reader) {
        let serverScheduler;
        reader.beginObject();

        let version = reader.deserialize("!V!", "String");
        if(version === "1") {
            serverScheduler = new ServerScheduler();
            serverScheduler.scheduledTaskMap = reader.deserializeMap("scheduledTaskMap", "Number", "ServerTaskList");
            serverScheduler.currentTick = reader.deserialize("currentTick", "Number");
        }
        else {
            throw("Unknown version number: " + version);
        }

        reader.endObject();
        return serverScheduler;
    }
}

module.exports = ServerScheduler;