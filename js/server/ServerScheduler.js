const path = require("path");

const Constants = require("../constants/Constants.js");
const ServerTaskList = require("./ServerTaskList.js");
const WorkerManager = require("../worker/WorkerManager.js");

const WORKER_FILE_PATH = path.resolve(path.join(__dirname, "..", "worker", "worker_interval.js"));

class ServerScheduler {
    server;

    scheduledTaskMap = new Map();
    currentTick = 0;
    isCancelled = false;

    worker;

    getTick(time) {
        return Math.floor(this.currentTick + (time * Constants.performance.TICK_RATE) / Constants.performance.TICK_SPEED);
    }

    addTask(serverTask) {
        let tick = this.getTick(serverTask.time);
        let serverTaskList = this.scheduledTaskMap.get(tick) ?? new ServerTaskList();
        serverTaskList.addTask(serverTask);
        this.scheduledTaskMap.set(tick, serverTaskList);
    }

    initServerTick(server) {
        // Start a timer thread that will alert the main thread after every tick.
        this.server = server;
        
        let shared = new Int32Array(new SharedArrayBuffer(4));
        this.doWork(shared);

        this.worker = WorkerManager.createWorker(WORKER_FILE_PATH, {
            workerData: {
                shared: shared,
                intervalTime: 1000000000 / Constants.performance.TICK_RATE // In nanoseconds
            }
        });
        // eslint-disable-next-line no-unused-vars
        this.worker.on("exit", (exitCode) => {
            this.isCancelled = true;
        });
        // eslint-disable-next-line no-unused-vars
        this.worker.on("error", (err) => {
            this.isCancelled = true;
        });
    }

    endServerTick() {
        // We need to manually end worker threads when a server is no longer in use.
        this.worker.terminate();
    }

    async doWork(shared) {
        while(!this.isCancelled) {
            // We must query "value" or else this statement will not actually wait for anything.
            await Atomics.waitAsync(shared, 0, 0).value;

            let serverTaskList = this.scheduledTaskMap.get(this.currentTick);
            this.scheduledTaskMap.delete(this.currentTick);

            // Increment the current tick now so that new tasks added during a task won't be executed until at least the next tick.
            this.currentTick++;

            try {
                serverTaskList?.execute(this.server);
            }
            catch(err) {
                console.error(err);
            }
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
            throw(new Error("Unknown version number: " + version));
        }

        reader.endObject();
        return serverScheduler;
    }
}

module.exports = ServerScheduler;