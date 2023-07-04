const Reflection = require("../reflection/Reflection.js");

const NAME = Symbol("NAME");
const VALUE = Symbol("VALUE");
const BEGIN_OBJECT = Symbol("BEGIN_OBJECT");
const END_OBJECT = Symbol("END_OBJECT");
const BEGIN_ARRAY = Symbol("BEGIN_ARRAY");
const END_ARRAY = Symbol("END_ARRAY");

class Reader {
    data;

    constructor(s) {
        this.data = this.fromString(s);
    }

    getName() {
        let dataElement = this.data.shift();
        // check if it is NAME
        return this.data.shift();
    }

    getValue() {
        let dataElement = this.data.shift();
        // check if it is VALUE
        let value = this.data.shift();
        if(value === "null") {
            value = undefined;
        }

        return value;
    }

    beginObject() {
        let dataElement = this.data.shift();
        // TODO Throw error? dataElement === BEGIN_OBJECT
        return this;
    }

    endObject() {
        let dataElement = this.data.shift();
        // TODO Throw error? dataElement === END_OBJECT
        return this;
    }

    beginArray() {
        let dataElement = this.data.shift();
        // TODO Throw error? dataElement === BEGIN_ARRAY
        return this;
    }

    endArray() {
        let dataElement = this.data.shift();
        // TODO Throw error? dataElement === END_ARRAY
        return this;
    }

    deserialize(name, className) {
        if(name !== undefined) {
            let nextName = this.getName(name);
            if(name !== nextName) {
                throw("Key mismatch. Expected: " + name + " Actual: " + nextName.toString());
            }
        }

        let value;

        if(this.data[0] !== "null") {
            if(className === "String" || this.data[1] === "null") {
                value = this.getValue();
            }
            else if(className === "Number" || this.data[1] === "null") {
                value = Number(this.getValue());
            }
            else {
                value = Reflection.callStaticMethod(className, "deserialize", this);
            }
        }

        return value;
    }

    deserializeArray(name, className) {
        if(name !== undefined) {
            let nextName = this.getName(name);
            if(name !== nextName) {
                throw("Key mismatch. Expected: " + name + " Actual: " + nextName.toString());
            }
        }

        let arr;

        if(this.data[0] !== "null") {
            arr = [];

            this.beginArray();
            while(this.data[0] !== END_ARRAY) {
                arr.push(this.deserialize(undefined, className));
            }
            this.endArray();
        }

        return arr;
    }

    deserializeMap(name, classNameKeys, classNameValues) {
        // Serialize a map as an object containing arrays.
        if(name !== undefined) {
            let nextName = this.getName(name);
            if(name !== nextName) {
                throw("Key mismatch. Expected: " + name + " Actual: " + nextName.toString());
            }
        }

        let map;

        if(this.data[0] !== "null") {
            this.beginObject();
            let keys = this.deserializeArray("keys", classNameKeys);
            let values = this.deserializeArray("values", classNameValues);
            this.endObject();

            if(keys !== undefined && values !== undefined && keys.length === values.length) {
                map = new Map();
                for(let i = 0; i < keys.length; i++) {
                    map.set(keys[i], values[i]);
                }
            }
        }
        
        return map;
    }

    fromString(s) {
        let data = [];
        let lastPhrase = "";

        const iterator = s[Symbol.iterator]();

        for(let theChar = iterator.next(); !theChar.done; theChar = iterator.next()) {
            let theCharValue = theChar.value;

            switch(theCharValue) {
                case " ":
                case "\n":
                case "\r":
                    // Skip over common whitespace characters.
                    break;

                case ":":
                    data.push(NAME);
                    data.push(lastPhrase);

                    lastPhrase = "";

                    break;

                case ",":
                    if(lastPhrase !== "") {
                        data.push(VALUE);
                        data.push(lastPhrase);

                        lastPhrase = "";
                    }

                    break;

                case "n":
                    let nullPhrase = theCharValue + iterator.next().value + iterator.next().value + iterator.next().value;
                    if(nullPhrase !== "null") {
                        throw("Invalid phrase: " + nullPhrase);
                    } 

                    lastPhrase = nullPhrase;

                    break;

                case "\"":
                    let quotePhrase = "";
                    for(let theQuoteChar = iterator.next(); theQuoteChar.value !== "\""; theQuoteChar = iterator.next()) {
                        quotePhrase += theQuoteChar.value;
                    }

                    lastPhrase = quotePhrase;

                    break;

                case "{":
                    data.push(BEGIN_OBJECT);

                    break;

                case "}":
                    if(lastPhrase !== "") {
                        data.push(VALUE);
                        data.push(lastPhrase);

                        lastPhrase = "";
                    }

                    data.push(END_OBJECT);

                    break;

                case "[":
                    data.push(BEGIN_ARRAY);
                    
                    break;

                case "]":
                    if(lastPhrase !== "") {
                        data.push(VALUE);
                        data.push(lastPhrase);

                        lastPhrase = "";
                    }

                    data.push(END_ARRAY);

                    break;

                default:
                    throw("Invalid string: " + theCharValue);
            }
        }

        return data;
    }
}

module.exports = Reader;