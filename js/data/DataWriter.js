const DataWrapper = require("./DataWrapper.js");
const Util = require("../util/Util.js");

class DataWriter {
    writeFcn;
    commaFlags = [];

    constructor(writeFcn) {
        this.writeFcn = writeFcn;
    }

    writeData(s) {
        // Just call the write function directly.
        this.writeFcn(s);
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
            this.writeData(",");
        }

        this.writeData("\"" + name + "\":");

        if(!this.isNameComma()) {
            this.commaFlags[this.commaFlags.length - 1] = "name";
        }

        return this;
    }

    putString(value) {
        if(this.isValueComma()) {
            this.writeData(",");
        }

        this.writeData("\"" + value + "\"");

        if(!this.isNameComma()) {
            this.commaFlags[this.commaFlags.length - 1] = "value";
        }

        return this;
    }

    putNull() {
        if(this.isValueComma()) {
            this.writeData(",");
        }

        this.writeData("null");

        if(!this.isNameComma()) {
            this.commaFlags[this.commaFlags.length - 1] = "value";
        }

        return this;
    }

    beginObject() {
        if(this.isValueComma()) {
            this.writeData(",");
        }

        this.writeData("{");

        if(!this.isNameComma()) {
            this.commaFlags[this.commaFlags.length - 1] = "value";
        }

        this.commaFlags.push("");

        return this;
    }

    endObject() {
        this.writeData("}");
        this.commaFlags.pop();

        return this;
    }

    beginArray() {
        if(this.isValueComma()) {
            this.writeData(",");
        }

        this.writeData("[");

        if(!this.isNameComma()) {
            this.commaFlags[this.commaFlags.length - 1] = "value";
        }

        this.commaFlags.push("");

        return this;
    }

    endArray() {
        this.writeData("]");
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

    referenceArray(name, arr) {
        if(name !== undefined) {
            this.putName(name);
        }

        if(arr === undefined) {
            this.putNull();
        }
        else {
            this.beginArray();
            for(let a of arr) {
                this.reference(undefined, a);
            }
            this.endArray();
        }

        return this;
    }

    referenceMap(name, map) {
        // Reference a map as an object containing two arrays.
        if(name !== undefined) {
            this.putName(name);
        }

        if(map === undefined) {
            this.putNull();
        }
        else {
            this.beginObject();
            this.referenceArray("keys", map.keys());
            this.referenceArray("values", map.values());
            this.endObject();
        }
        
        return this;
    }
}

function isFunction(value, fcnName) {
	return value !== undefined && 
        (typeof value[fcnName] === "function" || (typeof value[fcnName] === "object" && value[fcnName] instanceof Function));
}

function wrapValue(fcnName, value) {
    // Note that value will never be undefined.
    if(isFunction(value, fcnName)) {
        return value;
    }

    let className = Util.getClassName(value);
    if(className === "Boolean") {
        return new DataWrapper.BooleanWrapper(value);
    }
    else if(className === "Number") {
        return new DataWrapper.NumberWrapper(value);
    }
    else if(className === "String") {
        return new DataWrapper.StringWrapper(value);
    }
    else {
        // Anything else is unsupported.
        throw("Unsupported value: " + fcnName + " " + (typeof value));
    }
}

module.exports = DataWriter;