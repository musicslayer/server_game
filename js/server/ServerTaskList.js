class ServerTaskList {
    serverTasks = [];

    addTask(serverTask) {
        this.serverTasks.push(serverTask);
    }

    execute(server) {
        while(this.serverTasks.length > 0) {
            let task = this.serverTasks.shift();
            task.execute(server);
        }
    }

    serialize(writer) {
        writer.beginObject()
            .serialize("!V!", 1)
            .serializeArray("serverTasks", this.serverTasks)
        .endObject();
    }

    static deserialize(reader) {
        let serverTaskList;
        reader.beginObject();

        let version = reader.deserialize("!V!", "String");
        if(version === "1") {
            serverTaskList = new ServerTaskList();
            serverTaskList.serverTasks = reader.deserializeArray("serverTasks", "ServerTask");
        }
        else {
            throw(new Error("Unknown version number: " + version));
        }

        reader.endObject();
        return serverTaskList;
    }
}

module.exports = ServerTaskList;