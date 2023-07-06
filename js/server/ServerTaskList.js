class ServerTaskList {
    serverTasks = [];

    addTask(serverTask) {
        this.serverTasks.push(serverTask);
    }

    execute() {
        while(this.serverTasks.length > 0) {
            let task = this.serverTasks.shift();
            task.execute();
        }
    }

    serialize(writer) {
        writer.beginObject()
            .serializeArray("serverTasks", this.serverTasks)
        .endObject();
    }

    static deserialize(reader) {
        let serverTaskList = new ServerTaskList();

        reader.beginObject();
        let serverTasks = reader.deserializeArray("serverTasks", "ServerTask");
        reader.endObject();

        serverTaskList.serverTasks = serverTasks;

        return serverTaskList;
    }
}

module.exports = ServerTaskList;