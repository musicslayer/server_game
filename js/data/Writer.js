const NAME = Symbol("NAME");
const VALUE = Symbol("VALUE");
const BEGIN_OBJECT = Symbol("BEGIN_OBJECT");
const END_OBJECT = Symbol("END_OBJECT");
const BEGIN_ARRAY = Symbol("BEGIN_ARRAY");
const END_ARRAY = Symbol("END_ARRAY");

class Writer {
    data = [];

    putName(name) {
        this.data.push(NAME);
        this.data.push(name);
        return this;
    }

    putValue(value) {
        this.data.push(VALUE);
        this.data.push(value);
        return this;
    }

    beginObject() {
        this.data.push(BEGIN_OBJECT);
        return this;
    }

    endObject() {
        this.data.push(END_OBJECT);
        return this;
    }

    beginArray() {
        this.data.push(BEGIN_ARRAY);
        return this;
    }

    endArray() {
        this.data.push(END_ARRAY);
        return this;
    }

    serialize(name, value) {
        if(name !== undefined) {
            this.putName(name);
        }

        if(isFunction(value, "serialize")) {
            value.serialize(this);
        }
        else {
            this.putValue(value);
        }

        return this;
    }

    serializeArray(name, arr) {
        if(name !== undefined) {
            this.putName(name);
        }

        this.beginArray();
        for(let a of arr) {
            this.serialize(undefined, a);
        }
        this.endArray();

        return this;
    }

    serializeMap(name, map) {
        // Serialize a map as an object containing two arrays.
        if(name !== undefined) {
            this.putName(name);
        }

        this.beginObject();
        this.serializeArray("keys", map.keys());
        this.serializeArray("values", map.values());
        this.endObject();
        
        return this;
    }

    toString() {
        let s = "";

        let commaFlags = [];

        while(this.data.length > 0) {
            let dataElement = this.data.shift();

            switch(dataElement) {
                case NAME:
                    if(commaFlags[commaFlags.length - 1] === "name") {
                        s += ",";
                    }

                    let name = this.data.shift();
                    if(name === undefined) {
                        s += "null"
                    }
                    else {
                        s += "\"" + name + "\":"
                    }

                    if(commaFlags[commaFlags.length - 1] === "") {
                        commaFlags[commaFlags.length - 1] = "name";
                    }

                    break;

                case VALUE:
                    if(commaFlags[commaFlags.length - 1] !== "name" && commaFlags[commaFlags.length - 1] !== "") {
                        s += ",";
                    }

                    let value = this.data.shift();
                    if(value === undefined) {
                        s += "null"
                    }
                    else {
                        s += "\"" + value + "\""
                    }

                    if(commaFlags[commaFlags.length - 1] === "") {
                        commaFlags[commaFlags.length - 1] = "value";
                    }

                    break;

                case BEGIN_OBJECT:
                    if(commaFlags[commaFlags.length - 1] === "object") {
                        s += ",";
                    }

                    s += "{"

                    if(commaFlags[commaFlags.length - 1] === "") {
                        commaFlags[commaFlags.length - 1] = "object";
                    }

                    commaFlags.push("");

                    break;

                case END_OBJECT:
                    s += "}"
                    commaFlags.pop();

                    break;

                case BEGIN_ARRAY:
                    if(commaFlags[commaFlags.length - 1] === "array") {
                        s += ",";
                    }

                    s += "["

                    if(commaFlags[commaFlags.length - 1] === "") {
                        commaFlags[commaFlags.length - 1] = "array";
                    }

                    commaFlags.push("");

                    break;

                case END_ARRAY:
                    s += "]"
                    commaFlags.pop();

                    break;

                default:
                    throw("Invalid data element: " + dataElement.toString());
            }
        }

        return s;
    }
}

function isFunction(value, fcnName) {
	return value !== undefined && 
        (typeof value[fcnName] === "function" || (typeof value[fcnName] === "object" && value[fcnName] instanceof Function));
}

module.exports = Writer;