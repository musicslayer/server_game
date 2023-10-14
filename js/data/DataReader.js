const Reflection = require("../reflection/Reflection.js");

const NULL = Symbol("NULL");
const NAME = Symbol("NAME");
const VALUE = Symbol("VALUE");
const BEGIN_OBJECT = Symbol("BEGIN_OBJECT");
const END_OBJECT = Symbol("END_OBJECT");
const BEGIN_ARRAY = Symbol("BEGIN_ARRAY");
const END_ARRAY = Symbol("END_ARRAY");

class DataReader {
    readFcn;

    s = "";
    lastPhrase = "";
    inProgressPhrase;

    constructor(readFcn) {
        this.readFcn = readFcn;
    }

    readData() {
        // Just use the output of the read function directly.
        return this.readFcn();
    }

    peekNull() {
        let arr = this.process(false);
        return arr[0] === VALUE && arr[1] === NULL;
    }

    peekEndArray() {
        let arr = this.process(false);
        return arr[0] === END_ARRAY;
    }

    getName() {
        let arr = this.process(true);
        if(arr[0] !== NAME) {
            throw(new Error("Invalid Element: " + arr[0]?.toString()));
        }
        return arr[1];
    }

    getString() {
        let arr = this.process(true);
        if(arr[0] !== VALUE) {
            throw(new Error("Invalid Element: " + arr[0]?.toString()));
        }
        return arr[1];
    }

    getNull() {
        let arr = this.process(true);
        if(arr[0] !== VALUE) {
            throw(new Error("Invalid Element: " + arr[0]?.toString()));
        }
        if(arr[1] !== NULL) {
            throw(new Error("Expecting null element, but instead found: " + arr[1]?.toString()));
        }
        return undefined;
    }

    beginObject() {
        let arr = this.process(true);
        if(arr[0] !== BEGIN_OBJECT) {
            throw(new Error("Invalid Element: " + arr[0]?.toString()));
        }
    }

    endObject() {
        let arr = this.process(true);
        if(arr[0] !== END_OBJECT) {
            throw(new Error("Invalid Element: " + arr[0]?.toString()));
        }
    }

    beginArray() {
        let arr = this.process(true);
        if(arr[0] !== BEGIN_ARRAY) {
            throw(new Error("Invalid Element: " + arr[0]?.toString()));
        }
    }

    endArray() {
        let arr = this.process(true);
        if(arr[0] !== END_ARRAY) {
            throw(new Error("Invalid Element: " + arr[0]?.toString()));
        }
    }

    deserialize(name, className) {
        if(name !== undefined) {
            let nextName = this.getName(name);
            if(name !== nextName) {
                throw(new Error("Key mismatch. Expected: " + name + " Actual: " + nextName?.toString()));
            }
        }

        let value;

        if(this.peekNull()) {
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
                throw(new Error("Key mismatch. Expected: " + name + " Actual: " + nextName?.toString()));
            }
        }

        let arr;

        if(this.peekNull()) {
            arr = this.getNull();
        }
        else {
            arr = [];

            this.beginArray();
            while(!(this.peekEndArray())) {
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
                throw(new Error("Key mismatch. Expected: " + name + " Actual: " + nextName?.toString()));
            }
        }

        let map;

