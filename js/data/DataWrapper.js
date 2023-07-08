class BooleanWrapper {
    value;

    constructor(value) {
        this.value = value;
    }

    serialize(writer) {
        writer.putString(this.value);
    }

    static deserialize(reader) {
        return reader.getString() === "true";
    }

    reference(writer) {
        writer.putString(this.value);
    }

    static dereference(reader) {
        return reader.getString() === "true";
    }
}

class NumberWrapper {
    value;

    constructor(value) {
        this.value = value;
    }

    serialize(writer) {
        writer.putString(this.value);
    }

    static deserialize(reader) {
        return Number(reader.getString());
    }

    reference(writer) {
        writer.putString(this.value);
    }

    static dereference(reader) {
        return Number(reader.getString());
    }
}

class StringWrapper {
    value;

    constructor(value) {
        this.value = value;
    }

    serialize(writer) {
        writer.putString(escape(this.value));
    }

    static deserialize(reader) {
        return unescape(reader.getString());
    }

    reference(writer) {
        writer.putString(escape(this.value));
    }

    static dereference(reader) {
        return unescape(reader.getString());
    }
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

module.exports.BooleanWrapper = BooleanWrapper;
module.exports.NumberWrapper = NumberWrapper;
module.exports.StringWrapper = StringWrapper;