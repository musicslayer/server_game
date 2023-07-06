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
        if(dataElement !== NAME) {
            throw("Invalid Element: " + dataElement.toString());
        }
        return this.data.shift();
    }

    getValue() {
        let dataElement = this.data.shift();
        if(dataElement !== VALUE) {
            throw("Invalid Element: " + dataElement.toString());
        }
        return this.data.shift();
    }

    beginObject() {
        let dataElement = this.data.shift();
        if(dataElement !== BEGIN_OBJECT) {
            throw("Invalid Element: " + dataElement.toString());
        }
        return this;
    }

    endObject() {
        let dataElement = this.data.shift();
        if(dataElement !== END_OBJECT) {
            throw("Invalid Element: " + dataElement.toString());
        }
        return this;
    }

    beginArray() {
        let dataElement = this.data.shift();
        if(dataElement !== BEGIN_ARRAY) {
            throw("Invalid Element: " + dataElement.toString());
        }
        return this;
    }

    endArray() {
        let dataElement = this.data.shift();
        if(dataElement !== END_ARRAY) {
            throw("Invalid Element: " + dataElement.toString());
        }
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

        if(this.data[0] === BEGIN_OBJECT) {
            value = Reflection.callStaticMethod(className, "deserialize", this);
        }
        else {
            value = this.getValue();

            if(value === "null") {
                // The class doesn't matter, just return undefined.
                value = undefined;
            }
            else if(className === "String") {
                value = unescape(value);
            }
            else if(className === "Number") {
                value = Number(value);
            }
            else if(className === "Boolean") {
                value = value === "true";
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

    dereference(name, className) {
        if(name !== undefined) {
            let nextName = this.getName(name);
            if(name !== nextName) {
                throw("Key mismatch. Expected: " + name + " Actual: " + nextName.toString());
            }
        }

        let value;

        if(this.data[0] === BEGIN_OBJECT) {
            value = Reflection.callStaticMethod(className, "dereference", this);
        }
        else {
            value = this.getValue();

            if(value === "null") {
                // The class doesn't matter, just return undefined.
                value = undefined;
            }
            else if(className === "String") {
                value = unescape(value);
            }
            else if(className === "Number") {
                value = Number(value);
            }
            else if(className === "Boolean") {
                value = value === "true";
            }
            else {
                value = Reflection.callStaticMethod(className, "dereference", this);
            }
        }

        return value;
    }

    fromString(s) {
        let data = [];
        let lastPhrase = "";

        const iterator = s[Symbol.iterator]();

        for(let theChar = iterator.next(); !theChar.done; theChar = iterator.next()) {
            let theCharValue = theChar.value;

            switch(theCharValue) {
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
                    lastPhrase = findNullPhrase(iterator);

                    break;

                case "\"":
                    lastPhrase = findQuotePhrase(iterator);

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
                    throw("Invalid character: " + theCharValue);
            }
        }

        return data;
    }
}

function findNullPhrase(iterator) {
    // The "n" has already been consumed, so just consume the "ull" part.
    let phrase = "n" + iterator.next().value + iterator.next().value + iterator.next().value;

    if(phrase !== "null") {
        throw("Invalid phrase: " + phrase);
    }

    return phrase;
}

function findQuotePhrase(iterator) {
    // The first quote has already been consumed, so keep searching until we consume the second quote.
    let phrase = "";
    //let backslashFlag = false;

    for(let theChar = iterator.next();; theChar = iterator.next()) {
        let theCharValue = theChar.value;

        if(theCharValue === "\"") {
            break;
        }
        
        phrase += theCharValue;
    }

    return phrase;
}

function unescape(e) {
    let s = "";
    for(let i = 0; i < e.length; i++) {
        let c = e.charAt(i);

        // Only unescape \uXXXX
        if(c === "\\" && e.charAt(i + 1) === "u") {
            s += String.fromCharCode(parseInt(e.substring(i + 2, i + 6), 16));

            // Skip 5 more characters
            i += 5
        }
        else {
            s += c;
        }
    }

    return s;
}

module.exports = Reader;