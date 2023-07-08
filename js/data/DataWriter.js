const DataWrapper = require("./DataWrapper.js");

class DataWriter {
    writer;
    commaFlags = [];

    constructor(writer) {
        this.writer = writer;
    }

    write(s) {
        this.writer.write(s);
    }

    isNameComma() {
        // For named values, commas are placed before additional names.
        return this.commaFlags[this.commaFlags.length - 1] === "name";
    }

    isValueComma() {
        // For unnamed values, commas are placed before additional values. This includes simple values, objects, and arrays.
        return this.commaFlags[this.commaFlags.length - 1] === "value";
    }

    putName(name) {
        // Names are always strings.
        if(this.isNameComma()) {
            this.writer.write(",");
        }

        this.writer.write("\"" + name + "\":");

        if(!this.isNameComma()) {
            this.commaFlags[this.commaFlags.length - 1] = "name";
        }

        return this;
    }

    putString(value) {
        if(this.isValueComma()) {
            this.writer.write(",");
        }

        this.writer.write("\"" + value + "\"");

        if(!this.isNameComma()) {
            this.commaFlags[this.commaFlags.length - 1] = "value";
        }

        return this;
    }

    putNull() {
        if(this.isValueComma()) {
            this.writer.write(",");
        }

        this.writer.write("null");

        if(!this.isNameComma()) {
            this.commaFlags[this.commaFlags.length - 1] = "value";
        }

        return this;
    }

    beginObject() {
        if(this.isValueComma()) {
            this.writer.write(",");
        }

        this.writer.write("{");

        if(!this.isNameComma()) {
            this.commaFlags[this.commaFlags.length - 1] = "value";
        }

        this.commaFlags.push("");

        return this;
    }

    endObject() {
        this.writer.write("}");
        this.commaFlags.pop();

        return this;
    }

    beginArray() {
        if(this.isValueComma()) {
            this.writer.write(",");
        }

        this.writer.write("[");

        if(!this.isNameComma()) {
            this.commaFlags[this.commaFlags.length - 1] = "value";
        }

        this.commaFlags.push("");

        return this;
    }

    endArray() {
        this.writer.write("]");
        this.commaFlags.pop();

        return this;
    }

    serialize(name, value) {
        if(name !== undefined) {
            this.putName(name);
        }

        if(value === undefined) {
            this.putNull();
        }
        else {
            wrapValue("serialize", value).serialize(this);
        }

        return this;
    }

    serializeArray(name, arr) {
        if(name !== undefined) {
            this.putName(name);
        }

        if(arr === undefined) {
            this.putNull();
        }
        else {
            this.beginArray();
            for(let a of arr) {
                this.serialize(undefined, a);
            }
            this.endArray();
        }

        return this;
    }

    serializeMap(name, map) {
        // Serialize a map as an object containing two arrays.
        if(name !== undefined) {
            this.putName(name);
        }

        if(map === undefined) {
            this.putNull();
        }
        else {
            this.beginObject();
            this.serializeArray("keys", map.keys());
            this.serializeArray("values", map.values());
            this.endObject();
        }
        
        return this;
    }

    reference(name, value) {
        if(name !== undefined) {
            this.putName(name);
        }

        if(value === undefined) {
            this.putNull();
        }
        else {
            wrapValue("reference", value).reference(this);
        }

        return this;
    }
}

function isBoolean(value) {
	return typeof value === "boolean" || value instanceof Boolean;
}

function isNumber(value) {
	return typeof value === "number" || value instanceof Number;
}

function isString(value) {
	return typeof value === "string" || value instanceof String;
}

function isFunction(value, fcnName) {
	return value !== undefined && 
        (typeof value[fcnName] === "function" || (typeof value[fcnName] === "object" && value[fcnName] instanceof Function));
}

function wrapValue(fcnName, value) {
    // Note that value will always be non-undefined.
    if(isFunction(value, fcnName)) {
        return value;
    }
    else if(isBoolean(value)) {
        return new DataWrapper.BooleanWrapper(value);
    }
    else if(isNumber(value)) {
        return new DataWrapper.NumberWrapper(value);
    }
    else if(isString(value)) {
        return new DataWrapper.StringWrapper(value);
    }
    else {
        // Anything else is unsupported.
        throw("Unsupported value: " + fcnName + " " + (typeof value));
    }
}

module.exports = DataWriter;