class Writer {
    s = "";
    commaFlags = [];

    isNameComma() {
        // For named values, commas are placed before additional names.
        return this.commaFlags[this.commaFlags.length - 1] === "name";
    }

    isValueComma() {
        // For unnamed values, commas are placed before additional values. This includes simple values, objects, and arrays.
        return this.commaFlags[this.commaFlags.length - 1] === "value";
    }

    putName(name) {
        if(this.isNameComma()) {
            this.s += ",";
        }

        this.s += normalize(name) + ":";

        if(!this.isNameComma()) {
            this.commaFlags[this.commaFlags.length - 1] = "name";
        }

        return this;
    }

    putValue(value) {
        if(this.isValueComma()) {
            this.s += ",";
        }

        this.s += normalize(value);

        if(!this.isNameComma()) {
            this.commaFlags[this.commaFlags.length - 1] = "value";
        }

        return this;
    }

    beginObject() {
        if(this.isValueComma()) {
            this.s += ",";
        }

        this.s += "{";

        if(!this.isNameComma()) {
            this.commaFlags[this.commaFlags.length - 1] = "value";
        }

        this.commaFlags.push("");

        return this;
    }

    endObject() {
        this.s += "}";
        this.commaFlags.pop();

        return this;
    }

    beginArray() {
        if(this.isValueComma()) {
            this.s += ",";
        }

        this.s += "[";

        if(!this.isNameComma()) {
            this.commaFlags[this.commaFlags.length - 1] = "value";
        }

        this.commaFlags.push("");

        return this;
    }

    endArray() {
        this.s += "]";
        this.commaFlags.pop();

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

    reference(name, value) {
        if(name !== undefined) {
            this.putName(name);
        }

        if(isFunction(value, "reference")) {
            value.reference(this);
        }
        else {
            this.putValue(value);
        }

        return this;
    }

    toString() {
        return this.s;
    }
}

function normalize(value) {
    let s;

    if(value === undefined) {
        s = "null"
    }
    else if(isNumber(value) || isBoolean(value)) {
        // Don't bother escaping, just wrap in quotes and rely on implicit string conversion.
        s = "\"" + value + "\"";
    }
    else if(isString(value)){
        s = "\"" + escape(value) + "\"";
    }
    else {
        // Anything else could be trickier, so just error for now.
        throw("Invalid JSON value of type: " + (typeof value));
    }

    return s;
}

function escape(s) {
    let e = "";

    for(let i = 0; i < s.length; i++) {
        let c = s.charCodeAt(i);

        // Escape ", \, and all control characters as \uXXXX
        if(c === 34 || c === 92 || c <= 31) {
            e += "\\u" + c.toString(16, 4).padStart(4, "0");
        }
        else {
            e += s.charAt(i);
        }
    }

    return e;
}

function isNumber(value) {
	return typeof value === "number" || value instanceof Number;
}

function isBoolean(value) {
	return typeof value === "boolean" || value instanceof Boolean;
}

function isString(value) {
	return typeof value === "string" || value instanceof String;
}

function isFunction(value, fcnName) {
	return value !== undefined && 
        (typeof value[fcnName] === "function" || (typeof value[fcnName] === "object" && value[fcnName] instanceof Function));
}

module.exports = Writer;