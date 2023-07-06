const { Worker } = require("worker_threads");

const Performance = require("../constants/Performance.js");
const ServerTaskList = require("./ServerTaskList.js");

class ServerScheduler {
    scheduledTaskMap = new Map();
    currentTick = 0;
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
        const shared = new Int32Array(new SharedArrayBuffer(4));
        this.doWork(shared);
    
        this.worker = new Worker("./js/server/server_tick.js", {
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
        this.worker.terminate();
    }

    async doWork(shared) {
        while(true) {
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
            .serializeMap("scheduledTaskMap", this.scheduledTaskMap)
            .serialize("currentTick", this.currentTick)
        .endObject();
    }

    static deserialize(reader) {
        let serverScheduler = new ServerScheduler();

        reader.beginObject();
        let scheduledTaskMap = reader.deserializeMap("scheduledTaskMap", "Number", "ServerTaskList");
        let currentTick = reader.deserialize("currentTick", "Number");
        reader.endObject();

        serverScheduler.scheduledTaskMap = scheduledTaskMap;
        serverScheduler.currentTick = currentTick;

        return serverScheduler;
    }
}

module.exports = ServerScheduler;