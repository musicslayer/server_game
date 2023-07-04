class ServerTask2 {
    fcnString;
    args;

    constructor(fcn, ...args) {
        this.fcnString = fcn.toString();
        this.args = args;
    }

    execute() {
        let fcn = new Function('return ' + this.fcnString)();
        fcn(...this.args);
    }

    serialize(writer) {
        writer.beginObject()
            .serialize("fcnString", this.fcnString)
            .serialize("numArgs", this.args.length);

        for(let i = 0; i < this.args.length; i++) {
            let arg = this.args[i];
            writer.serialize("arg_class_" + i, getClassName(arg));
            writer.serialize("arg_" + i, arg);
        }

        writer.endObject();
    }

    static deserialize(reader) {
        let serverTask = new ServerTask();

        reader.beginObject();
        let fcnString = reader.deserialize("fcnString", "String");
        let numArgs = reader.deserialize("numArgs", "Number");

        let args = [];
        for(let i = 0; i < numArgs; i++) {
            let className = reader.deserialize("arg_class_" + i, "String");
            let arg = reader.deserialize("arg_" + i, className);
            args.push(arg);
        }

        reader.endObject();

        serverTask.fcnString = fcnString;
        serverTask.args = args;

        return serverTask;
    }
}

function getClassName(value) {
    // Everything is either an entity, a string, or a number.
    let className;

    if(isFunction(value, "getClassName")) {
        className = value.getClassname();
    }
    else if(isNumber(value)) {
        className = "Number";
    }
    else if(isString(value)) {
        className = "String";
    }
    else {
        throw("Unknown object.");
    }

    return className;
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

module.exports = ServerTask2;