        if(this.peekNull()) {
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
                throw(new Error("Key mismatch. Expected: " + name + " Actual: " + nextName?.toString()));
            }
        }

        let value;

        if(this.peekNull()) {
            value = this.getNull();
        }
        else {
            value = Reflection.callStaticMethod(wrapClass("dereference", className), "dereference", this);
        }

        return value;
    }

    dereferenceArray(name, className) {
        if(name !== undefined) {
            let nextName = this.getName(name);
            if(name !== nextName) {
                throw(new Error("Key mismatch. Expected: " + name + " Actual: " + nextName?.toString()));
            }
        }

        let arr;

        if(this.peekNull()) {
            arr = this.getNull();
        }
        else {
            arr = [];

            this.beginArray();
            while(!(this.peekEndArray())) {
                arr.push(this.dereference(undefined, className));
            }
            this.endArray();
        }

        return arr;
    }

    dereferenceMap(name, classNameKeys, classNameValues) {
        // Dereference a map as an object containing arrays.
        if(name !== undefined) {
            let nextName = this.getName(name);
            if(name !== nextName) {
                throw(new Error("Key mismatch. Expected: " + name + " Actual: " + nextName?.toString()));
            }
        }

        let map;

        if(this.peekNull()) {
            map = this.getNull();
        }
        else {
            this.beginObject();
            let keys = this.dereferenceArray("keys", classNameKeys);
            let values = this.dereferenceArray("values", classNameValues);
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

    process(shouldConsume) {
        let chunk = "";
        let numCharsRead = 0;
        let numCharsReadPhrase;
        let storage = "";
        
        while(this.s.length > 0 || null !== (chunk = this.readData())) {
            this.s += chunk;

            let iterator = this.s[Symbol.iterator]();
            for(let theChar = iterator.next(); !theChar.done; theChar = iterator.next()) {
                numCharsRead++;
                let theCharValue = theChar.value;

                if(this.inProgressPhrase === "null") {
                    [this.inProgressPhrase, this.lastPhrase, numCharsReadPhrase] = findNullPhrase(iterator, this.lastPhrase, theCharValue);
                    numCharsRead += numCharsReadPhrase;
                }
                else if(this.inProgressPhrase === "quote") {
                    [this.inProgressPhrase, this.lastPhrase, numCharsReadPhrase] = findQuotePhrase(iterator, this.lastPhrase, theCharValue);
                    numCharsRead += numCharsReadPhrase;
                }
                else {
                    switch(theCharValue) {
                        case ":": {
                            let returnPhrase = this.lastPhrase;
                            this.lastPhrase = "";
                            this.s = storage + this.s;

                            if(shouldConsume) {
                                this.s = this.s.slice(numCharsRead);
                            }

                            return [NAME, returnPhrase];
                        }
                        case ",": {
                            if(this.lastPhrase !== "") {
                                let returnPhrase = this.lastPhrase;
                                this.lastPhrase = "";
                                this.s = storage + this.s;

                                if(shouldConsume) {
                                    this.s = this.s.slice(numCharsRead);
                                }

                                return [VALUE, returnPhrase];
                            }

                            break;
                        }
                        case "n": {
                            // Add the "n" to the phase
                            [this.inProgressPhrase, this.lastPhrase, numCharsReadPhrase] = findNullPhrase(iterator, this.lastPhrase, "n");
                            numCharsRead += numCharsReadPhrase;

                            break;
                        }
                        case "\"": {
                            // Throw away the opening quote.
                            [this.inProgressPhrase, this.lastPhrase, numCharsReadPhrase] = findQuotePhrase(iterator, this.lastPhrase, "");
                            numCharsRead += numCharsReadPhrase;

                            break;
                        }
                        case "{": {
                            this.s = storage + this.s;
                            if(shouldConsume) {
                                this.s = this.s.slice(numCharsRead);
                            }

                            return [BEGIN_OBJECT];
                        }
                        case "}": {
                            if(this.lastPhrase !== "") {
                                let returnPhrase = this.lastPhrase;
                                this.lastPhrase = "";
                                this.s = storage + this.s;

                                if(shouldConsume) {
                                    this.s = this.s.slice(numCharsRead - 1); // Don't consume ]
                                }

                                return [VALUE, returnPhrase];
                            }

                            this.s = storage + this.s;

                            if(shouldConsume) {
                                this.s = this.s.slice(numCharsRead);
                            }

                            return [END_OBJECT];
                        }
                        case "[": {
                            this.s = storage + this.s;

                            if(shouldConsume) {
                                this.s = this.s.slice(numCharsRead);
                            }

                            return [BEGIN_ARRAY];
                        }
                        case "]": {
                            if(this.lastPhrase !== "") {
                                let returnPhrase = this.lastPhrase;
                                this.lastPhrase = "";
                                this.s = storage + this.s;

                                if(shouldConsume) {
                                    this.s = this.s.slice(numCharsRead - 1); // Don't consume ]
                                }

                                return [VALUE, returnPhrase];
                            }

                            this.s = storage + this.s;

                            if(shouldConsume) {
                                this.s = this.s.slice(numCharsRead);
                            }

                            return [END_ARRAY];
                        }
                        default: {
                            throw(new Error("Invalid character: " + theCharValue));
                        }
                    }
                }
            }

            // If we got this far, we read everything we have so far but haven't found a valid return value yet.
            storage += this.s;
            this.s = "";
        }

        // If we get this far, that means the json data is incomplete and we will surely error somewhere.
        return [];
    }
}

function findNullPhrase(iterator, phrase, firstChar) {
    // Look for the phrase "null".
    let numCharsReadPhrase = 0;
    phrase += firstChar;
    if(phrase === "null") {
        return [undefined, NULL, numCharsReadPhrase];
    }

    for(let theChar = iterator.next(); !theChar.done; theChar = iterator.next()) {
        numCharsReadPhrase++;
        let theCharValue = theChar.value;
        
        phrase += theCharValue;
        if(phrase === "null") {
            return [undefined, NULL, numCharsReadPhrase];
        }
    }

    return ["null", phrase, numCharsReadPhrase];
}

function findQuotePhrase(iterator, phrase, firstChar) {
    // The first quote has already been consumed, so keep searching until we consume the second quote.
    let numCharsReadPhrase = 0;
    if(firstChar === "\"") {
        return [undefined, phrase, numCharsReadPhrase];
    }

    phrase += firstChar;

    for(let theChar = iterator.next(); !theChar.done; theChar = iterator.next()) {
        numCharsReadPhrase++;
        let theCharValue = theChar.value;

        if(theCharValue === "\"") {
            return [undefined, phrase, numCharsReadPhrase];
        }
        
        phrase += theCharValue;
    }

    return ["quote", phrase, numCharsReadPhrase];
}

function wrapClass(fcnName, className) {
    if(Reflection.isStaticMethod(className, fcnName)) {
        return className;
    }
    else if(className === "Boolean") {
        return "DataWrapper.BooleanWrapper";
    }
    else if(className === "Number") {
        return "DataWrapper.NumberWrapper";
    }
    else if(className === "BigInt") {
        return "DataWrapper.BigIntWrapper";
    }
    else if(className === "String") {
        return "DataWrapper.StringWrapper";
    }
    else {
        // Anything else is unsupported.
        throw(new Error("Unsupported class: " + fcnName + " " + className));
    }
}

module.exports = DataReader;