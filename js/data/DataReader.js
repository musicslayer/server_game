const Reflection = require("../reflection/Reflection.js");

const NULL = Symbol("NULL");
const NAME = Symbol("NAME");
const VALUE = Symbol("VALUE");
const BEGIN_OBJECT = Symbol("BEGIN_OBJECT");
const END_OBJECT = Symbol("END_OBJECT");
const BEGIN_ARRAY = Symbol("BEGIN_ARRAY");
const END_ARRAY = Symbol("END_ARRAY");

class DataReader {
    data = [];

    getName() {
        let dataElement = this.data.shift();
        if(dataElement !== NAME) {
            throw("Invalid Element: " + dataElement?.toString());
        }
        return this.data.shift();
    }

    getString() {
        let dataElement = this.data.shift();
        if(dataElement !== VALUE) {
            throw("Invalid Element: " + dataElement?.toString());
        }
        return this.data.shift();
    }

    getNull() {
        let dataElement = this.data.shift();
        if(dataElement !== VALUE) {
            throw("Invalid Element: " + dataElement?.toString());
        }
        let nullElement = this.data.shift();
        if(nullElement !== NULL) {
            throw("Expecting null element, but instead found: " + nullElement.toString());
        }
        return undefined;
    }

    beginObject() {
        let dataElement = this.data.shift();
        if(dataElement !== BEGIN_OBJECT) {
            throw("Invalid Element: " + dataElement?.toString());
        }
        return this;
    }

    endObject() {
        let dataElement = this.data.shift();
        if(dataElement !== END_OBJECT) {
            throw("Invalid Element: " + dataElement?.toString());
        }
        return this;
    }

    beginArray() {
        let dataElement = this.data.shift();
        if(dataElement !== BEGIN_ARRAY) {
            throw("Invalid Element: " + dataElement?.toString());
        }
        return this;
    }

    endArray() {
        let dataElement = this.data.shift();
        if(dataElement !== END_ARRAY) {
            throw("Invalid Element: " + dataElement?.toString());
        }
        return this;
    }

    deserialize(name, className) {
        if(name !== undefined) {
            let nextName = this.getName(name);
            if(name !== nextName) {
                throw("Key mismatch. Expected: " + name + " Actual: " + nextName?.toString());
            }
        }

        let value;

        if(this.data[1] === NULL) {
            value = this.getNull();
        }
        else {
            value = Reflection.callStaticMethod(wrapClass("deserialize", className), "deserialize", this);
        }

        return value;
    }

    deserializeArray(name, className) {
        if(name !== undefined) {
            let nextName = this.getName(name);
            if(name !== nextName) {
                throw("Key mismatch. Expected: " + name + " Actual: " + nextName?.toString());
            }
        }

        let arr;

        if(this.data[1] === NULL) {
            arr = this.getNull();
        }
        else {
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
                throw("Key mismatch. Expected: " + name + " Actual: " + nextName?.toString());
            }
        }

        let map;

        if(this.data[1] === NULL) {
            map = this.getNull();
        }
        else {
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
                throw("Key mismatch. Expected: " + name + " Actual: " + nextName?.toString());
            }
        }

        let value;

        if(this.data[1] === NULL) {
            value = this.getNull();
        }
        else {
            value = Reflection.callStaticMethod(wrapClass("dereference", className), "dereference", this);
        }

        return value;
    }

    async process(reader) {
        return new Promise((resolve) => {
            let lastPhrase = "";
            let inProgressPhrase;

            reader.on("readable", () => {
                let chunk;
                while (null !== (chunk = reader.read())) {
                    const iterator = chunk[Symbol.iterator]();
                    for(let theChar = iterator.next(); !theChar.done; theChar = iterator.next()) {
                        let theCharValue = theChar.value;

                        if(inProgressPhrase === "null") {
                            [inProgressPhrase, lastPhrase] = findNullPhrase(iterator, lastPhrase, theCharValue);
                        }
                        else if(inProgressPhrase === "quote") {
                            [inProgressPhrase, lastPhrase] = findQuotePhrase(iterator, lastPhrase, theCharValue);
                        }
                        else {
                            switch(theCharValue) {
                                case ":":
                                    this.data.push(NAME);
                                    this.data.push(lastPhrase);

                                    lastPhrase = "";

                                    break;

                                case ",":
                                    if(lastPhrase !== "") {
                                        this.data.push(VALUE);
                                        this.data.push(lastPhrase);

                                        lastPhrase = "";
                                    }

                                    break;

                                case "n":
                                    // Add the "n" to the phase
                                    [inProgressPhrase, lastPhrase] = findNullPhrase(iterator, lastPhrase, "n");

                                    break;

                                case "\"":
                                    // Throw away the opening quote.
                                    [inProgressPhrase, lastPhrase] = findQuotePhrase(iterator, lastPhrase, "");

                                    break;

                                case "{":
                                    this.data.push(BEGIN_OBJECT);

                                    break;

                                case "}":
                                    if(lastPhrase !== "") {
                                        this.data.push(VALUE);
                                        this.data.push(lastPhrase);

                                        lastPhrase = "";
                                    }

                                    this.data.push(END_OBJECT);

                                    break;

                                case "[":
                                    this.data.push(BEGIN_ARRAY);
                                    
                                    break;

                                case "]":
                                    if(lastPhrase !== "") {
                                        this.data.push(VALUE);
                                        this.data.push(lastPhrase);

                                        lastPhrase = "";
                                    }

                                    this.data.push(END_ARRAY);

                                    break;

                                default:
                                    throw("Invalid character: " + theCharValue);
                            }
                        }
                    }
                }
            });

            reader.on("end", () => {
                resolve();
            });
        });
    }
}

function findNullPhrase(iterator, phrase, firstChar) {
    // Look for the phrase "null".
    phrase += firstChar;
    if(phrase === "null") {
        return [undefined, NULL];
    }

    for(let theChar = iterator.next(); !theChar.done; theChar = iterator.next()) {
        let theCharValue = theChar.value;
        
        phrase += theCharValue;
        if(phrase === "null") {
            return [undefined, NULL];
        }
    }

    return ["null", phrase];
}

/*
function findNullPhrase(iterator) {
    // The "n" has already been consumed, so just consume the "ull" part.
    let phrase = "n" + iterator.next().value + iterator.next().value + iterator.next().value;

    if(phrase !== "null") {
        throw("Invalid phrase: " + phrase);
    }

    return NULL;
}
*/

function findQuotePhrase(iterator, phrase, firstChar) {
    // The first quote has already been consumed, so keep searching until we consume the second quote.
    if(firstChar === "\"") {
        return [undefined, phrase];
    }

    phrase += firstChar;

    for(let theChar = iterator.next(); !theChar.done; theChar = iterator.next()) {
        let theCharValue = theChar.value;

        if(theCharValue === "\"") {
            return [undefined, phrase];
        }
        
        phrase += theCharValue;
    }

    return ["quote", phrase];
}

function wrapClass(fcnName, className) {
    // Note that value will always be non-null.
    if(Reflection.isStaticMethod(className, fcnName)) {
        return className;
    }
    else if(className === "Boolean") {
        return "DataWrapper.BooleanWrapper";
    }
    else if(className === "Number") {
        return "DataWrapper.NumberWrapper";
    }
    else if(className === "String") {
        return "DataWrapper.StringWrapper";
    }
    else {
        // Anything else is unsupported.
        throw("Unsupported class: " + fcnName + " " + className);
    }
}

module.exports = DataReader;