class ServerTask {
    fcnString;
    args;
    isRefreshTask = false;

    constructor(fcn, ...args) {
        this.fcnString = fcn.toString();
        this.args = args;
    }

    static createRefreshTask(fcn, ...args) {
        let serverTask = new ServerTask(fcn, ...args);
        serverTask.isRefreshTask = true;
        return serverTask;
    }

    execute() {
        let fcn = new Function('return ' + this.fcnString)();
        if(this.isRefreshTask) {
            fcn(this, ...this.args);
        }
        else {
            fcn(...this.args);
        }
    }

    serialize(writer) {
        const Client = require("../client/Client.js");
        const Entity = require("../entity/Entity.js");
        const Server = require("../server/Server.js");

        writer.beginObject()
            .serialize("isRefreshTask", this.isRefreshTask)
            .serialize("fcnString", this.fcnString)
            .serialize("numArgs", this.args.length);

        for(let i = 0; i < this.args.length; i++) {
            let arg = this.args[i];

            if(arg instanceof Entity) {
                writer.serialize("arg_class_" + i, "Entity");
                writer.serialize("arg_" + i, arg.id);
            }
            else if(arg instanceof Client) {
                writer.serialize("arg_class_" + i, "Client");
                writer.serialize("arg_" + i, arg.id);
            }
            else if(arg instanceof Server) {
                writer.serialize("arg_class_" + i, "Server");
                writer.serialize("arg_" + i, arg.uid);
            }
            else {
                writer.serialize("arg_class_" + i, getClassName(arg));
                writer.serialize("arg_" + i, arg);
            }
        }

        writer.endObject();
    }

    static deserialize(reader) {
        const ClientFactory = require("../client/ClientFactory.js");
        const EntityFactory = require("../entity/EntityFactory.js");
        const ServerFactory = require("../server/ServerFactory.js");
        
        reader.beginObject()
        let isRefreshTask = reader.deserialize("isRefreshTask", "Boolean");
        let fcnString = reader.deserialize("fcnString", "String");
        let numArgs = reader.deserialize("numArgs", "Number");

        let args = [];
        for(let i = 0; i < numArgs; i++) {
            let className = reader.deserialize("arg_class_" + i, "String");

            let arg;
            if(className === "Entity") {
                let id = reader.deserialize("arg_" + i, "Number");
                arg = EntityFactory.entityMap.get(id);
            }
            else if(className === "Client") {
                let id = reader.deserialize("arg_" + i, "Number");
                arg = ClientFactory.clientIDMap.get(id);
            }
            else if(className === "Server") {
                let uid = reader.deserialize("arg_" + i, "Number");
                arg = ServerFactory.serverMap.get(uid);
            }
            else {
                arg = reader.deserialize("arg_" + i, className);
            }

            args.push(arg);
        }

        reader.endObject();

        let serverTask = new ServerTask(fcnString, ...args);
        serverTask.isRefreshTask = isRefreshTask;
        return serverTask;
    }
}

function getClassName(value) {
    // Everything is either a ServerTask, an entity, a string, or a number.
    let className;

    if(isFunction(value, "getClassName")) {
        // This "getClassName" function itself is not part of the class, so it will not cause any circular loops.
        className = value.getClassName();
    }
    else if(isNumber(value)) {
        className = "Number";
    }
    else if(isString(value)) {
        className = "String";
    }
    else if(value instanceof ServerTask) {
        className = "ServerTask";
    }
    else {
        throw("Unknown object.");
    }

    return className;
}

function addScreen(entity) {
    const AppState = require("../AppState.js");

    let newServer = AppState.instance.serverManager.getServerByName(entity.screenInfo.serverName);
    let newWorld = newServer?.universe?.getWorldByName(entity.screenInfo.worldName);
    let newMap = newWorld?.getMapByName(entity.screenInfo.mapName);
    let newScreen = newMap?.getScreenByPosition(entity.screenInfo.screenX, entity.screenInfo.screenY);

    entity.screen = newScreen;
    newScreen.addEntity(entity);
}

function isFunction(value, fcnName) {
	return value !== undefined && 
        (typeof value[fcnName] === "function" || (typeof value[fcnName] === "object" && value[fcnName] instanceof Function));
}

function isNumber(value) {
	return typeof value === "number" || value instanceof Number;
}

function isString(value) {
	return typeof value === "string" || value instanceof String;
}

module.exports = ServerTask;